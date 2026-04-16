import { useEffect, useState } from "react";
import Button from "../../components/button/button";
import LabeledInput from "../../components/labeledInput/labeledInput";
import Modal from "../../components/modal/modal";
import ErrorModal from "../../components/error-modal/errorModal";
import SuccessModal from "../../components/success-modal/successModal";
import { editFuel } from "../../actions/fuelings/fuelingActions";
import { clampNumberInput } from "../../actions/shared/inputValidation";

export default function EditFuel({ onClose, onSave, selectedFuel }) {
  // Állapotok
  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [odometerKm, setOdometerKm] = useState("");

  // Visszajelzések
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ADATOK
  useEffect(function() {
    if (!selectedFuel) return;

    // Meglévő adatok betöltése
    setLiters(selectedFuel.mennyiseg ? String(selectedFuel.mennyiseg) : "");
    setPricePerLiter(selectedFuel.literft ? String(selectedFuel.literft) : "");
    
    const km = selectedFuel.kmallas;
    setOdometerKm(km && km !== "-" ? String(km) : "");
  }, [selectedFuel]);

  // MENTÉS
  async function handleSave(event) {
    event.preventDefault();

    if (!selectedFuel?.id) {
      setServerError("Hiányzik a tankolás azonosítója.");
      return;
    }

    setServerError("");
    setFieldErrors({});

    // validáció
    const errors = {};
    if (!liters) errors.liters = "A mennyiség megadása kötelező.";
    if (!pricePerLiter) errors.pricePerLiter = "A Ft/liter megadása kötelező.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // számmá alakítás
    const parsedLiters = Number(liters);
    const parsedPrice = Number(pricePerLiter);
    const parsedOdometer = odometerKm === "" ? 0 : Number(odometerKm);

    setIsSaving(true);
    try {
      // 3. küldés DB-re
      const updatedFueling = await editFuel(selectedFuel.id, {
        liters: parsedLiters,
        price_per_liter: parsedPrice,
        odometer_km: parsedOdometer,
      });

      if (typeof onSave === "function") {
        onSave({
          id: selectedFuel.id,
          mennyiseg: updatedFueling?.liters ?? parsedLiters,
          literft: updatedFueling?.price_per_liter ?? parsedPrice,
          kmallas: updatedFueling?.odometer_km ?? parsedOdometer,
        });
      }
      
      setShowSuccess(true);
    } catch (err) {
      setServerError(err.message || "Nem sikerült módosítani a tankolást.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Modal
        title="Tankolás módosítása"
        onClose={onClose}
        columns={1}
        onSubmit={handleSave}
        footer={<Button text={isSaving ? "Mentés..." : "Módosítás"} type="submit" />}
      >
        <LabeledInput
          label="Mennyiség (liter)"
          type="number"
          value={liters}
          onChange={function(e) {
            setLiters(clampNumberInput(e.target.value, { min: 1, max: 100, decimals: 2 }));
            if (fieldErrors.liters) setFieldErrors({ ...fieldErrors, liters: "" });
          }}
          error={fieldErrors.liters}
        />

        <LabeledInput
          label="Egységár (Ft/liter)"
          type="number"
          value={pricePerLiter}
          onChange={function(e) {
            setPricePerLiter(clampNumberInput(e.target.value, { min: 1, max: 1000, decimals: 2 }));
            if (fieldErrors.pricePerLiter) setFieldErrors({ ...fieldErrors, pricePerLiter: "" });
          }}
          error={fieldErrors.pricePerLiter}
        />

        <LabeledInput
          label="Km óra állás (opcionális)"
          type="number"
          value={odometerKm}
          onChange={function(e) {
            setOdometerKm(clampNumberInput(e.target.value, { min: 0, max: 999999, integer: true }));
            if (fieldErrors.odometerKm) setFieldErrors({ ...fieldErrors, odometerKm: "" });
          }}
          error={fieldErrors.odometerKm}
        />
      </Modal>

      {/* Hiba */}
      {serverError && (
        <ErrorModal title="Hiba!" description={serverError} onClose={() => setServerError("")} />
      )}

      {/* Siker */}
      {showSuccess && (
        <SuccessModal
          description="Tankolás sikeresen módosítva"
          onClose={function() {
            setShowSuccess(false);
            onClose?.();
          }}
        />
      )}
    </>
  );
}
