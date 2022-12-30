import React from "react";

const PilotsList = ({ pilots }) => {
  return (
    <>
      <table id="pilots">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Alfreds Futterkiste</td>
            <td>Maria Anders</td>
            <td>Germany</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default PilotsList;
