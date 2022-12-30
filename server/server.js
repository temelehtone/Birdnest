import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import xml2js from "xml2js";
import sqlite3 from "sqlite3";

const xmlParser = new xml2js.Parser();
const SQLITE = sqlite3.verbose();

const PORT = 5000;
const app = express();

app.use(cors());
const corsOptions = {
  origin: "http://127.0.0.1:5173",
  credentials: true,
};

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
const VIOLATION_RADIUS = 100000;

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
        }
        if (!result) {
          res.json({ drones: [] });
          return;
        }
        let drones = result["report"]["capture"][0]["drone"];

        if (checkForViolation(drones)) {
          let pilots = await getViolatedPilots();
          res.json({ drones, pilots: pilots.rows });
        } else {
          res.json(drones);
        }
      });
    });
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
  } catch (error) {
    console.log("ERROR at getViolatedPilot");
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

const deletePilot = (pilotId) => {
  let sql =
    "DELETE FROM pilots WHERE `last_seen` &gt; DATE_SUB(NOW(), INTERVAL 10 MINUTE);";
};

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
          console.log("ERROR at: addViolatedPilot" + err);
        }
      }
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
