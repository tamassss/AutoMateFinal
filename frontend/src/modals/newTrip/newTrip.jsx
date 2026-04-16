import { useState } from "react";
import Button from "../../components/button/button";
import LabeledInput from "../../components/labeledInput/labeledInput";
import Modal from "../../components/modal/modal";
import { estimateRoute } from "../../actions/trips/routeEstimateActions";
import { formatHHMMFromDate } from "../../actions/shared/formatters";
import "./newTrip.css";

// nagykapitális
function toTitleCase(value) {
    if (!value) return "";
    
    // ha több szóból áll
    const parts = String(value).trim().split(" ");
    const formattedParts = [];

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.length > 0) {
            // nagykapitális
            const upperFirst = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            formattedParts.push(upperFirst);
        }
    }

    return formattedParts.join(" ");
}

export default function NewTrip({ onClose, avgConsumption, onStart }) {
    // Beviteli mezők 
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // útvonal becslés API-val
    async function handleEstimate() {
        setError("");
        setFieldErrors({});
        setResult(null);

        // Validáció
        const tempErrors = {};
        if (!from.trim()) tempErrors.from = "A kiindulási hely megadása kötelező!";
        if (!to.trim()) tempErrors.to = "A célállomás megadása kötelező!";

        if (Object.keys(tempErrors).length > 0) {
            setFieldErrors(tempErrors);
            return;
        }

        setLoading(true);
        try {
            const data = await estimateRoute(from, to, avgConsumption);
            setResult(data);
        } catch (err) {
            setError(err.message || "Hiba útvonal számítás közben");
        } finally {
            setLoading(false);
        }
    }

    // út indítása
    function handleStartTrip(event) {
        event.preventDefault();
        
        const tempErrors = {};
        if (!from.trim()) tempErrors.from = "A kiindulási hely megadása kötelező!";
        if (!to.trim()) tempErrors.to = "A célállomás megadása kötelező!";
        
        if (Object.keys(tempErrors).length > 0) {
            setFieldErrors(tempErrors);
            return;
        }

        // csak akkor indulhat út, ha van számítás
        if (!result) {
            setError("Először számold ki az utat.");
            return;
        }

        const now = new Date();
        const arrival = new Date(now.getTime() + result.minutes * 60000);
        
        let avg = null;
        if (avgConsumption !== undefined && avgConsumption !== null && avgConsumption !== "") {
            avg = Number(avgConsumption);
        }
        
        const normalizedFrom = toTitleCase(from);
        const normalizedTo = toTitleCase(to);

        // Adatok összeállítása
        onStart?.({
            title: normalizedFrom + " - " + normalizedTo,
            from: normalizedFrom,
            to: normalizedTo,
            startTime: formatHHMMFromDate(now),
            expectedArrival: formatHHMMFromDate(arrival),
            distanceKm: result.km,
            avgConsumption: avg,
            expectedConsumptionLiters: result.liters,
            fuelings: [],
        });

        onClose();
    }

    return (
        <Modal
            title="Új út"
            onClose={onClose}
            columns={1}
            onSubmit={handleStartTrip}
            footer={
                <Button
                    text="Út indítása"
                    type="submit"
                    disabled={!result}
                    className={!result ? "unavailable" : ""}
                />
            }
        >
            <LabeledInput
                label="Honnan"
                type="text"
                value={from}
                placeholder="pl. Budapest"
                onChange={function(e) {
                    setFrom(e.target.value);
                    if (fieldErrors.from) {
                        setFieldErrors(function(prev) {
                            return { ...prev, from: "" };
                        });
                    }
                }}
                error={fieldErrors.from}
            />
            
            <LabeledInput
                label="Hová"
                type="text"
                value={to}
                placeholder="pl. Fót"
                onChange={function(e) {
                    setTo(e.target.value);
                    if (fieldErrors.to) {
                        setFieldErrors(function(prev) {
                            return { ...prev, to: "" };
                        });
                    }
                }}
                error={fieldErrors.to}
            />

            <div style={{ marginTop: "10px" }}>
                <Button 
                    text={loading ? "Számítás..." : "Számítás"} 
                    type="button" 
                    onClick={handleEstimate} 
                />
            </div>

            {error && <p className="text-danger" style={{ marginTop: "10px" }}>{error}</p>}

            {/* Eredmény táblázat megjelenítése, ha van számítás */}
            {result && (
                <div className="new-trip-result-table-wrap">
                    <table className="fuel-table">
                        <tbody>
                            <tr>
                                <td className="odd text-center field estimate-title" colSpan={2}>
                                    Becsült adatok
                                </td>
                            </tr>
                            <tr>
                                <td className="even field">Távolság</td>
                                <td className="even field">{result.km} km</td>
                            </tr>
                            <tr>
                                <td className="odd field">Idő</td>
                                <td className="odd field">{result.minutes} perc</td>
                            </tr>
                            <tr>
                                <td className="even field">Fogyasztás</td>
                                <td className="even field">{result.liters !== null ? result.liters : "-"} l</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
}