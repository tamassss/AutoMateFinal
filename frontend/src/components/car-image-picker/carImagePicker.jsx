import { CAR_IMAGE_OPTIONS } from "../../assets/car-images/carImageOptions";
import "./carImagePicker.css";

export default function CarImagePicker({ selectedImageId, onChange }) {
  return (
    <div className="car-image-picker-wrap">
      <p className="car-image-picker-label">Autó kép</p>
      <div className="car-image-picker-grid">
        {CAR_IMAGE_OPTIONS.map((item) => {
          const isActive = selectedImageId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`car-image-option ${isActive ? "is-active" : ""}`}
              onClick={() => onChange?.(item.id)}
              title={item.label}
            >
              <img src={item.src} alt={item.label} className="car-image-option-img" />
            </button>
          );
        })}
      </div>
    </div>
  );
}