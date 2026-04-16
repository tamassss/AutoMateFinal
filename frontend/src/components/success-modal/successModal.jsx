import { useCallback, useEffect, useState } from "react";
import xIcon from "../../assets/icons/x-icon.png";
import successIcon from "../../assets/icons/success-check.svg";
import "./successModal.css";

export default function SuccessModal({ onClose, description }) {
  const [isHiding, setIsHiding] = useState(false);

  const handleClose = useCallback(() => {
    if (isHiding) return;
    setIsHiding(true);
    setTimeout(() => {
      if (typeof onClose === "function") onClose();
    }, 450);
  }, [isHiding, onClose]);

  useEffect(() => {
    const timer = setTimeout(handleClose, 3000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <div className="success-layer">
      <div className={`success-div ${isHiding ? "hide" : ""}`}>
        <img src={successIcon} className="success-left-icon" alt="Sikeres művelet" />

        <div className="success-content">
          <p className="success-description">{description}</p>
        </div>

        <img src={xIcon} onClick={handleClose} className="success-close-img" alt="Bezárás" />
      </div>
    </div>
  );
}
