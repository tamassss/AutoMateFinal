import { useState } from "react";
import Button from "../../components/button/button";
import Modal from "../../components/modal/modal";
import SuccessModal from "../../components/success-modal/successModal";
import { deleteGasStation } from "../../actions/gasStations/gasStationActions";

export default function DeleteGasStation({ onClose, onDeleted, gasStationId, helyseg, cim }) {
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // A benzinkút törléséért felelős belső függvény
  async function handleDelete() {
    setError("");
    setIsDeleting(true);

    try {
      // Törlés DB-ből
      await deleteGasStation(gasStationId);

      if (typeof onDeleted === "function") {
        onDeleted(gasStationId);
      }

      onClose?.();
    } catch (err) {
      setError(err.message || "Nem sikerült törölni a benzinkutat.");
    } finally {
      setIsDeleting(false);
    }
  }

  // név + cím
  const stationAddress = `${helyseg || ""} ${cim || ""}`.trim();

  return (
    <>
      <Modal title="Biztosan törlöd?" onClose={onClose} columns={1}>
        <div className="text-center full-width">
          <p>
            <span style={{ color: "#075DBF", fontWeight: "bold" }}>
              {stationAddress || "Ismeretlen kút"}
            </span>
            <br />
            {"benzinkút törlése"}
          </p>
        </div>

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
          description="Benzinkút sikeresen törölve"
          onClose={onClose}
        />
      )}
    </>
  );
}
