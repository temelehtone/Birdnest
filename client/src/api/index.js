import axios from "axios";

const API = axios.create({ 
  baseURL: process.env.PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true
});

export const getDroneData = () => API.get(`/getDroneData`);
export const getPilots = () => API.get(`/getPilots`);
