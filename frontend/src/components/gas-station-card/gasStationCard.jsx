import { useState } from "react";

import Card from "../card/card";
import Button from "../../components/button/button";
import DeleteGasStation from "../../modals/deleteGasStation/deleteGasStation";
import EditGasStation from "../../modals/editGasStation/editGasStation";
import { formatGroupedNumber } from "../../actions/shared/formatters";

import fuel95Icon from "../../assets/gas-station/fuels/95.png";
import fuel100Icon from "../../assets/gas-station/fuels/100.png";
import fuelDIcon from "../../assets/gas-station/fuels/d.png";
import fuelDPlusIcon from "../../assets/gas-station/fuels/d-plus.png";
import molLogo from "../../assets/gas-station/stations/mol.png";
import shellLogo from "../../assets/gas-station/stations/shell.png";
import orlenLogo from "../../assets/gas-station/stations/orlen.png";
import auchanLogo from "../../assets/gas-station/stations/auchan.png";

import "./gasStationCard.css";

export default function GasStationCard({
  station,
  onDeleted,
  onUpdated,
  showDefaultActions = true,
  extraButtonText = "",
  onExtraButtonClick,
  extraInfo = "",
  shareStatusText = "",
  shareStatusType = "",
}) {
  const [showEditGasStation, setShowEditGasStation] = useState(false);
  const [showDeleteGasStation, setShowDeleteGasStation] = useState(false);
  const priceText = station?.literft
    ? `${formatGroupedNumber(station.literft, { decimals: 1, trimTrailingZeros: true })} Ft`
    : "-";

  const fuelTypeText = String(station?.fuelType || "").toLowerCase();
  const fuelTypeId = Number(station?.fuelTypeId || 0);
  const supplierText = String(station?.supplier || "").toLowerCase();

  let fuelIcon;
  switch (fuelTypeId) {
    case 1:
      fuelIcon = fuel95Icon;
      break;
    case 2:
      fuelIcon = fuel100Icon;
      break;
    case 3:
      fuelIcon = fuelDIcon;
      break;
    case 4:
      fuelIcon = fuelDPlusIcon;
      break;
    default:
      if (fuelTypeText.includes("100")) {
        fuelIcon = fuel100Icon;
      } else if (fuelTypeText.includes("diesel plus")) {
        fuelIcon = fuelDPlusIcon;
      } else if (fuelTypeText.includes("diesel")) {
        fuelIcon = fuelDIcon;
      } else {
        fuelIcon = fuel95Icon;
      }
  }

  const stationIcon = supplierText.includes("shell")
    ? shellLogo
    : supplierText.includes("orlen")
    ? orlenLogo
    : supplierText.includes("auchan")
    ? auchanLogo
    : molLogo;

  return (
    <Card>
      <div className="gas-station-card-content" style={{ color: "white" }}>
        <div className="date-header text-center p-3">
          <p className="date-text" style={{ color: "#4CAF50" }}>
            {station?.datum || "-"}
          </p>
          <p className={`gas-station-share-status ${shareStatusType}`}>
            {shareStatusText || "\u00a0"}
          </p>
        </div>

        <div className="p-1 gas-station-card-body">
          <div className="gas-station-card-row d-flex align-items-center justify-content-center mb-3">
            <img src={stationIcon} alt={station?.supplier || "Benzinkút"} className="station-icon" />
            <h2 className="price gas-station-card-value">{priceText}</h2>
          </div>

          <div className="gas-station-card-row d-flex align-items-center justify-content-center mb-4">
            <img src={fuelIcon} alt={station?.fuelType || "Üzemanyag"} className="fuel-icon" />
            <div className="text-start gas-station-card-value">
              <h4 className="m-0 station-city">{station?.helyseg || "-"}</h4>
              <p className="m-0 text-secondary station-address">{station?.cim || "-"}</p>
            </div>
          </div>

          {extraInfo ? <p className="mb-3 small text-info">{extraInfo}</p> : null}

          <div className="gas-station-card-actions d-flex gap-2 justify-content-center">
            {showDefaultActions ? (
              <>
                <div className="fuel-button">
                  <Button text="Módosítás" onClick={() => setShowEditGasStation(true)} />
                </div>
                <div className="fuel-button">
                  <Button text="Törlés" onClick={() => setShowDeleteGasStation(true)} />
                </div>
              </>
            ) : null}
            {extraButtonText ? (
              <div className="fuel-button">
                <Button text={extraButtonText} onClick={onExtraButtonClick} />
              </div>
            ) : null}
          </div>
        </div>

        {showDefaultActions && showDeleteGasStation ? (
          <DeleteGasStation
            onClose={() => setShowDeleteGasStation(false)}
            onDeleted={function(deletedId) {
              setShowDeleteGasStation(false);
              onDeleted?.(deletedId);
            }}
            gasStationId={station?.gasStationId}
            helyseg={station?.helyseg || "-"}
            cim={station?.cim || "-"}
          />
        ) : null}

        {showDefaultActions && showEditGasStation ? (
          <EditGasStation
            onClose={() => setShowEditGasStation(false)}
            selectedStation={station}
            onSave={function(updatedStation) {
              setShowEditGasStation(false);
              onUpdated?.(updatedStation);
            }}
          />
        ) : null}
      </div>
    </Card>
  );
}
