import { useState, useEffect } from 'react'
import './App.css'
import { getDroneData } from "./api/index";

function App() {
  const [drones, setDrones] = useState([]);
  
  useEffect(() => {
    setInterval(() => {
      try {
        fetchDrones().then(res => {
          setDrones(res);
        });
      } catch (error) {
        console.log(error)
      }
    }, 2000)
  }, []);

 
async function fetchDrones() {
  const response = await getDroneData();
  return response.data; 
}

  return (
    <div className="App">
      {drones.map(drone => (
        <h1>{drone.positionY}</h1>
      ))}
    </div>
  )
}

export default App
