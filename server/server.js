import express, { response } from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import xml2js from 'xml2js';
import sqlite3 from 'sqlite3';

const xmlParser = new xml2js.Parser();
const SQLITE = sqlite3.verbose();

const PORT = 5000;
const app = express();

app.use(cors());
const corsOptions = {
    origin: "http://127.0.0.1:5173",
    credentials: true
};

let db = new SQLITE.Database('./database.db');
createTables(db);

const DRONE_URL = "https://assignments.reaktor.com/birdnest/drones";
const PILOT_URL = "https://assignments.reaktor.com/birdnest/pilots/";
const MID_COORDS = {
    x: 250000,
    y: 250000
}
const VIOLATION_RADIUS = 100000;

app.get('/getDroneData', cors(corsOptions), async (req, res) => {
    const fetchOptions = {
        method: 'GET'
    }
    fetch(DRONE_URL, fetchOptions).then(response => response.text()).then(data => {
        xmlParser.parseString(data, (err, result) => {
            if (err) {
                console.log(err)
            }
            if (!result) {
                res.json({drones: []});
            }
            let drones = result['report']['capture'][0]['drone'];
            if (false && checkForViolation(drones)) {
                let pilots = getViolatedPilots();
                res.json({drones, pilots })
            } else {
                res.json(drones);
            }
        });
    }
    )
});

const checkForViolation = (drones) => {
    let violated = false;
    drones.forEach(drone => {
        let distance = Math.sqrt(Math.pow(MID_COORDS.x - drone.positionX, 2) + Math.pow(MID_COORDS.y - drone.positionY, 2));
        if (distance <= VIOLATION_RADIUS) {
            addViolatedPilot(drone.serialNumber);
            violated = true;
        }
    });
    return false;
    // return violated;
}
const getViolatedPilots = () => {
    const pilots = db.all(`SELECT * FROM violated_pilots`);

    return pilots;
}
const getViolatedPilot = (pilotId) => {
    let sql = `SELECT pilot_id FROM violated_pilots WHERE pilot_id = ?`;
    const pilot = db.get(sql, [pilotId], (err, row) => {
        if (err) {
            console.log("ERROR: " + err)
        }
        console.log("ROW: " + row);
        return row;
    });
    return true;
}
const updatePilotData = (pilotId) => {
    //console.log("Update Pilot: " + pilotId);
    // let sql = 'UPDATE violated_pilots SET created_at = ?';
    // const pilot = db.run(sql);
    // console.log("Pilot: " + pilot);
    // return pilot;
}


const addViolatedPilot = (serialNumber) => {
    const fetchOptions = {
        method: 'GET'
    }
    fetch(PILOT_URL + `${serialNumber}`, fetchOptions).then(response => response.json()).then(data => {
        console.log("Fetched pilot data: " + data)
        // if (getViolatedPilot(data.pilotId)) {
        //     updatePilotData();
        //     return;
        // } 
        // let name = data.firstName + " " + data.lastName;
        // let values = [data.pilotId, name, data.phoneNumber, data.email]
        // let sql = `INSERT INTO violated_pilots (pilot_id, pilot_name, phone, email) VALUES (?, ?, ?, ?)`
        // db.run(sql, values, (err) => {
        //     if (err) {
        //         console.log(err)
        //     }
        // });
        //  console.log("Added pilot: " + data);
    })
}



app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});

function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS violated_pilots (
            pilot_id varchar(255) NOT NULL PRIMARY KEY,
            pilot_name varchar(255) NOT NULL,
            phone varchar(255) NOT NULL,
            email varchar(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
    );
}