import { useState } from "react";
import Button from "../../components/button/button";
import LabeledInput from "../../components/labeledInput/labeledInput";
import Modal from "../../components/modal/modal";
import { clampNumberInput, limitTextLength } from "../../actions/shared/inputValidation";
import SuccessModal from "../../components/success-modal/successModal";

export default function NewService({ onClose, onSave }) {
    const today = new Date().toISOString().split("T")[0];
    
    // Állapotok
    const [partName, setPartName] = useState("");
    const [date, setDate] = useState(today);
    const [cost, setCost] = useState("");
    const [reminderDate, setReminderDate] = useState("");
    const [reminderKm, setReminderKm] = useState("");
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
        if (!partName.trim()) {
            tempErrors.partName = "Az alkatrész megadása kötelező!";
        }
        if (!date) {
            tempErrors.date = "A csere idejének megadása kötelező!";
        }
        if (cost && Number(cost) > 999999999) {
            tempErrors.cost = "Az ár maximum 999999999 lehet.";
        }
        if (reminderDate && reminderDate < today) {
            tempErrors.reminderDate = "Az emlékeztető nem lehet múltbeli!";
        }

        if (Object.keys(tempErrors).length > 0) {
            setFieldErrors(tempErrors);
            return;
        }

        try {
            setIsSaving(true);
            await onSave?.({
                partName: partName.trim(),
                date: date,
                cost: cost,
                ...(reminderDate ? { reminderDate: reminderDate } : {}),
                ...(reminderKm ? { reminderKm: reminderKm } : {}),
            });
            onClose?.();
        } catch (err) {
            setError(err.message || "Nem sikerült menteni a szervizt.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
        <Modal
            title="Új szerviz"
            onClose={onClose}
            columns={1}
            onSubmit={handleSave}
            footer={<Button text={isSaving ? "Ment..." : "Hozzáadás"} type="submit" />}
        >
            <LabeledInput
                label="Alkatrész"
                type="text"
                value={partName}
                maxLength={50}
                onChange={function(e) {
                    setPartName(limitTextLength(e.target.value, 50));
                    if (fieldErrors.partName) {
                        setFieldErrors(function(prev) {
                            return { ...prev, partName: "" };
                        });
                    }
                }}
                error={fieldErrors.partName}
            />

            <LabeledInput
                label="Csere ideje"
                type="date"
                value={date}
                onChange={function(e) {
                    setDate(e.target.value);
                    if (fieldErrors.date) {
                        setFieldErrors(function(prev) {
                            return { ...prev, date: "" };
                        });
                    }
                }}
                error={fieldErrors.date}
            />

            <LabeledInput
                label="Ár"
                type="number"
                min={0}
                max={999999999}
                value={cost}
                onChange={function(e) {
                    const val = clampNumberInput(e.target.value, { min: 0, max: 999999999, integer: true });
                    setCost(val);
                    if (fieldErrors.cost) {
                        setFieldErrors(function(prev) {
                            return { ...prev, cost: "" };
                        });
                    }
                }}
                error={fieldErrors.cost}
            />

            <LabeledInput
                label="Emlékeztető (dátum)"
                type="date"
                value={reminderDate}
                min={today}
                onChange={function(e) {
                    setReminderDate(e.target.value);
                    if (fieldErrors.reminderDate) {
                        setFieldErrors(function(prev) {
                            return { ...prev, reminderDate: "" };
                        });
                    }
                }}
                error={fieldErrors.reminderDate}
            />

            <LabeledInput
                label="Emlékeztető (km)"
                type="number"
                min={0}
                max={999999}
                value={reminderKm}
                onChange={function(e) {
                    const val = clampNumberInput(e.target.value, { min: 0, max: 999999, integer: true });
                    setReminderKm(val);
                }}
            />

            {error && <p className="text-danger">{error}</p>}
        </Modal>

        {showSuccess && (
            <SuccessModal
                description="Szerviz sikeresen hozzáadva"
                onClose={function() {
                    setShowSuccess(false);
                    onClose?.();
                }}
            />
        )}
        </>
    );
}
