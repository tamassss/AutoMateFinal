import xIcon from "../../assets/icons/x-icon.png";

import "./errorModal.css"

export default function ErrorModal({onClose, title, description}){
    const handleClose = () => {
        if (typeof onClose === "function") {
            onClose();
        }
    };

    return(
        <div className="error-overlay" onClick={handleClose}>
            <div className="error-div" onClick={(e) => e.stopPropagation()}>
                <div className="error-close-img-div">
                    <img src={xIcon} onClick={handleClose} className="error-close-img"/>
                </div>
                <div className="error-content p-3">
                    <div className="error-text-div">
                        <p className="error-text">{title}</p>
                    </div>
                    <div className="error-description-div">
                        <p className="error-description">{description}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
