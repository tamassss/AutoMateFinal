import { useState } from "react";

import leftArrow from "../../../assets/icons/left-arrow.png";
import rightArrow from "../../../assets/icons/right-arrow.png";

import img1 from "../../../assets/images/car.png"
import img2 from "../../../assets/images/car2.png"
import img3 from "../../../assets/images/car3.png"

import "./gallery.css";

const images = [
  img1,
  img2,
  img3
];

export default function Gallery() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="gallery-container">
      <img 
        src={leftArrow} 
        className="arrow left" 
        onClick={prevImage} 
        alt="Vissza" 
      />
      
      <div className="gallery-viewport">
        <div 
          className="image-slider" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img, index) => (
            <img key={index} src={img} className="gallery-image" alt="autó" />
          ))}
        </div>
      </div>

      <img 
        src={rightArrow} 
        className="arrow right" 
        onClick={nextImage} 
        alt="Előre" 
      />
    </div>
  );
}