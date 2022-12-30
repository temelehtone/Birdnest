import { useState, useEffect } from 'react'
import './App.css'
import { getDroneData } from "./api/index";
import RadarCanvas from './RadarCanvas';
import PilotsList from './PilotsList';

function App() {
  const [drones, setDrones] = useState([]);
  const [pilots, setPilots] = useState([]);
  
  useEffect(() => {
    setInterval(() => {
      try {
        fetchDrones().then(res => {
          setDrones(res);   
        });
      } catch (error) {
        console.log(error)
      }
    }, 4000)
  }, []);

 
async function fetchDrones() {
  const response = await getDroneData();
  return response.data; 
}

  return (
    <div className="App">
      <div className='app-wrapper'>
        <PilotsList />
        <RadarCanvas drones={drones}/>
      </div>
    </div>
  )
}

export default App
