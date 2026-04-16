import { useState } from "react";

import Card from "../card/card";
import Button from "../button/button";
import DeleteTrip from "../../modals/deleteTrip/deleteTrip";
import { formatGroupedNumber, formatMoney } from "../../actions/shared/formatters";

import "./tripCard.css";

export default function TripCard({ trip, onDeletedTrip }) {
  const [showDeleteTrip, setShowDeleteTrip] = useState(false);

  return (
    <Card>
      <div className="trip-card-header">
        <h3>{trip.honnan}</h3>
        <p>-</p>
        <h3>{trip.hova}</h3>
      </div>
      <div className="w-100 hr-div">
        <hr className="full-width" />
      </div>
      <div className="trip-card-body">
        <p className="trip-date mt-3">{trip.datum}</p>
        <p className="trip-time">
          {trip.kezdes} - {trip.vege}
        </p>
        {trip.javitas == null ? (
          <p className="trip-stat">-</p>
        ) : (
          <p className={`trip-stat ${trip.javitas >= 0 ? "text-success" : "text-danger"}`}>
            {formatGroupedNumber(Math.abs(trip.javitas))} perc {trip.javitas >= 0 ? "javítás" : "rontás"}
          </p>
        )}
        <p className="trip-distance mb-3">
          {`${formatGroupedNumber(trip.tavolsag, { decimals: 1, trimTrailingZeros: true })} km`}
        </p>
      </div>
      <div className="trip-card-footer">
        <div style={{ color: "#ffffff8e" }}>{`${formatGroupedNumber(trip.tankolas_szam)} tankolás`}</div>
        <div style={{ color: "#ffffff8e" }}>{`${formatMoney(trip.koltseg)} elköltve`}</div>
      </div>
      <div className="d-flex">
        <div className="fuel-button">
          <Button text="Törlés" onClick={() => setShowDeleteTrip(true)} />
        </div>
      </div>

      {showDeleteTrip && (
        <DeleteTrip
          onClose={() => setShowDeleteTrip(false)}
          routeUsageId={trip?.id}
          fromCity={trip?.honnan}
          toCity={trip?.hova}
          datum={trip?.datum}
          onDeleted={function(deletedTripId) {
            setShowDeleteTrip(false);
            onDeletedTrip?.(deletedTripId);
          }}
        />
      )}
    </Card>
  );
}
