import "./modal.css";
import backIcon from "../../assets/icons/back.png";

export default function Modal({ title, children, onClose, columns = 2, footer, onSubmit, compact = true }) {
  const bodyAndFooter = (
    <>
      <div className={`modal-body ${columns === 2 ? "two-col" : "one-col"}`}>
        {children}
      </div>
      <div className="modal-footer">
        {footer}
      </div>
    </>
  );

  return (
    <div className="modal-wrapper">
      <div className="overlay" onClick={onClose}></div>

      <div className={`modal-content ${columns === 1 && compact ? "one-col-div" : "" }`}>
        <div className="modal-header">
          <img
            src={backIcon}
            className="modal-back"
            onClick={onClose}
            alt="Vissza"
          />
          <h3 className="modal-title">{title}</h3>
        </div>
        {onSubmit ? <form onSubmit={onSubmit}>{bodyAndFooter}</form> : bodyAndFooter}
      </div>
    </div>
  );
}

