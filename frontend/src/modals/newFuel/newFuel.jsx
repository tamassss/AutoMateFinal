import { useState } from "react";
import Button from "../../components/button/button";
import LabeledInput from "../../components/labeledInput/labeledInput";
import Modal from "../../components/modal/modal";
import { clampNumberInput } from "../../actions/shared/inputValidation";
import SuccessModal from "../../components/success-modal/successModal";

export default function NewFuel({ onClose, onSave }) {
    // Állapotok
    const [liters, setLiters] = useState("");
    const [pricePerLiter, setPricePerLiter] = useState("");
    const [odometerKm, setOdometerKm] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Mentés 
    async function handleSave(event) {
        event.preventDefault();
        setError("");
        setFieldErrors({});

        // Validáció
        const tempErrors = {};
        if (!liters) tempErrors.liters = "A mennyiség megadása kötelező!";
        if (!pricePerLiter) tempErrors.pricePerLiter = "Az ár/liter megadása kötelező!";

        if (Object.keys(tempErrors).length > 0) {
            setFieldErrors(tempErrors);
            return;
        }

        const l = Number(liters);
        const p = Number(pricePerLiter);
        const numericErrors = {};

        if (Number.isNaN(l) || l < 1 || l > 100) {
            numericErrors.liters = "A mennyiség 1 és 100 liter között lehet.";
        }
        if (Number.isNaN(p) || p < 1 || p > 1000) {
            numericErrors.pricePerLiter = "Az ár/liter 1 és 1000 között lehet.";
        }
        
        if (odometerKm !== "") {
            const o = Number(odometerKm);
            if (Number.isNaN(o) || o < 0 || o > 999999) {
                numericErrors.odometerKm = "A km óra állás 0 és 999999 között lehet.";
            }
        }

        if (Object.keys(numericErrors).length > 0) {
            setFieldErrors(numericErrors);
            return;
        }

        try {
            setIsSaving(true);
            
            // Adatok összeállítása
            const fuelData = {
                liters: l,
                pricePerLiter: p,
                spent: Number((l * p).toFixed(0)),
                odometerKm: odometerKm ? Number(odometerKm) : null,
                date: new Date().toISOString(),
            };

            await onSave?.(fuelData);
            onClose?.();
        } catch (err) {
            setError(err.message || "Nem sikerült menteni a tankolást.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
            <Modal
                title="Új tankolás"
                onClose={onClose}
                columns={1}
                onSubmit={handleSave}
                footer={<Button text={isSaving ? "Ment..." : "Hozzáadás"} type="submit" />}
            >
                <LabeledInput
                    label="Mennyiség (liter)"
                    type="number"
                    value={liters}
                    min={1}
                    max={100}
                    onChange={function(e) {
                        const val = clampNumberInput(e.target.value, { min: 1, max: 100, decimals: 2 });
                        setLiters(val);
                        if (fieldErrors.liters) {
                            setFieldErrors(function(prev) {
                                return { ...prev, liters: "" };
                            });
                        }
                    }}
                    error={fieldErrors.liters}
                />

                <LabeledInput
                    label="Ft/liter"
                    type="number"
                    value={pricePerLiter}
                    min={1}
                    max={1000}
                    onChange={function(e) {
                        const val = clampNumberInput(e.target.value, { min: 1, max: 1000, decimals: 2 });
                        setPricePerLiter(val);
                        if (fieldErrors.pricePerLiter) {
                            setFieldErrors(function(prev) {
                                return { ...prev, pricePerLiter: "" };
                            });
                        }
                    }}
                    error={fieldErrors.pricePerLiter}
                />

                <LabeledInput
                    label="Km óra állás (opcionális)"
                    type="number"
                    value={odometerKm}
                    min={0}
                    max={999999}
                    onChange={function(e) {
                        const val = clampNumberInput(e.target.value, { min: 0, max: 999999, integer: true });
                        setOdometerKm(val);
                        if (fieldErrors.odometerKm) {
                            setFieldErrors(function(prev) {
                                return { ...prev, odometerKm: "" };
                            });
                        }
                    }}
                    error={fieldErrors.odometerKm}
                />

                {error && <p className="text-danger">{error}</p>}
            </Modal>

            {showSuccess && (
                <SuccessModal
                    description="Tankolás sikeresen elmentve"
                    onClose={function() {
                        setShowSuccess(false);
                        onClose?.();
                    }}
                />
            )}
        </>
    );
}
