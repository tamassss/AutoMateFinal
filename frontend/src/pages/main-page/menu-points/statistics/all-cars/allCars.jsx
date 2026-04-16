import Card from "../../../../../components/card/card";
import { formatGroupedNumber, formatMoney } from "../../../../../actions/shared/formatters";

export default function AllCars({ summaryStats = [] }) {
  // ADATOK ELŐKÉSZÍTÉSE
  const rows = summaryStats.map(function(item) {
    // km formázás
    const formattedDistance = formatGroupedNumber(item.distance_km || 0, { 
      decimals: 1, 
      trimTrailingZeros: true 
    }) + " km";

    // adatok összefűzése
    const fuelingDetails = formatGroupedNumber(item.fuelings?.count || 0) + " db | " + 
                           formatMoney(item.fuelings?.spent) + " | " + 
                           formatGroupedNumber(item.fuelings?.liters || 0, { 
                             decimals: 1, 
                             trimTrailingZeros: true 
                           }) + " l";

    return {
      car: item.car_name,
      distance: formattedDistance,
      fuel: fuelingDetails,
    };
  });

  return (
    <Card>
      <div className="w-100 p-3">
        <h5 className="text-center text-primary mb-3 fs-4">Összesített statisztika</h5>
        <div className="table-responsive">
          <table className="table table-dark table-borderless text-center align-middle m-0">
            <thead>
              <tr className="odd text-primary text-center">
                <th>Autó</th>
                <th>Megtett táv</th>
                <th>Tankolások</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                // Sorok megjelenítése
                rows.map(function(item, index) {
                  return (
                    <tr key={index} className={index % 2 !== 0 ? "odd" : "even"}>
                      <td>{item.car}</td>
                      <td>{item.distance}</td>
                      <td className="small">{item.fuel}</td>
                    </tr>
                  );
                })
              ) : (
                /* Üres állapot */
                <tr>
                  <td colSpan={3} className="text-center">
                    Még nincs összesített adat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}