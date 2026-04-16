import Modal from "../../components/modal/modal";
import { CAR_IMAGE_PICKER_OPTIONS } from "../../assets/car-images/carImageOptions";
import "./carImageSelectModal.css";

export default function CarImageSelectModal({ selectedImageId, onSelect, onClose }) {
  return (
    <Modal title={"Autó kép kiválasztása"} onClose={onClose} columns={1} compact={false}>
      <div className="car-image-select-grid">
        {CAR_IMAGE_PICKER_OPTIONS.map((item) => {
          const isActive = selectedImageId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`car-image-select-option ${isActive ? "is-active" : ""}`}
              onClick={() => {
                onSelect?.(item.id);
                onClose?.();
              }}
              title={item.label}
            >
              <img src={item.src} alt={item.label} className="car-image-select-img" />
              <span className="car-image-select-type">{item.typeLabel || item.label}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
