import { useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../../../components/navbar/navbar";
import Button from "../../../components/button/button";
import EditCar from "../../../modals/editCar/editCar";
import AddCar from "../../../modals/addCar/addCar";
import DeleteCar from "../../../modals/deleteCar/deleteCar";
import CarSelect from "../carSelect/carSelect";
import Settings from "../../../modals/settings/settings";
import SuccessModal from "../../../components/success-modal/successModal";

import "./cars.css";

export default function Cars() {
  const fullName = localStorage.getItem("full_name") || "Felhasználó";
  const role = localStorage.getItem("role");

  // Modal állapotok
  const [showAddCar, setShowAddCar] = useState(false);
  const [showEditCar, setShowEditCar] = useState(false);
  const [showDeleteCar, setShowDeleteCar] = useState(false);
  const [showSetting, setShowSettings] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Adatok
  const [selectedCar, setSelectedCar] = useState(null);
  const [deleteTargetCar, setDeleteTargetCar] = useState(null);

  // Frissítés
  const [refreshKey, setRefreshKey] = useState(0);

  function triggerRefresh() {
    setRefreshKey(function(prev) {
      return prev + 1;
    });
  }

  return (
    <>
      <Navbar />
      <div className="cars-page-content">

      {role === "admin" && (
        <div className="cars-admin-link-wrap">
          <Link className="cars-admin-link" to="/admin">
            Admin felület
          </Link>
        </div>
      )}

      {/* Beállítások */}
      {showSetting && (
        <Settings 
          onClose={function() {
            setShowSettings(false);
          }} 
          onSaved={function() {
            setSuccessMessage("Sikeres módosítás");
          }}
        />
      )}

      <h1 className="title fs-1 mt-3">{fullName}</h1>
      <h2 className="subtitle fw-4 opacity-75">garázsa</h2>

      <div className="cars-select-wrap">
        {/* Autó választó */}
        <CarSelect 
          refreshKey={refreshKey} 
          onCarChange={setSelectedCar} 
        />
      </div>

      <div className="cars-buttons">
        <div className="cars-button-item">
          <Button
            text="Módosítás"
            onClick={function() {
              setShowEditCar(true);
            }}
            disabled={!selectedCar}
            className={!selectedCar ? "unavailable" : ""}
          />
        </div>

        <div className="cars-button-item">
          <Button 
            text="Új autó" 
            onClick={function() {
              setShowAddCar(true);
            }} 
          />
        </div>

        <div className="cars-button-item">
          <Button
            text="Törlés"
            onClick={function() {
              setDeleteTargetCar(selectedCar);
              setShowDeleteCar(true);
            }}
            disabled={!selectedCar}
            className={!selectedCar ? "unavailable" : ""}
          />
        </div>
      </div>
      </div>
      
      {/* Autó szerkesztése */}
      {showEditCar && (
        <EditCar 
          onClose={function() {
            setShowEditCar(false);
          }} 
          onSave={function() {
            triggerRefresh();
            setSuccessMessage("Sikeres módosítás");
          }} 
          selectedCar={selectedCar} 
        />
      )}

      {/* Új autó hozzáadása */}
      {showAddCar && (
        <AddCar 
          onClose={function() {
            setShowAddCar(false);
          }} 
          onSave={function() {
            triggerRefresh();
            setSuccessMessage("Sikeres autó felvétel");
          }} 
        />
      )}

      {/* Autó törlése */}
      {showDeleteCar && deleteTargetCar && (
        <DeleteCar
          onClose={function() {
            setShowDeleteCar(false);
            setDeleteTargetCar(null);
          }}
          onDeleted={function() {
            setSelectedCar(null);
            triggerRefresh();
            setSuccessMessage("Autó törölve");
          }}
          carId={deleteTargetCar.car_id}
          displayName={deleteTargetCar.display_name}
          licensePlate={deleteTargetCar.license_plate}
        />
      )}

      {successMessage && (
        <SuccessModal
          description={successMessage}
          onClose={function() {
            setSuccessMessage("");
          }}
        />
      )}
    </>
  );
}
