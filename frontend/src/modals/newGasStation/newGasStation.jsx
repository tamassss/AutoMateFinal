import { useState } from "react";
import Button from "../../components/button/button";
import LabeledInput from "../../components/labeledInput/labeledInput";
import Modal from "../../components/modal/modal";
import { saveNewGasStation } from "../../actions/trips/tripActions";
import { clampNumberInput, limitTextLength } from "../../actions/shared/inputValidation";
import SuccessModal from "../../components/success-modal/successModal";
import "./newGasStation.css";

export default function NewGasStation({ onClose, onSave }) {
  const FUEL_OPTIONS = [
    { value: "1", label: "95 benzin" },
    { value: "2", label: "100 benzin" },
    { value: "3", label: "Diesel" },
    { value: "4", label: "Diesel Plus" },
  ];
  const SUPPLIER_OPTIONS = ["Auchan", "ORLEN", "MOL", "SHELL"];

  // Állapotok
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [fuelTypeId, setFuelTypeId] = useState("");
  const [supplier, setSupplier] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
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
    if (!pricePerLiter) tempErrors.pricePerLiter = "Az ár/liter megadása kötelező!";
    if (!fuelTypeId) tempErrors.fuelTypeId = "Az üzemanyag típus megadása kötelező!";
    if (!supplier) tempErrors.supplier = "A forgalmazó megadása kötelező!";
    if (!city) tempErrors.city = "A helység megadása kötelező!";
    if (!address) tempErrors.address = "A cím megadása kötelező!";

    if (Object.keys(tempErrors).length > 0) {
      setFieldErrors(tempErrors);
      return;
    }

    const price = Number(pricePerLiter);
    if (Number.isNaN(price) || price < 1 || price > 1000) {
      setFieldErrors(function(prev) {
        return { ...prev, pricePerLiter: "A Ft/liter érték 1 és 1000 között lehet." };
      });
      return;
    }

    try {
      setIsSaving(true);
      await saveNewGasStation({
        date: new Date().toISOString(),
        pricePerLiter: price,
        supplier: supplier,
        fuelTypeId: fuelTypeId,
        name: supplier,
        city: city,
        street: address,
      });

      await onSave?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "Nem sikerült menteni a benzinkutat.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Modal
        title="Új benzinkút"
        onClose={onClose}
        columns={1}
        onSubmit={handleSave}
        footer={<Button text={isSaving ? "Mentés..." : "Hozzáadás"} type="submit" />}
      >
        <LabeledInput
          label="Ft/liter"
          type="number"
          required={true}
          value={pricePerLiter}
          min={1}
          max={1000}
          onChange={function(e) {
            setPricePerLiter(clampNumberInput(e.target.value, { min: 1, max: 1000, decimals: 2 }));
            if (fieldErrors.pricePerLiter) {
              setFieldErrors(function(prev) {
                return { ...prev, pricePerLiter: "" };
              });
            }
          }}
          error={fieldErrors.pricePerLiter}
        />
        
        <LabeledInput
          label="Helység"
          type="text"
          required={true}
          value={city}
          maxLength={20}
          onChange={function(e) {
            setCity(limitTextLength(e.target.value, 20));
            if (fieldErrors.city) {
              setFieldErrors(function(prev) {
                return { ...prev, city: "" };
              });
            }
          }}
          error={fieldErrors.city}
        />
        
        <LabeledInput
          label="Cím"
          type="text"
          required={true}
          value={address}
          maxLength={20}
          onChange={function(e) {
            setAddress(limitTextLength(e.target.value, 20));
            if (fieldErrors.address) {
              setFieldErrors(function(prev) {
                return { ...prev, address: "" };
              });
            }
          }}
          error={fieldErrors.address}
        />

        <div className="full-width text-start modal-select-group">
          <label className="modal-select-label">Forgalmazó</label>
          {fieldErrors.supplier && <span className="error-message">{fieldErrors.supplier}</span>}
          <select
            value={supplier}
            onChange={function(e) {
              setSupplier(e.target.value);
              if (fieldErrors.supplier) {
                setFieldErrors(function(prev) {
                  return { ...prev, supplier: "" };
                });
              }
            }}
            className="modal-select"
          >
            <option value="">Válassz forgalmazót</option>
            {SUPPLIER_OPTIONS.map(function(opt) {
              return (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              );
            })}
          </select>
        </div>

        <div className="full-width text-start modal-select-group">
          <label className="modal-select-label">Üzemanyag típusa</label>
          {fieldErrors.fuelTypeId && <span className="error-message">{fieldErrors.fuelTypeId}</span>}
          <select
            value={fuelTypeId}
            onChange={function(e) {
              setFuelTypeId(e.target.value);
              if (fieldErrors.fuelTypeId) {
                setFieldErrors(function(prev) {
                  return { ...prev, fuelTypeId: "" };
                });
              }
            }}
            className="modal-select"
          >
            <option value="">Válassz üzemanyag típust</option>
            {FUEL_OPTIONS.map(function(opt) {
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              );
            })}
          </select>
        </div>

        {error && <p className="text-danger">{error}</p>}
      </Modal>

      {showSuccess && (
        <SuccessModal
          description="Benzinkút sikeresen elmentve"
          onClose={function() {
            setShowSuccess(false);
            onClose?.();
          }}
        />
      )}
    </>
  );
}
