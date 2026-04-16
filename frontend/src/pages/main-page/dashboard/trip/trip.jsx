import { useEffect, useState } from "react";
import Button from "../../../../components/button/button";
import { 
  formatGroupedNumber, 
  formatHmsFromSeconds, 
  formatMoney, 
  hhmmToMinutes 
} from "../../../../actions/shared/formatters";
import "./trip.css";

/***** SEGÉDFÜGGVÉNYEK *****/

// Eltelt mp-ek
function getElapsed(runtime) {
  const previousTime = Number(runtime?.elapsedBeforeRunSec || 0);
  if (!runtime?.isRunning || !runtime?.lastStartedAtMs) return previousTime;

  const currentRun = Math.max(0, Math.floor((Date.now() - Number(runtime.lastStartedAtMs)) / 1000));
  return previousTime + currentRun;
}

// éves +/- idő
function getArrivalDelta(expected, actual) {
  if (!expected || !actual || expected === "-" || actual === "-") return null;

  const expectedMinutes = hhmmToMinutes(expected);
  const actualMinutes = hhmmToMinutes(actual);
  
  if (expectedMinutes == null || actualMinutes == null) return null;

  return expectedMinutes - actualMinutes;
}

// --- KOMPONENS ---

export default function Trip({ tripData, onCancelFinish, onSaveFinish, onRuntimeChange }) {
  // állapotok
  const [runtime, setRuntime] = useState(tripData?.runtime || {
    isRunning: true,
    elapsedBeforeRunSec: 0,
    lastStartedAtMs: Date.now(),
    showFinishResult: false,
    actualArrival: null,
  });

  const [currentElapsed, setCurrentElapsed] = useState(getElapsed(runtime));

  // useEffect-ek
  useEffect(() => {
    if (!runtime.isRunning || runtime.showFinishResult) return;

    const timer = setInterval(() => {
      setCurrentElapsed(getElapsed(runtime));
    }, 1000);

    return () => clearInterval(timer);
  }, [runtime]);

  useEffect(() => {
    onRuntimeChange?.(runtime);
  }, [runtime, onRuntimeChange]);

  // számítások
  const distanceKm = tripData?.distanceKm || 0;
  const avgConsumption = tripData?.avgConsumption || 0;
  const expectedLiters = avgConsumption > 0 ? (distanceKm * avgConsumption) / 100 : 0;

  const fuelings = tripData?.fuelings || [];
  const fueledLiters = fuelings.reduce((sum, f) => sum + Number(f.liters || 0), 0);
  const fueledSpent = fuelings.reduce((sum, f) => {
    const spent = f.spent ?? (Number(f.liters || 0) * Number(f.pricePerLiter || 0));
    return sum + Number(spent || 0);
  }, 0);

  const arrivalDelta = getArrivalDelta(tripData?.expectedArrival, runtime.actualArrival);

  // function-ök
  function handlePause() {
    const nextState = {
      ...runtime,
      isRunning: !runtime.isRunning,
      elapsedBeforeRunSec: getElapsed(runtime),
      lastStartedAtMs: !runtime.isRunning ? Date.now() : null,
    };
    setRuntime(nextState);
    setCurrentElapsed(getElapsed(nextState));
  }

  function handleFinish() {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    setRuntime(prev => ({
      ...prev,
      isRunning: false,
      elapsedBeforeRunSec: getElapsed(prev),
      lastStartedAtMs: null,
      showFinishResult: true,
      actualArrival: timeStr,
    }));
  }

  return (
    <div className="ongoing-trip-container mt-1">
      <h2 style={{ color: "#4a9fff" }} className="trip-title">
        {tripData?.title || "Current Trip"}
      </h2>

      <table className="trip-table">
        <tbody>
          <tr>
            <td className="odd field">Indulás</td>
            <td className="odd field">{tripData?.startTime || "-"}</td>
          </tr>
          <tr>
            <td className="even field">Várható érkezés</td>
            <td className="even field">
              {tripData?.expectedArrival || "-"}
              {runtime.showFinishResult && arrivalDelta !== null && (
                <>
                  <br />
                  <span style={{ 
                    color: arrivalDelta >= 0 ? "#44d062" : "#e35b5b", 
                    fontSize: "0.9em",
                    fontWeight: "bold" 
                  }}>
                    {arrivalDelta >= 0 ? `(+${arrivalDelta} perc)` : `(${arrivalDelta} perc)`}
                  </span>
                </>
              )}
            </td>
          </tr>
          <tr>
            <td className="odd field">Út hossza</td>
            <td className="odd field">
              {distanceKm > 0 ? `${formatGroupedNumber(distanceKm, { decimals: 1 })} km` : "-"}
            </td>
          </tr>
          <tr>
            <td className="even field">Várható fogyasztás</td>
            <td className="even field">
              {expectedLiters > 0 ? `${formatGroupedNumber(expectedLiters, { decimals: 2 })} l` : "-"}
            </td>
          </tr>
          <tr>
            <td className="odd field">Tankolások száma</td>
            <td className="odd field">{fuelings.length} db</td>
          </tr>
          <tr>
            <td className="even field">Tankolt mennyiség</td>
            <td className="even field">
              {formatGroupedNumber(fueledLiters, { decimals: 2 })} l
            </td>
          </tr>
          <tr>
            <td className="odd field">Elköltött pénz</td>
            <td className="odd field">{formatMoney(fueledSpent)}</td>
          </tr>
        </tbody>
      </table>

      <div className="trip-timer mt-1">{formatHmsFromSeconds(currentElapsed)}</div>

      <div className="trip-controls">
        {!runtime.showFinishResult ? (
          <>
            <Button 
              className="btn-pause" 
              text={runtime.isRunning ? "Szünet" : "Folytatás"} 
              onClick={handlePause} 
            />
            <Button 
              className="btn-finish" 
              text="Út vége" 
              onClick={handleFinish} 
            />
          </>
        ) : (
          <>
            <Button text="Törlés" onClick={onCancelFinish} />
            <Button 
              text="Mentés" 
              onClick={() => onSaveFinish?.({
                elapsed: formatHmsFromSeconds(currentElapsed),
                distanceKm: distanceKm,
                fueledLiters: fueledLiters,
                fueledSpent: fueledSpent,
                runtime: runtime
              })} 
            />
          </>
        )}
      </div>
    </div>
  );
}
