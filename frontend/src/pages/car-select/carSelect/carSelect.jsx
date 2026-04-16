import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCars, returnSelectedCard } from "../../../actions/cars/carsActions";

import Button from "../../../components/button/button";
import AddCar from "../../../modals/addCar/addCar";
import SuccessModal from "../../../components/success-modal/successModal";
import { getCarImageSrc } from "../../../assets/car-images/carImageOptions";

import plusIcon from "../../../assets/icons/plus.png";
import leftArrow from "../../../assets/icons/left-arrow.png";
import rightArrow from "../../../assets/icons/right-arrow.png";

import "./carSelect.css";

export default function CarSelect({ refreshKey, onCarChange }) {
  const [cars, setCars] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAddCar, setShowAddCar] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [slideDirection, setSlideDirection] = useState("next");
  const navigate = useNavigate();

  // autók DB-ből
  function fetchCars() {
    getCars()
      .then(function(data) {
        setCars(data);
      })
      .catch(function() {
        setCars([]);
      });
  }

  // Frissítés
  useEffect(function() {
    fetchCars();
  }, [refreshKey]);

  // Index 
  useEffect(function() {
    if (cars.length === 0) {
      if (activeIndex !== 0) {
        setActiveIndex(0);
      }
      return;
    }

    if (activeIndex > cars.length - 1) {
      setActiveIndex(cars.length - 1);
    }
  }, [cars.length, activeIndex]);

  useEffect(function() {
    if (cars.length === 0) {
      onCarChange?.(null);
      return;
    }

    const nextIndex = Math.min(activeIndex, cars.length - 1);
    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
      return;
    }

    onCarChange?.(cars[nextIndex]);
  }, [cars, activeIndex, onCarChange]);

  // Üres állapot
  if (cars.length === 0) {
    return (
      <div className="car-select-empty d-flex justify-content-center w-100">
        <div className="main-image" onClick={function() { setShowAddCar(true); }}>
          <img src={plusIcon} alt="Új" className="main-car-img" style={{ width: "30%" }} />
        </div>
        {showAddCar && (
          <AddCar
            onClose={function() { setShowAddCar(false); }}
            onSave={function() {
              fetchCars();
              setShowAddCar(false);
              setSuccessMessage("Sikeres autó felvétel");
            }}
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
      </div>
    );
  }

  // Indexek számítása
  const safeIndex = Math.min(activeIndex, cars.length - 1);
  const leftIndex = safeIndex === 0 ? cars.length - 1 : safeIndex - 1;
  const rightIndex = safeIndex === cars.length - 1 ? 0 : safeIndex + 1;

  const current = cars[safeIndex];
  const leftCar = cars[leftIndex];
  const rightCar = cars[rightIndex];
  const isLongPlate = String(current?.license_plate || "").length >= 8;

  // Kötvetkező autó
  function nextCar() {
    setSlideDirection("next");
    if (safeIndex === cars.length - 1) {
      setActiveIndex(0);
    } else {
      setActiveIndex(safeIndex + 1);
    }
  }

  // Előző autó
  function prevCar() {
    setSlideDirection("prev");
    if (safeIndex === 0) {
      setActiveIndex(cars.length - 1);
    } else {
      setActiveIndex(safeIndex - 1);
    }
  }

  // Kiválasztás + navigálás
  function handleSelect() {
    if (!current?.car_id) return;
    returnSelectedCard(current.car_id);
    onCarChange?.(current);
    navigate("/muszerfal");
  }

  return (
    <div className="car-select">
      <div className="car-layout">
        {/* Bal oldal */}
        <div className="side left" onClick={prevCar}>
          {cars.length > 1 && (
            <div className="mobile-arrow">
              <img src={leftArrow} alt="Bal" />
            </div>
          )}
          {cars.length > 1 && (
            <div className="side-content desktop">
              <div className="side-image">
                <img src={getCarImageSrc(leftCar.car_image)} alt="bal-auto" />
              </div>
              <p className="side-name">{leftCar.display_name}</p>
            </div>
          )}
        </div>

        {/* Középső */}
        <div
          key={safeIndex}
          className={"main-car " + (slideDirection === "next" ? "slide-from-right" : "slide-from-left")}
        >
          <div className="main-image" onClick={handleSelect}>
            <img src={getCarImageSrc(current.car_image)} alt="fő-auto" className="main-car-img" />
          </div>

          <div className="main-info">
            <h2 className="main-title">{current.display_name}</h2>

            <div className="license-outer">
              <div className="license-inner">
                <div className="license-blue" />
                <div className="license-white">
                  <p className={"license-plate " + (isLongPlate ? "license-plate-long" : "")}>
                    {current.license_plate}
                  </p>
                </div>
              </div>
            </div>

            <Button text="Kiválasztás" onClick={handleSelect} className="select-btn" />
          </div>
        </div>

        {/* Jobb oldal */}
        <div className="side right" onClick={nextCar}>
          {cars.length > 1 && (
            <div className="mobile-arrow">
              <img src={rightArrow} alt="Jobb" />
            </div>
          )}
          {cars.length > 1 && (
            <div className="side-content desktop">
              <div className="side-image">
                <img src={getCarImageSrc(rightCar.car_image)} alt="jobb-auto" />
              </div>
              <p className="side-name">{rightCar.display_name}</p>
            </div>
          )}
        </div>
      </div>
      {successMessage && (
        <SuccessModal
          description={successMessage}
          onClose={function() {
            setSuccessMessage("");
          }}
        />
      )}
    </div>
  );
}
