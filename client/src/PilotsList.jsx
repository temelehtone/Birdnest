import React from "react";

const PilotsList = ({ pilots }) => {
  return (
    <div className="scrollable">
    <table id="pilots">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Last seen</th>
        </tr>
      </thead>
      <tbody>
        {pilots &&
          pilots.map((pilot) => (
            <tr key={pilot.pilot_id}>
              <td>{pilot.pilot_name}</td>
              <td>{pilot.phone}</td>
              <td>{pilot.email}</td>
              <td>{new Date(pilot.last_seen).toLocaleTimeString()}</td>
            </tr>
          ))}
      </tbody>
    </table>
    </div>
  );
};

export default PilotsList;
