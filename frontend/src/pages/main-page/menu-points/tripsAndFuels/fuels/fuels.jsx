import FuelTable from "../../../../../components/fuel-table/fuelTable";

export default function Fuels({ fuelGroups, onDeletedFuel, onUpdatedFuel }) {
  
  // Üres állapot
  if (!fuelGroups || fuelGroups.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <p className="fs-4">Még nincsenek mentett tankolások.</p>
      </div>
    );
  }

  return (
    <div className="container pb-5">
      {/* hónapok szerint csoportosítás */}
      {fuelGroups.map((group) => (
        <FuelTable
          key={group.month}
          month={group.month}
          data={group.items}
          onDeletedFuel={onDeletedFuel}
          onUpdatedFuel={onUpdatedFuel}
        />
      ))}
    </div>
  );
}
