import React from "react";
import ReactDOM from "react-dom";
import FaceLandmarksApp from "./App"; // Import the FaceLandmarksApp component
import "./index.css"; // Optional for global styling

// Render the app
ReactDOM.render(
  <React.StrictMode>
    <FaceLandmarksApp />
  </React.StrictMode>,
  document.getElementById("root")
);
