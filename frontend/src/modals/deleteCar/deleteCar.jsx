import { useState } from "react";
import Button from "../../components/button/button";
import Modal from "../../components/modal/modal";
import SuccessModal from "../../components/success-modal/successModal";
import { deleteCar } from "../../actions/cars/carsActions";

export default function DeleteCar({ onClose, onDeleted, carId, displayName, licensePlate }) {
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // autó törlése
  async function handleDelete() {
    setError("");
    setIsDeleting(true);

    try {
      // törlés DB-ből
      await deleteCar(carId);
      
      // törlés ls-ből
      const currentSelectedId = localStorage.getItem("selected_car_id") || "";
      if (String(currentSelectedId) === String(carId)) {
        localStorage.removeItem("selected_car_id");
      }

      if (typeof onDeleted === "function") {
        onDeleted(carId);
      }
      
      onClose?.();
    } catch (err) {
      setError(err.message || "Nem sikerült törölni az autót.");
    } finally {
      setIsDeleting(false);
    }
  }

  const carDescription = (displayName || "-") + (licensePlate ? ` (${licensePlate})` : "");

  return (
    <>
      <Modal title="Biztosan törlöd?" onClose={onClose} columns={1}>
        <p className="full-width text-center">
          <span style={{ color: "#075DBF", fontWeight: "bold" }}>
            {carDescription}
          </span>
          <br />
          {"autó törlése"}
        </p>

        {/* Törlés gomb */}
        <Button 
          text={isDeleting ? "Törlés..." : "Törlés"} 
          className="mt-5" 
          onClick={handleDelete} 
        />

        {error && <p className="text-danger full-width text-center mt-2">{error}</p>}
      </Modal>

      {/* Sikeres törlés */}
      {showSuccess && (
        <SuccessModal
          description="Autó törölve"
          onClose={function() {
            setShowSuccess(false);
            onClose?.();
          }}
        />
      )}
    </>
  );
}
