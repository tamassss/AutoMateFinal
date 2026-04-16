import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import helpIcon from "../../assets/icons/help.png";
import backIcon from "../../assets/icons/back.png";
import exitIcon from "../../assets/icons//exit.png";
import settingsIcon from "../../assets/icons/settings.png";

import Settings from "../../modals/settings/settings";
import SuccessModal from "../success-modal/successModal";

import "./navbar.css";

export default function Navbar({ backTo = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [token] = useState(localStorage.getItem("token"));
  const isCarsPage = location.pathname === "/autok";
  const isDashboardRoute = location.pathname.startsWith("/muszerfal");

  function goToHomeBySelectedCar() {
    const selectedCarId = localStorage.getItem("selected_car_id");
    if (selectedCarId && selectedCarId !== "default") {
      navigate("/muszerfal");
      return;
    }

    navigate(token ? "/autok" : "/");
  }

  function logout() {
    localStorage.clear();
    navigate("/", {
      state: { successMessage: "Sikeresen kijelentkeztél!" },
    });
  }

  function handleBackClick() {
    if (backTo) {
      navigate(backTo);
      return;
    }
    if (isDashboardRoute) {
      navigate("/autok");
      return;
    }
    navigate(-1);
  }

  return (
    <>
      <nav className="custom-navbar">
        {isCarsPage && (
          <div className="settings-div" onClick={() => setShowSettings(true)}>
            <img className="settings-icon" src={settingsIcon} alt="Beállítások" />
          </div>
        )}

        {!isCarsPage && (
          <div className={"nav-icons-div"} onClick={handleBackClick}>
            <img className={"nav-icons"} src={backIcon} alt={"Vissza"} />
          </div>
        )}

        <div className="nav-title-div">
          <p className="brand" onClick={goToHomeBySelectedCar}>
            Auto<span className="mate-span">Mate</span>
          </p>
        </div>

        {token && (
          <div className={"nav-icons-div"} onClick={logout}>
            <img className={"nav-icons"} src={exitIcon} alt={"Kilépés"} />
          </div>
        )}

        <div className="help-div">
          <Link to="/tippek" className="help-link">
            <img src={helpIcon} alt="Segítség kezdőknek" title="Segítség kezdőknek" />
          </Link>
        </div>
      </nav>

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSaved={function() {
            setSuccessMessage("Sikeres módosítás");
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
    </>
  );
}
