import axios from "axios";

const API = axios.create({ 
  baseURL: "http://localhost:5000",
  withCredentials: true
});

export const getDroneData = () => API.get(`/getDroneData`);