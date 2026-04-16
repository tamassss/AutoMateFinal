import { useState } from "react";
import DashboardLight from "./dashboardLight";
import { lights } from "./lightsData";
import Navbar from "../../../../components/navbar/navbar";

import "./dashboardLights.css";

export default function DashboardLights() {
  // Kiválasztott index
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedLight = lights[selectedIndex];

  return (
    <>
      <Navbar />
      <div className="container dashboard-lights-container">
        <h1 className="dashboard-lights-title">Műszerfal jelzések</h1>

        {/* Aktuális jelzés */}
        <DashboardLight light={selectedLight} />

        {/* választó */}
        <div className="dashboard-lights-gallery">
          {lights.map((light, index) => (
            <button
              key={index}
              type="button"
              className={`dashboard-lights-thumb ${selectedIndex === index ? "is-active" : ""}`}
              onClick={() => setSelectedIndex(index)}
              aria-label={light.title}
              aria-pressed={selectedIndex === index}
            >
              <img src={light.img} alt={light.title} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}