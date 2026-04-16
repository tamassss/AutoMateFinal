import { useState } from "react";
import Button from "../../components/button/button";
import LabeledInput from "../../components/labeledInput/labeledInput";
import Modal from "../../components/modal/modal";
import { clampNumberInput, limitTextLength } from "../../actions/shared/inputValidation";
import SuccessModal from "../../components/success-modal/successModal";

export default function NewEvent({ onClose, onSave }) {
    const today = new Date().toISOString().split("T")[0];
    
    // Állapotok
    const [eventName, setEventName] = useState("");
    const [date, setDate] = useState(today);
    const [km, setKm] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Mentés
    async function handleSave(event) {
        event.preventDefault();
        setError("");
        setFieldErrors({});

        // Validáció
        const tempErrors = {};
        if (!eventName.trim()) tempErrors.eventName = "Az esemény neve kötelező!";
        if (!date) tempErrors.date = "Az időpont megadása kötelező!";
        if (date && date < today) tempErrors.date = "Múltbeli dátum nem adható meg!";

        if (Object.keys(tempErrors).length > 0) {
            setFieldErrors(tempErrors);
            return;
        }

        try {
            setSaving(true);
            
            // reminder összeállítás
            let reminderValue = null;
            if (km) {
                reminderValue = km + " km";
            }

            await onSave?.({
                partName: eventName,
                date: date,
                reminder: reminderValue,
            });
            
            onClose?.();
        } catch (err) {
            setError(err.message || "Nem sikerült létrehozni az eseményt.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
        <Modal
            title="Új esemény"
            onClose={onClose}
            columns={1}
            onSubmit={handleSave}
            footer={<Button text={saving ? "Ment..." : "Hozzáadás"} type="submit" />}
        >
            <LabeledInput
                label="Esemény"
                type="text"
                maxLength={25}
                value={eventName}
                onChange={function(e) {
                    setEventName(limitTextLength(e.target.value, 25));
                    if (fieldErrors.eventName) {
                        setFieldErrors(function(prev) {
                            return { ...prev, eventName: "" };
                        });
                    }
                }}
                error={fieldErrors.eventName}
            />

            <LabeledInput
                label="Időpont"
                type="date"
                value={date}
                min={today}
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
                label="Km"
                type="number"
                min={0}
                max={999999}
                value={km}
                onChange={function(e) {
                    setKm(clampNumberInput(e.target.value, { min: 0, max: 999999, integer: true }));
                }}
            />
            
            {error && <p className="text-danger">{error}</p>}
        </Modal>

        {showSuccess && (
            <SuccessModal
                description="Esemény sikeresen hozzáadva"
                onClose={function() {
                    setShowSuccess(false);
                    onClose?.();
                }}
            />
        )}
        </>
    );
}
