import { useState } from "react";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import Modal from "../../components/modal/modal";
import { clampNumberInput } from "../../actions/shared/inputValidation";
import SuccessModal from "../../components/success-modal/successModal";

export default function EditLimit({ onClose, onSave, initialLimit = 0 }) {
    const [maxLimit, setMaxLimit] = useState(String(initialLimit || 0));
    const [fieldError, setFieldError] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [savedLimit, setSavedLimit] = useState(null);

    function handleSave(e) {
        e.preventDefault();
        const n = Number(maxLimit);
        if (Number.isNaN(n) || n < 0 || n > 9999999) {
            setFieldError("A maximum limit 0 és 9.999.999 között lehet.");
            return;
        }

        setFieldError("");
        setSavedLimit(n);
        onSave?.(n);
        onClose?.();
    }

    return (
        <>
            <Modal
                title={"Limit"}
                onClose={onClose}
                columns={1}
                onSubmit={handleSave}
                footer={<Button text={"Mentés"} type={"submit"} />}
            >
                <p className="full-width">Mennyit szeretnél költeni üzemanyagra ebben a hónapban?</p>
                <Input
                    type={"number"}
                    value={maxLimit}
                    min={0}
                    max={9999999}
                    onChange={(e) => {
                        setMaxLimit(clampNumberInput(e.target.value, { min: 0, max: 9999999, integer: true }));
                        if (fieldError) setFieldError("");
                    }}
                    error={fieldError}
                />
            </Modal>

            {showSuccess && (
                <SuccessModal
                    description="Sikeres limit módosítás"
                    onClose={() => {
                        setShowSuccess(false);
                        onClose?.();
                    }}
                />
            )}
        </>
    );
}

