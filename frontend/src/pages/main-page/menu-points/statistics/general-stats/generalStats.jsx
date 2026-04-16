import Card from "../../../../../components/card/card";
import { formatGroupedNumber, formatMoney } from "../../../../../actions/shared/formatters";

export default function GeneralStats({ generalStats }) {
  // Adatok előkészítése
  const stats = [
    {
      label: "Kiválasztott autó:",
      value: generalStats?.car?.display_name || "-",
    },
    {
      label: "Megtett táv használat óta:",
      value: generalStats?.distance_km_total != null
        ? formatGroupedNumber(generalStats.distance_km_total, { 
            decimals: 1, 
            trimTrailingZeros: true 
          }) + " km"
        : "-",
    },
    {
      label: "Tankolások használat óta:",
      value: generalStats?.fuelings
        ? formatGroupedNumber(generalStats.fuelings.count) + " db | " + 
          formatGroupedNumber(generalStats.fuelings.liters || 0, {
            decimals: 1,
            trimTrailingZeros: true,
          }) + " l | " + 
          formatMoney(generalStats.fuelings.spent)
        : "-",
    },
    {
      label: "Szerviz költség összesen:",
      value: generalStats?.maintenance ? formatMoney(generalStats.maintenance.total_cost) : "-",
    },
    {
      label: "Leghosszabb út:",
      value: generalStats?.longest_route
        ? generalStats.longest_route.from_city + " - " + 
          generalStats.longest_route.to_city + " | " + 
          formatGroupedNumber(generalStats.longest_route.distance_km || 0, { 
            decimals: 1, 
            trimTrailingZeros: true 
          }) + " km | " + 
          (generalStats.longest_route.departure_time_hhmm || "-") + " - " + 
          (generalStats.longest_route.arrival_time_hhmm || "-")
        : "-",
    },
  ];

  return (
    <Card>
      <div className="p-3 w-100">
        <h5 className="text-center text-primary mb-3 fs-4">Általános statisztikák</h5>
        <div className="container">
          
          {stats.map((stat, index) => (
            <div key={index} className={"row p-2 general-stat-row " + (index % 2 === 0 ? "odd" : "even")}>
              <div className="col-6 text-start" style={{ color: "white", opacity: "0.7" }}>
                {stat.label}
              </div>
              <div className="col-6 stat-value" style={{ color: "white" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
