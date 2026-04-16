import { useEffect, useState } from "react";

import Navbar from "../../../../components/navbar/navbar";
import GasStationCard from "../../../../components/gas-station-card/gasStationCard";
import SuccessModal from "../../../../components/success-modal/successModal";
import Menu from "../../dashboard/menu/menu";
import { getGasStations } from "../../../../actions/gasStations/gasStationActions";
import {
  createShareRequest,
  getCurrentUserMeta,
  getShareStatusesByCar,
  isCommunityEnabledForCar,
  revokeShareRequest,
} from "../../../../actions/community/communityLocalActions";

import "./gasStations.css";
import "../menuLayout.css";

export default function GasStations() {
  const [stations, setStations] = useState([]);
  const [error, setError] = useState(""); 
  const [communityEnabled, setCommunityEnabled] = useState(false); 
  const [shareStatuses, setShareStatuses] = useState({}); 
  const [successMessage, setSuccessMessage] = useState("");

  const { userId } = getCurrentUserMeta();
  const selectedCarId = Number(localStorage.getItem("selected_car_id") || 0);

  // ADATOK BETÖLTÉSE
  useEffect(function() {
    // adatok DB-ből
    async function loadData() {
      try {
        const [stationsData, enabled] = await Promise.all([
          getGasStations(),
          isCommunityEnabledForCar(userId, selectedCarId),
        ]);
        
        setStations(stationsData);
        setCommunityEnabled(enabled);
        
        if (enabled && selectedCarId) {
          const statuses = await getShareStatusesByCar(selectedCarId);
          setShareStatuses(statuses);
        } else {
          setShareStatuses({});
        }
      } catch (err) {
        setError(err.message || "Nem sikerült betölteni a benzinkutakat.");
      }
    }

    // státusz megváltozik
    function handleCommunitySettingsChanged(event) {
      const changedCarId = Number(event?.detail?.carId || 0);
      if (changedCarId !== selectedCarId) {
        return;
      }

      const enabled = !!event?.detail?.enabled;
      setCommunityEnabled(enabled);

      if (!enabled) {
        setShareStatuses({});
        return;
      }

      getShareStatusesByCar(selectedCarId)
        .then(function(statuses) {
          setShareStatuses(statuses);
        })
        .catch(function() {
          setShareStatuses({});
        });
    }

    loadData();
    window.addEventListener("community-settings-changed", handleCommunitySettingsChanged);
    
    // EventListener eltávolítása
    return function() {
      window.removeEventListener("community-settings-changed", handleCommunitySettingsChanged);
    };
  }, [selectedCarId, userId]);

  // FUNCTION-ök

  // Benzinkút törlése
  function handleDeletedGasStation(deletedId) {
    setStations(function(prev) {
      return prev.filter(function(s) {
        return s.gasStationId !== deletedId;
      });
    });
    setSuccessMessage("Benzinkút törölve");
  }

  // Benzinkút módosítása
  function handleUpdatedGasStation(updatedStation) {
    function buildAddress(s) {
      const parts = [s.stationStreet, s.stationHouseNumber].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(" ");
      }
      return s.stationName || "-";
    }

    setStations(function(prev) {
      return prev.map(function(s) {
        if (s.gasStationId !== updatedStation.gasStationId) {
          return s;
        }
        const next = {
          ...s,
          ...updatedStation,
          helyseg: updatedStation.stationCity || "-",
        };
        return {
          ...next,
          cim: buildAddress(next),
        };
      });
    });
    setShareStatuses(function(prev) {
      const stationId = Number(updatedStation.gasStationId);
      if (!prev[stationId] || prev[stationId] === "pending") {
        return prev;
      }
      return { ...prev, [stationId]: "pending" };
    });
    setSuccessMessage("Benzinkút sikeresen módosítva");
  }

  // Megosztás toggle
  async function handleShareToggle(station) {
    if (!communityEnabled || !selectedCarId || !userId) {
      return "";
    }
    const stationId = Number(station.gasStationId);
    const currentStatus = shareStatuses[stationId] || "none";

    if (currentStatus === "pending" || currentStatus === "approved") {
      await revokeShareRequest({
        carId: selectedCarId,
        gasStationId: stationId,
      });
      setShareStatuses(function(prev) {
        const next = { ...prev };
        delete next[stationId];
        return next;
      });
      return "Megosztás visszavonva";
    }

    // Kérelem létrehozása
    await createShareRequest({
      carId: selectedCarId,
      gasStation: station,
    });
    setShareStatuses(function(prev) {
      return { ...prev, [stationId]: "pending" };
    });
    return "Benzinkút megosztva";
  }

  // Megosztás gomb felirata
  function getButtonText(station) {
    const status = shareStatuses[Number(station.gasStationId)] || "none";
    if (status === "pending" || status === "approved") {
      return "Visszavonás";
    }
    return "Megosztás";
  }

  function getShareStatus(station) {
    const status = shareStatuses[Number(station.gasStationId)] || "none";
    if (status === "pending") {
      return { text: "függőben", type: "pending" };
    }
    if (status === "approved") {
      return { text: "megosztva", type: "approved" };
    }
    return null;
  }

  return (
    <div className="main-menu-layout">
      <div className="main-menu-content">
        <Menu />
      </div>

      <div className="flex-grow-1">
        <Navbar />

        <div className="container py-5">
          <h1 className="text-center text-primary mb-5 fw-bold">Benzinkutak</h1>
          
          {/* Hiba */}
          {error && <p className="text-danger text-center">{error}</p>}
          
          {/* Üres lista */}
          {stations.length === 0 && !error && (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "40vh" }}>
              <p className="fs-4 text-light">Még nincsenek mentett benzinkutak.</p>
            </div>
          )}

          {/* elrendezés */}
          <div className="row g-4 justify-content-center">
            {stations.map(function(station) {
              const shareStatus = communityEnabled ? getShareStatus(station) : null;
              return (
                <div key={station.id} className="col-11 col-md-6 col-lg-4 d-flex justify-content-center">
                  <GasStationCard
                    station={station}
                    onDeleted={handleDeletedGasStation}
                    onUpdated={handleUpdatedGasStation}
                    shareStatusText={shareStatus?.text || ""}
                    shareStatusType={shareStatus?.type || ""}
                    extraButtonText={communityEnabled ? getButtonText(station) : ""}
                    onExtraButtonClick={async function() {
                      try {
                        const message = await handleShareToggle(station);
                        if (message) {
                          setSuccessMessage(message);
                        }
                      } catch (err) {
                        setError(err.message || "Nem sikerült kezelni a megosztást.");
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Siker */}
      {successMessage && (
        <SuccessModal 
          description={successMessage} 
          onClose={function() { setSuccessMessage(""); }} 
        />
      )}
    </div>
  );
}
