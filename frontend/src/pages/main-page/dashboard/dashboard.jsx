import { useEffect, useState, useCallback } from "react";
import { getDashboard } from "../../../actions/dashboard/dashboardActions";
import { getStoredBudgetLimit, setStoredBudgetLimit } from "../../../actions/dashboard/budgetActions";
import { saveFueling, saveTripWithFuelings } from "../../../actions/trips/tripActions";
import { createEvent } from "../../../actions/events/eventActions";
import { hhmmToMinutes } from "../../../actions/shared/formatters";

import Card from "../../../components/card/card";
import Button from "../../../components/button/button";
import Navbar from "../../../components/navbar/navbar";
import DashboardGauge from "./dashboardGauge/dashboardGauge";
import Menu from "./menu/menu";
import Trip from "./trip/trip";
import Fuel from "./fuel/fuel";
import TripInfo from "./tripInfo/tripInfo";
import FuelInfo from "./fuelInfo/fuelInfo";
import SuccessModal from "../../../components/success-modal/successModal";

import NewTrip from "../../../modals/newTrip/newTrip";
import NewFuel from "../../../modals/newFuel/newFuel";
import NewGasStation from "../../../modals/newGasStation/newGasStation";

import "./dashboard.css";

export default function Dashboard() {
  const [showNewFuel, setShowNewFuel] = useState(false);
  const [showNewGasStation, setShowNewGasStation] = useState(false);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentBudgetLimit, setCurrentBudgetLimit] = useState(null);

  //FOLYAMATBAN LÉVŐ ÚT
  // kiolvasása
  const [activeTrip, setActiveTrip] = useState(() => {
    const saved = localStorage.getItem("active_trip_state");
    return saved ? JSON.parse(saved) : null;
  });

  // mentés + törlés (ls)
  const updateActiveTrip = (data) => {
    if (!data) {
      localStorage.removeItem("active_trip_state");
      setActiveTrip(null);
    } else {
      localStorage.setItem("active_trip_state", JSON.stringify(data));
      setActiveTrip(data);
    }
  };

  // ADATOK BETÖLTÉSE
  const loadDashboard = useCallback(async () => {
    try {
      const data = await getDashboard();
      setDashboardData(data);
      setCurrentBudgetLimit(getStoredBudgetLimit() ?? Number(data?.monthly_budget?.limit || 0));
      
      if (data?.selected_car?.odometer_km) {
        localStorage.setItem("selected_car_odometer_km", data.selected_car.odometer_km);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // LIMIT ADATOK SZÁMÍTÁSA
  const spent = Number(dashboardData?.monthly_budget?.spent || 0);
  const limit = currentBudgetLimit ?? getStoredBudgetLimit() ?? Number(dashboardData?.monthly_budget?.limit || 0);

  const budgetInfo = {
    spent,
    limit,
    percent_used: limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0,
  };

  // FUNCTION-ÖK

  const handleRuntimeChange = useCallback(function(runtime) {
    setActiveTrip(function(prev) {
      if (!prev) return prev;
      const updated = { ...prev, runtime };
      // storage + state frissítés
      localStorage.setItem("active_trip_state", JSON.stringify(updated));
      return updated;
    });
  }, []);

  async function handleSaveTrip() {
    if (!activeTrip || isSaving) return;

    setIsSaving(true);
    try {
      const expected = hhmmToMinutes(activeTrip.expectedArrival);
      const actual = hhmmToMinutes(activeTrip.runtime?.actualArrival);
      const delta = (expected == null || actual == null) ? null : expected - actual;

      await saveTripWithFuelings({ ...activeTrip, arrivalDeltaMin: delta });
      
      updateActiveTrip(null); // Törlés mentés után
      await loadDashboard();
      setSuccessMessage("Út sikeresen elmentve");
    } catch (err) {
      alert(err.message || "Sikertelen mentés");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveFuel(fuelData) {
    const carId = activeTrip?.carId || null;
    const result = await saveFueling(fuelData, carId);
    
    // Folyamatban lévő útnál tankolás hozzáadása
    if (activeTrip && !activeTrip.runtime?.showFinishResult) {
      const updatedFuelings = [
        ...(activeTrip.fuelings || []), 
        { ...fuelData, fuelingId: result?.fuelingId }
      ];
      updateActiveTrip({ ...activeTrip, fuelings: updatedFuelings });
    }
    
    await loadDashboard();
    setSuccessMessage("Tankolás sikeresen elmentve");
  }

  function handleStartTrip(tripDetails) {
    const car = dashboardData?.selected_car;
    const newTrip = {
      ...tripDetails,
      carId: car?.car_id || localStorage.getItem("selected_car_id"),
      carDisplayName: car?.display_name || "Nincs autó kiválasztva",
      runtime: {
        isRunning: true,
        elapsedBeforeRunSec: 0,
        lastStartedAtMs: Date.now(),
        showFinishResult: false,
        actualArrival: null,
      },
      fuelings: [],
    };
    updateActiveTrip(newTrip);
    setShowNewTrip(false);
  }

  // VÁLTOZÓK
  const currentCarId = Number(dashboardData?.selected_car?.car_id || 0);
  const tripCarId = Number(activeTrip?.carId || 0);
  const isWrongCar = activeTrip && tripCarId !== currentCarId;

  return (
    <div className="dashboard-layout">
      <div className="menu-content">
        <Menu
          events={dashboardData?.events?.items}
          onEventCreated={async (form) => {
            await createEvent(form);
            loadDashboard();
          }}
        />
      </div>

      <div className="flex-grow-1">
        <Navbar />
        
        <div className="dashboard-header">
          <h1 className="custom-title">
            {dashboardData?.selected_car?.display_name || "Select a car"}
          </h1>
        </div>

        <div className="container-fluid">
          <div className="row g-3 dashboard-main-row">
            
            {/* TRIP CARD */}
            <div className="col-xl-4 col-12">
              <div className="fixed-height-card mb-3">
                <Card>
                  <div className="card-content-wrap justify-content-center">
                    {activeTrip ? (
                      <>
                        {isWrongCar && (
                          <p className="text-warning text-center mb-2">
                            Út ezzel az autóval: <strong>{activeTrip.carDisplayName}</strong>
                          </p>
                        )}
                        <Trip
                          tripData={activeTrip}
                          onCancelFinish={() => updateActiveTrip(null)}
                          onSaveFinish={handleSaveTrip}
                          onRuntimeChange={handleRuntimeChange}
                        />
                      </>
                    ) : (
                      <TripInfo />
                    )}
                  </div>
                  {!activeTrip && (
                    <div className="card-btn">
                      <Button text="Új Út" onClick={() => setShowNewTrip(true)} />
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* BUDGET CARD */}
            <div className="col-xl-4 col-12">
              <div className="fixed-height-card mb-3">
                <Card>
                  <div className="card-content-wrap justify-content-center">
                    <DashboardGauge
                      selectedCar={dashboardData?.selected_car}
                      monthlyBudget={budgetInfo}
                      onSaveLimit={(val) => {
                        const savedLimit = setStoredBudgetLimit(val);
                        setCurrentBudgetLimit(savedLimit);
                        loadDashboard();
                      }}
                    />
                  </div>
                </Card>
              </div>
            </div>

            {/* FUEL CARD */}
            <div className="col-xl-4 col-12">
              <div className="fixed-height-card mb-3">
                <Card>
                  <div className="card-content-wrap justify-content-center">
                    {dashboardData?.latest_fueling ? (
                      <Fuel 
                        fuelingChart={dashboardData.fueling_chart} 
                        latestFueling={dashboardData.latest_fueling} 
                      />
                    ) : (
                      <FuelInfo />
                    )}
                  </div>
                  <div className="card-btn dashboard-fuel-actions">
                    <Button text="Új Tankolás" onClick={() => setShowNewFuel(true)} />
                    <Button text="Új Benzinkút" onClick={() => setShowNewGasStation(true)} />
                  </div>
                </Card>
              </div>
            </div>

          </div>
        </div>

        {/* MODALS */}
        {showNewFuel && (
          <NewFuel onClose={() => setShowNewFuel(false)} onSave={handleSaveFuel} />
        )}
        {showNewGasStation && (
          <NewGasStation
            onClose={() => setShowNewGasStation(false)}
            onSave={async function() {
              await loadDashboard();
              setSuccessMessage("Benzinkút sikeresen elmentve");
            }}
          />
        )}
        {showNewTrip && (
          <NewTrip
            onClose={() => setShowNewTrip(false)}
            avgConsumption={dashboardData?.selected_car?.average_consumption}
            onStart={handleStartTrip}
          />
        )}
        {successMessage && (
          <SuccessModal description={successMessage} onClose={() => setSuccessMessage("")} />
        )}
      </div>
    </div>
  );
}
