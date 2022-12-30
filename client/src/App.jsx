import { useState, useEffect } from "react";
import "./App.css";
import { getDroneData, getPilots } from "./api/index";
import RadarCanvas from "./RadarCanvas";
import PilotsList from "./PilotsList";

function App() {
  const [drones, setDrones] = useState([]);
  const [pilots, setPilots] = useState([]);

  useEffect(() => {
    try {
      fetchPilots().then((res) => {
        setPilots(res.pilots);
      });
      fetchData();
      setInterval(() => fetchData(), 2000);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchData = () => {
    fetchDrones().then((res) => {
      if (res.pilots) {
        setPilots(res.pilots);
        setDrones(res.drones);
      } else {
        setDrones(res);
      }
    });
  };

  async function fetchDrones() {
    const response = await getDroneData();
    return response.data;
  }
  async function fetchPilots() {
    const response = await getPilots();
    return response.data;
  }

  return (
    <div className="App">
      <div className="app-wrapper">
        <PilotsList pilots={pilots} />
        <RadarCanvas drones={drones} />
      </div>
    </div>
  );
}

export default App;
