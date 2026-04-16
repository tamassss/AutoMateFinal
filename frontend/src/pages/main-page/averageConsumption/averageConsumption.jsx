import { useEffect, useState } from "react";
import Card from "../../../components/card/card";
import Navbar from "../../../components/navbar/navbar";
import LabeledInput from "../../../components/labeledInput/labeledInput";
import Button from "../../../components/button/button";
import SuccessModal from "../../../components/success-modal/successModal";
import { editCar } from "../../../actions/cars/carsActions";
import { clampNumberInput } from "../../../actions/shared/inputValidation";
import "./averageConsumption.css";

export default function AverageConsumption() {
    const selectedCarId = localStorage.getItem("selected_car_id") || "default";
    const storageKey = `avg_consumption_form_${selectedCarId}`;

    // Űrlap state
    const [form, setForm] = useState({
        startKm: "",
        endKm: "",
        refueledLiters: ""
    });
    
    const [calculatedAvg, setCalculatedAvg] = useState(null);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Mentett adatok betöltése (ls)
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            setForm({
                startKm: parsed.startKm || "",
                endKm: parsed.endKm || "",
                refueledLiters: parsed.refueledLiters || ""
            });
            setCalculatedAvg(parsed.calculatedAvg || null);
        }
    }, [storageKey]);

    // Automatikus mentés (ls-be)
    useEffect(() => {
        if (form.startKm || form.endKm || form.refueledLiters) {
            localStorage.setItem(storageKey, JSON.stringify({ ...form, calculatedAvg }));
        }
    }, [form, calculatedAvg, storageKey]);

    // Input változás
    const handleInput = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError("");
    };

    // Átlagfogyasztás kiszámítása
    const handleCalculate = (e) => {
        e.preventDefault();
        const { startKm, endKm, refueledLiters } = form;

        if (!startKm || !endKm || !refueledLiters) {
            setError("Minden mezőt tölts ki!");
            return;
        }

        const distance = Number(endKm) - Number(startKm);
        if (distance <= 0) {
            setError("A végső kilométer állás legyen nagyobb!");
            return;
        }

        // Képlet
        const avg = (Number(refueledLiters) / distance) * 100;
        if (avg > 100) {
            setCalculatedAvg(null);
            setError("Az átlagfogyasztás nem lehet több 100-nál.");
            return;
        }
        setCalculatedAvg(Number(avg.toFixed(2)));
    };

    // Mentés az autóhoz
    const handleSaveToCar = async () => {
        if (!selectedCarId || selectedCarId === "default") {
            setError("Nincs kiválasztott autó.");
            return;
        }

        setIsSaving(true);
        try {
            await editCar(selectedCarId, { average_consumption: calculatedAvg });
            setShowSuccess(true);
        } catch (err) {
            setError("Hiba a mentés során.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="align-middle">
            <Navbar backTo="/muszerfal" />

            <div className="container avg-cons-div">
                <h1 className="text-center custom-title">Átlagfogyasztás</h1>
                <h3 className="text-center mb-3 custom-subtitle">
                    Számold ki autód valós fogyasztását.
                </h3>

                <div className="row justify-content-center">
                    <div className="col-12 col-md-10 col-lg-7">
                        <Card>
                            <div className="p-3 text-start">
                                <form onSubmit={handleCalculate}>
                                    {/* 1. Lépés */}
                                    <div className="mt-2">
                                        <p><span className="step-span">1. lépés:</span> Tankold tele az autót, majd add meg:</p>
                                        <div className="mt-3 col-12 col-sm-6 mx-auto">
                                            <LabeledInput
                                                label="Kezdő km állás"
                                                type="number"
                                                value={form.startKm}
                                                onChange={e => handleInput("startKm", clampNumberInput(e.target.value, { min: 0, max: 999999, integer: true }))}
                                            />
                                        </div>
                                    </div>

                                    <hr />

                                    {/* 2. Lépés */}
                                    <div>
                                        <p><span className="step-span">2. lépés:</span> Utazz az autóval valamennyit</p>
                                        <p style={{opacity:"0.6"}}>(minél nagyobb távot teszel meg, annál pontosabb az eredmény)</p>
                                    </div>

                                    <hr />

                                    {/* 3. Lépés */}
                                    <div>
                                        <p><span className="step-span">3. lépés:</span>Ismét tankold tele az autót, majd add meg:</p>
                                        <div className="row g-3 mt-2">
                                            <div className="col-12 col-sm-6">
                                                <LabeledInput
                                                    label="Végső km állás"
                                                    type="number"
                                                    value={form.endKm}
                                                    onChange={e => handleInput("endKm", clampNumberInput(e.target.value, { min: 0, max: 999999, integer: true }))}
                                                />
                                            </div>
                                            <div className="col-12 col-sm-6">
                                                <LabeledInput
                                                    label="Tankolt liter"
                                                    type="number"
                                                    value={form.refueledLiters}
                                                    onChange={e => handleInput("refueledLiters", clampNumberInput(e.target.value, { min: 0, max: 200, decimals: 2 }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center mt-4">
                                        <Button text="Kalkulálás" type="submit" />
                                    </div>
                                </form>

                                {/* Eredmény megjelenítése */}
                                <div className="text-center btn-div d-flex flex-column gap-2 mt-3">
                                    {calculatedAvg != null && (
                                        <>
                                            <p className="fs-5">
                                                Eredmény: <strong>{calculatedAvg} l/100 km</strong>
                                            </p>
                                            <Button
                                                text={isSaving ? "Mentés..." : "Mentés az autóhoz"}
                                                onClick={handleSaveToCar}
                                            />
                                        </>
                                    )}
                                    {error && <p className="text-danger m-0">{error}</p>}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {showSuccess && (
                <SuccessModal
                    description="Átlagfogyasztás elmentve!"
                    onClose={() => setShowSuccess(false)}
                />
            )}
        </div>
    );
}
