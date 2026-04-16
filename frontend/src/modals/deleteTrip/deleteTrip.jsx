import { useState } from "react";
import Button from "../../components/button/button";
import Modal from "../../components/modal/modal";
import SuccessModal from "../../components/success-modal/successModal";
import { deleteTrip } from "../../actions/routes/routeActions";
import "./deleteTrip.css";

export default function DeleteTrip({ onClose, onDeleted, routeUsageId, fromCity, toCity, datum }) {
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleDelete() {
    setError("");
    setIsDeleting(true);
    try {
      await deleteTrip(routeUsageId);
      if (routeUsageId !== null && routeUsageId !== undefined) onDeleted?.(routeUsageId);
      onClose?.();
    } catch (err) {
      setError(err.message || "Nem sikerült törölni az utat.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Modal columns={1} onClose={onClose} title={"Biztosan törlöd?"}>
        <p className="full-width text-center">
          <span style={{ color: "#075DBF", fontWeight: "bold" }}>
            {fromCity || "-"} - {toCity || "-"} ({datum || "-"})
          </span>
          <br />
          út törlése
        </p>

        <Button text={isDeleting ? "Törlés..." : "Törlés"} className="mt-5" onClick={handleDelete} />
        {error && <p className="text-danger full-width">{error}</p>}
      </Modal>

      {showSuccess && (
        <SuccessModal
          description="Út törölve"
          onClose={() => {
            setShowSuccess(false);
            onClose?.();
          }}
        />
      )}
    </>
  );
}
