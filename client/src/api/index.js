import axios from "axios";

const API = axios.create({ 
  baseURL: "https://birdnest-fzvb.onrender.com",
  withCredentials: true
});

export const getDroneData = () => API.get(`/getDroneData`);
export const getPilots = () => API.get(`/getPilots`);
