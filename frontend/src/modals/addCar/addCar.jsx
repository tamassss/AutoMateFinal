import { useState } from "react";
import { createCar } from "../../actions/cars/carsActions";
import Button from "../../components/button/button";
import HrOptional from "../../components/hr-optional/hrOptional";
import LabeledInput from "../../components/labeledInput/labeledInput";
import Modal from "../../components/modal/modal";
import ErrorModal from "../../components/error-modal/errorModal";
import SuccessModal from "../../components/success-modal/successModal";
import CarImageSelectModal from "../carImageSelectModal/carImageSelectModal";
import { DEFAULT_CAR_IMAGE_ID, DEFAULT_CAR_IMAGE_SRC, getCarImageSrc } from "../../assets/car-images/carImageOptions";
import { clampNumberInput, isValidLicensePlate, limitTextLength, normalizeLicensePlateInput } from "../../actions/shared/inputValidation";
import "../../components/car-image-picker/carImagePicker.css";

export default function AddCar({ onClose, onSave }) {
  // adatok
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [averageCons, setAverageCons] = useState("");
  const [carImage, setCarImage] = useState(DEFAULT_CAR_IMAGE_ID);
  
  // modal + eseménykezelés
  const [showImageSelect, setShowImageSelect] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // LOGIKA

  async function handleCreateCar(event) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    // ellenőrzés
    const errors = {};
    if (!brandId) errors.brand = "A márka megadása kötelező!";
    if (!modelId) errors.model = "A modell megadása kötelező!";
    if (!licensePlate) errors.plate = "A rendszám megadása kötelező!";
    if (licensePlate && !isValidLicensePlate(licensePlate)) {
      errors.plate = "A rendszám formátuma csak ABC-123 vagy ABCD-123 lehet!";
    }

    // hiba - megállunk és kiírjuk
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await createCar({
        license_plate: licensePlate,
        brand: brandId,
        model: modelId,
        average_consumption: averageCons,
        car_image: carImage,
      });
      
      onSave?.();
      onClose?.();
    } catch (err) {
      const message = err?.message || "Nem sikerült létrehozni az autót";
      
      // foglalt rendszám
      if (err?.fieldErrors?.plate) {
        setFieldErrors({ ...fieldErrors, plate: err.fieldErrors.plate });
      } else {
        setError(message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Modal
        title="Autó hozzáadása"
        onClose={onClose}
        columns={1}
        onSubmit={handleCreateCar}
        footer={<Button text={isSaving ? "Mentés..." : "Hozzáadás"} type="submit" />}
      >
        <LabeledInput
          label="Márka"
          value={brandId}
          placeholder="pl. Suzuki"
          onChange={(e) => setBrandId(limitTextLength(e.target.value, 25))}
          error={fieldErrors.brand}
        />

        <LabeledInput
          label="Modell"
          value={modelId}
          placeholder="pl. Swift"
          onChange={(e) => setModelId(limitTextLength(e.target.value, 25))}
          error={fieldErrors.model}
        />

        <LabeledInput
          label="Rendszám"
          value={licensePlate}
          placeholder="pl. ABC-123"
          onChange={function(e) {
            setLicensePlate(normalizeLicensePlateInput(e.target.value));
            // gépelés -> hiba ne látszódjon
            if (fieldErrors.plate) setFieldErrors({ ...fieldErrors, plate: "" });
          }}
          error={fieldErrors.plate}
        />

        <HrOptional />

        <LabeledInput
          label="Átlagfogyasztás (l/100km)"
          value={averageCons}
          type="number"
          placeholder="pl. 6.5"
          onChange={(e) => setAverageCons(clampNumberInput(e.target.value, { min: 0.01, max: 99.99, decimals: 2 }))}
          error={fieldErrors.averageCons}
        />

        {/* Képválasztás */}
        <div className="car-image-picker-wrap">
          <p className="car-image-picker-label">Autó kép</p>
          <button
            type="button"
            className="car-image-option is-active"
            onClick={() => setShowImageSelect(true)}
          >
            <img
              src={carImage === DEFAULT_CAR_IMAGE_ID ? DEFAULT_CAR_IMAGE_SRC : getCarImageSrc(carImage)}
              alt="Autó ikon"
              className="car-image-option-img"
            />
          </button>
        </div>
      </Modal>

      {/* Modals */}
      {error && (
        <ErrorModal title="Hiba!" description={error} onClose={() => setError("")} />
      )}

      {showSuccess && (
        <SuccessModal
          description="Sikeres autó felvétel"
          onClose={function() {
            setShowSuccess(false);
            onClose?.();
          }}
        />
      )}

      {showImageSelect && (
        <CarImageSelectModal
          selectedImageId={carImage}
          onSelect={setCarImage}
          onClose={() => setShowImageSelect(false)}
        />
      )}
    </>
  );
}
