import React from "react";
import WeatherCard from "../components/weather/WeatherCard";
import MapView from "../components/weather/MapView";
import ShelterList from "../components/weather/ShelterList";
import "../styles/WeatherPage.css";

export default function WeatherPage() {
  
  return (
    <div className="weatherpage">
    <header className="weather-header">
                <div className="header-left">
                    <h1 className="title">Seoul AI Weather</h1>
                </div>
    </header>

    <div className="weather-page-container">
      <div className="main-content">
        <div className="map-view-section">
          <MapView />
        </div>
      
        <div className="side-panel">
          <div className="top-card">
            <WeatherCard />
          </div>
          <div className="bottom-list">
            <ShelterList  />
          </div>
        </div>
      </div>
    </div> 
    </div> 
  );
}


