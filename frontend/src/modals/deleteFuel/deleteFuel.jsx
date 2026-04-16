import { useState } from "react";
import Button from "../../components/button/button";
import Modal from "../../components/modal/modal";
import SuccessModal from "../../components/success-modal/successModal";
import { deleteFuel } from "../../actions/fuelings/fuelingActions";

export default function DeleteFuel({ onClose, onDeleted, fuelingId, datum }) {
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Törlés
  async function handleDelete() {
    setError("");
    setIsDeleting(true);

    try {
      // törlés DB-ből
      await deleteFuel(fuelingId);

      const hasId = fuelingId !== null && fuelingId !== undefined;
      if (hasId && typeof onDeleted === "function") {
        onDeleted(fuelingId);
      }

      onClose?.();
    } catch (err) {
      setError(err.message || "Nem sikerült törölni a tankolást.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Modal title="Biztosan törlöd?" onClose={onClose} columns={1}>
        <p className="full-width text-center">
          <span className="gas-station-location" style={{ color: "#075DBF", fontWeight: "bold" }}>
            {datum}
          </span>
          <br />
          {"tankolás törlése"}
        </p>

        {/* Törlés gomb */}
        <Button 
          text={isDeleting ? "Törlés..." : "Törlés"} 
          className="mt-5" 
          onClick={handleDelete} 
        />
        
        {error && (
          <p className="text-danger full-width text-center mt-2">{error}</p>
        )}
      </Modal>
      
      {showSuccess && (
        <SuccessModal
          description="Tankolás törölve"
          onClose={function() {
            setShowSuccess(false);
            onClose?.();
          }}
        />
      )}
    </>
  );
}
