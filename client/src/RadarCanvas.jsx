import React, { useRef, useEffect } from "react";

const RadarCanvas = ({ drones }) => {
  const canvasRef = useRef(null);
  let canvas;
  let ctx;
  useEffect(() => {
    
  }, []);

  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext("2d");
    canvas.style.backgroundColor = "white";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxis();
    drawTexts();
    drawRestrictedZone();
    drawDrones();
  }, [drones]);

  const drawAxis = () => {
    // Draw x-axis
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);

    // Draw y-axis
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
  };

  const drawTexts = () => {
    ctx.font = "25px serif";
    ctx.fillStyle = "#000"
    // x-axis texts
    ctx.fillText("0", 5, canvas.height / 2 - 10);
    ctx.fillText("500", canvas.width - 45, canvas.height / 2 - 10);
    // y-axis texts
    ctx.fillText("0", canvas.width / 2 + 10, 25);
    ctx.fillText("500", canvas.width / 2 + 10, canvas.height - 10);
  };

  const drawRestrictedZone = () => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.arc(250, 250, 100, 0, 2 * Math.PI);
    ctx.stroke();   
    ctx.fillStyle = "rgba(161, 32, 32, 0.3)"
    ctx.fill();
  }

  const drawDrones = () => {
    ctx.fillStyle = "blue"
    ctx.strokeStyle = "blue";
    drones.forEach(drone => {
        ctx.beginPath();
        ctx.arc(drone.positionX / 1000, drone.positionY / 1000, 5, 0, 2 * Math.PI);
        ctx.fill(); 
    });
  }

  return <canvas ref={canvasRef} width="500px" height="500px" />

};

export default RadarCanvas;
