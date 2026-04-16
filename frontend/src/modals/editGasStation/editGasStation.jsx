import { useEffect, useState } from "react";
import Button from "../../components/button/button";
import LabeledInput from "../../components/labeledInput/labeledInput";
import Modal from "../../components/modal/modal";
import ErrorModal from "../../components/error-modal/errorModal";
import SuccessModal from "../../components/success-modal/successModal";
import { editFuelingById, editGasStation } from "../../actions/gasStations/gasStationActions";
import { clampNumberInput, limitTextLength } from "../../actions/shared/inputValidation";
import "./editGasStation.css";

export default function EditGasStation({ onClose, onSave, selectedStation }) {
  // üzemanyag fajták
  const FUEL_OPTIONS = [
    { value: "1", label: "95 benzin" },
    { value: "2", label: "100 benzin" },
    { value: "3", label: "Dízel" },
    { value: "4", label: "Dízel Plus" },
  ];
  const SUPPLIER_OPTIONS = ["Auchan", "ORLEN", "MOL", "SHELL"];

  // Állapotok
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [supplier, setSupplier] = useState("");
  const [fuelTypeId, setFuelTypeId] = useState("1");

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // adatok betöltése
  useEffect(function() {
    if (!selectedStation) return;

    setPricePerLiter(selectedStation.literft ? String(selectedStation.literft) : "");
    setCity(selectedStation.stationCity || "");
    setAddress(selectedStation.cim && selectedStation.cim !== "-" ? selectedStation.cim : "");
    setSupplier(selectedStation.supplier || "");
    setFuelTypeId(selectedStation.fuelTypeId ? String(selectedStation.fuelTypeId) : "1");
  }, [selectedStation]);

  // mentés
  async function handleSave(event) {
    event.preventDefault();

    if (!selectedStation?.gasStationId) {
      setServerError("Hiányzik a benzinkút azonosítója.");
      return;
    }

    setServerError("");
    setFieldErrors({});

    // ellenőrzés
    const errors = {};
    if (!pricePerLiter) errors.pricePerLiter = "A Ft/liter megadása kötelező.";
    if (!city) errors.city = "A helység megadása kötelező.";
    if (!address) errors.address = "A cím megadása kötelező.";
    if (!supplier) errors.supplier = "A forgalmazó megadása kötelező.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const parsedPrice = Number(pricePerLiter);
    setIsSaving(true);

    try {
      // Adatok módosítása
      await editGasStation(selectedStation.gasStationId, {
        date: selectedStation.rawDate || null,
        pricePerLiter: parsedPrice,
        supplier: supplier,
        fuelTypeId: Number(fuelTypeId),
        name: selectedStation.stationName || null,
        city: city,
        postal_code: selectedStation.stationPostalCode || null,
        street: address,
        house_number: null,
      });

      // kapcsolódó tankolás frissítése
      let updatedFueling = null;
      if (selectedStation.fuelingId) {
        updatedFueling = await editFuelingById(selectedStation.fuelingId, {
          price_per_liter: parsedPrice,
          supplier: supplier,
          fuel_type_id: Number(fuelTypeId),
        });
      }

      // UI frissítés
      const selectedFuelType = FUEL_OPTIONS.find(function(opt) { 
        return opt.value === String(fuelTypeId); 
      });

      if (typeof onSave === "function") {
        onSave({
          gasStationId: selectedStation.gasStationId,
          fuelingId: selectedStation.fuelingId,
          stationName: selectedStation.stationName || "",
          stationCity: city,
          stationPostalCode: selectedStation.stationPostalCode || "",
          stationStreet: address,
          stationHouseNumber: "",
          literft: updatedFueling?.price_per_liter ?? parsedPrice,
          supplier: updatedFueling?.supplier ?? supplier,
          fuelTypeId: updatedFueling?.fuel_type_id ?? Number(fuelTypeId),
          fuelType: updatedFueling?.fuel_type || selectedFuelType?.label || "-",
        });
      }

      onClose?.();
    } catch (err) {
      setServerError(err.message || "Nem sikerült módosítani a benzinkutat.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Modal
        title="Benzinkút módosítása"
        onClose={onClose}
        columns={1}
        onSubmit={handleSave}
        footer={<Button text={isSaving ? "Mentés..." : "Módosítás"} type="submit" />}
      >
        <LabeledInput
          label="Ft/liter"
          type="number"
          value={pricePerLiter}
          onChange={function(e) {
            setPricePerLiter(clampNumberInput(e.target.value, { min: 1, max: 1000, decimals: 2 }));
            if (fieldErrors.pricePerLiter) setFieldErrors({ ...fieldErrors, pricePerLiter: "" });
          }}
          error={fieldErrors.pricePerLiter}
        />

        <LabeledInput
          label="Helység"
          value={city}
          onChange={(e) => setCity(limitTextLength(e.target.value, 20))}
          error={fieldErrors.city}
        />

        <LabeledInput
          label="Cím"
          value={address}
          onChange={(e) => setAddress(limitTextLength(e.target.value, 20))}
          error={fieldErrors.address}
        />

        <div className="full-width text-start modal-select-group">
          <label className="modal-select-label">Forgalmazó</label>
          {fieldErrors.supplier && <span className="error-message">{fieldErrors.supplier}</span>}
          <select
            value={supplier}
            className="modal-select"
            onChange={function(e) {
              setSupplier(e.target.value);
              if (fieldErrors.supplier) setFieldErrors({ ...fieldErrors, supplier: "" });
            }}
          >
            {SUPPLIER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="full-width text-start modal-select-group">
          <label className="modal-select-label">Üzemanyag típusa</label>
          {fieldErrors.fuelTypeId && <span className="error-message">{fieldErrors.fuelTypeId}</span>}
          <select
            value={fuelTypeId}
            className="modal-select"
            onChange={function(e) {
              setFuelTypeId(e.target.value);
              if (fieldErrors.fuelTypeId) setFieldErrors({ ...fieldErrors, fuelTypeId: "" });
            }}
          >
            {FUEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </Modal>

      {/* MODALS */}
      {serverError && (
        <ErrorModal title="Hiba!" description={serverError} onClose={() => setServerError("")} />
      )}

      {showSuccess && (
        <SuccessModal
          description="Benzinkút sikeresen módosítva"
          onClose={function() {
            setShowSuccess(false);
            onClose?.();
          }}
        />
      )}
    </>
  );
}
