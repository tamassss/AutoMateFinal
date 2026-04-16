import car0 from "./0.png";
import car1 from "./1.png";
import car2 from "./2.png";
import car3 from "./3.png";
import car4 from "./4.png";
import car5 from "./5.png";
import car6 from "./6.png";

export const DEFAULT_CAR_IMAGE_ID = "car_0";
export const DEFAULT_CAR_IMAGE_SRC = car0;

export const CAR_IMAGE_OPTIONS = [
  { id: "car_0", label: "Alap ikon", src: car0 },
  { id: "car_1", label: "Autó 1", typeLabel: "Pickup", src: car1 },
  { id: "car_2", label: "Autó 2", typeLabel: "Kombi", src: car2 },
  { id: "car_3", label: "Autó 3", typeLabel: "SUV", src: car3 },
  { id: "car_4", label: "Autó 4", typeLabel: "Hatchback", src: car4 },
  { id: "car_5", label: "Autó 5", typeLabel: "Sedan", src: car5 },
  { id: "car_6", label: "Autó 6", typeLabel: "Coupe", src: car6 },
];

export const CAR_IMAGE_PICKER_OPTIONS = CAR_IMAGE_OPTIONS.filter((item) => item.id !== DEFAULT_CAR_IMAGE_ID);

export function getCarImageSrc(imageId) {
  const match = CAR_IMAGE_OPTIONS.find((item) => item.id === imageId);
  return match?.src || car0;
}
