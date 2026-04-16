import "./trips.css";
import TripCard from "../../../../../components/trip-card/tripCard";

export default function Trips({ trips, onDeletedTrip }) {
  
  // Üres állapot
  if (trips.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <p className="fs-4">Még nincsenek mentett utak.</p>
      </div>
    );
  }

  // csoportosítás hónap szerint
  const groupedTrips = trips.reduce((groups, trip) => {
    const month = trip.month || "-";
    const existingGroup = groups.find((group) => group.month === month);

    if (existingGroup) {
      existingGroup.items.push(trip);
    } else {
      groups.push({ month: month, items: [trip] });
    }

    return groups;
  }, []);

  return (
    <div>
      {/* hónapok szerinti csoportok */}
      {groupedTrips.map((group) => (
        <div key={group.month} className="mb-5">
          <h3 className="text-left mb-3 trips-month-title">{group.month}</h3>

          <div className="row g-4">
            {/* hónaphoz tartozó csoportok */}
            {group.items.map((trip) => (
              <div 
                key={trip.id} 
                className="col-xl-3 col-lg-4 col-md-6 col-10 d-flex align-items-stretch"
              >
                <TripCard trip={trip} onDeletedTrip={onDeletedTrip} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
