import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import xml2js from "xml2js";
import sqlite3 from "sqlite3";
import { config } from "dotenv";

config();

const xmlParser = new xml2js.Parser();
const SQLITE = sqlite3.verbose();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://127.0.0.1:5173",
  credentials: true,
};

app.get('/test', (req, res) => {
  res.status(200).send("Everything is working!");
});

let db = new SQLITE.Database("./database.db");
createTables(db);

// Hack to look like node-postgres
// (and handle async / await operation)
db.query = function (sql, params) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.all(sql, params, function (error, rows) {
      if (error) reject(error);
      else resolve({ rows: rows });
    });
  });
};

const DRONE_URL = "https://assignments.reaktor.com/birdnest/drones";
const PILOT_URL = "https://assignments.reaktor.com/birdnest/pilots/";
const MID_COORDS = {
  x: 250000,
  y: 250000,
};
const VIOLATION_RADIUS = 100000; // 100m
const TIMEOUT_IN_MS = 600 * 1000; // 10 minutes

app.get("/getDroneData", cors(corsOptions), async (req, res) => {
  const fetchOptions = {
    method: "GET",
  };
  fetch(DRONE_URL, fetchOptions)
    .then((response) => response.text())
    .then((data) => {
      xmlParser.parseString(data, async (err, result) => {
        if (err) { 
          console.log(err);
          return res.json({ drones: [] });
        }
        if (!result) {
          return res.json({ drones: [] });
        }
        let drones = result["report"]["capture"][0]["drone"];

        if (checkForViolation(drones)) {
          let pilots = await getViolatedPilots();
          res.json({ drones, pilots });
        } else {
          res.json(drones);
        }
      });
    }).catch(err => {
      console.log("ERROR at getDroneData: " + err);
    });
});

app.get("/getPilots", cors(corsOptions), async (req, res) => {
  let pilots = await getViolatedPilots();
  res.json({ pilots });
});

const checkForViolation = (drones) => {
  let violated = false;
  drones.forEach(async (drone) => {
    let distance = Math.sqrt(
      Math.pow(MID_COORDS.x - drone.positionX, 2) +
        Math.pow(MID_COORDS.y - drone.positionY, 2)
    );
    if (distance <= VIOLATION_RADIUS) {
      addViolatedPilot(drone.serialNumber);
      violated = true;
    }
  });
  return violated;
};
const getViolatedPilots = async () => {
  let sql = `SELECT * FROM pilots;`;
  let pilots = [];
  try {
    pilots = await db.query(sql);
    pilots = checkPilotTime(pilots.rows);
  } catch (err) {
    console.log("ERROR at getViolatedPilot: " + err);
  }
  return pilots;
};

// Removes pilot if 10 minutes since last violation
const checkPilotTime = (pilots) => {
  for (let i = 0; i < pilots.length; i++) {
    const pilot = pilots[i];
    if (
      new Date().getTime() - new Date(pilot.last_seen).getTime() >=
      TIMEOUT_IN_MS
    ) {
      deletePilot(pilot.pilot_id);
      pilots.splice(i, 1);
      i--;
    }
  }
  return pilots;
};

const getViolatedPilot = async (pilotId) => {
  let sql = `SELECT pilot_id FROM pilots WHERE pilot_id = ?;`;
  try {
    return await db.query(sql, [pilotId]);
  } catch (error) {
    console.log("ERROR at getViolatedPilot");
  }
};
const updatePilotData = async (pilotId) => {
  let sql = "UPDATE pilots SET last_seen = ? WHERE pilot_id = ?;";
  try {
    await db.query(sql, [new Date().getTime(), pilotId]);
  } catch (err) {
    console.log("ERROR at updatePilotData: " + err);
  }
};

const deletePilot = async (pilotId) => {
  let sql = "DELETE FROM pilots WHERE pilot_id = ?;";
  try {
    await db.query(sql, [pilotId]);
  } catch (err) {
    console.log("ERROR at deletePilot: " + err);
  }
};

// If pilot already in list, update last_seen, else add pilot to list
const addViolatedPilot = (serialNumber) => {
  const fetchOptions = {
    method: "GET",
  };
  fetch(PILOT_URL + `${serialNumber}`, fetchOptions)
    .then((response) => response.json())
    .then(async (data) => {
      let pilotData = await getViolatedPilot(data.pilotId);
      
      if (pilotData?.rows?.length > 0) {
        updatePilotData(data.pilotId);
      } else {
        let name = data.firstName + " " + data.lastName;
        let values = [data.pilotId, name, data.phoneNumber, data.email];
        let sql = `INSERT INTO pilots (pilot_id, pilot_name, phone, email) VALUES (?, ?, ?, ?);`;
        try {
          await db.query(sql, values);
        } catch (err) {
          console.log("ERROR at adding pilot: " + err);
        }
      }
    })
    .catch((err) => {
      console.log("ERROR at: addViolatedPilot" + err);
    });
};

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

function createTables() {
  db.run(`
        CREATE TABLE IF NOT EXISTS pilots (
            pilot_id varchar(255) NOT NULL PRIMARY KEY,
            pilot_name varchar(255) NOT NULL,
            phone varchar(255) NOT NULL,
            email varchar(255) NOT NULL,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
        );`);
}
