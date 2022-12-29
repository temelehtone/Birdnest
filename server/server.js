import express, { response } from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import xml2js from 'xml2js';

const xmlParser = new xml2js.Parser();

const PORT = 5000;
const app = express();

app.use(cors());
const corsOptions = {
    origin: "http://127.0.0.1:5173",
    credentials: true
};

const DRONE_URL = "https://assignments.reaktor.com/birdnest/drones";

app.get('/getDroneData', cors(corsOptions), async (req, res) => {
    const fetchOptions = {
        method: 'GET'
    }
    fetch(DRONE_URL, fetchOptions).then(response => response.text()).then(data => {
        xmlParser.parseString(data, (err, result) => {
            if (err) {
                console.log(err)
            }
            let drones = result['report']['capture'][0]['drone'];
            res.json(drones);
        });
    }
    )
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});