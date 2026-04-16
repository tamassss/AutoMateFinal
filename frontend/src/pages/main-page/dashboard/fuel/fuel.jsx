import { Line } from "react-chartjs-2";
import { formatDateLocale, formatGroupedNumber, formatMoney } from "../../../../actions/shared/formatters";
import "./fuel.css";

// Chart.js regisztráció
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Fuel({ fuelingChart, latestFueling }) {
  const points = fuelingChart?.points || [];
  const chartLabels = ["H", "K", "SZE", "CS", "P", "SZO", "V"];

  // Grafikon adatok
  const spentData = points.map((p) => Number(p.spent ?? 0));
  const litersData = points.map((p) => Number(p.liters ?? 0));

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Költés (Ft)",
        data: spentData,
        borderColor: "#075DBF",
        backgroundColor: "#075DBF",
        tension: 0.35,
        pointRadius: 4,
      },
      {
        label: "Liter",
        data: litersData,
        borderColor: "#44d062",
        backgroundColor: "#44d062",
        tension: 0.35,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        display: false,
      },
      y1: {
        display: false,
        position: 'right',
        grid: { drawOnChartArea: false },
      },
      x: {
        ticks: { color: "rgba(255,255,255,0.7)" },
        grid: { display: false }
      },
    },
  };

  return (
    <div className="fuel-container">
      <div className="fuel-heading">
        <h2 className="fuel-title-main">Tankolás</h2>
        <p className="fuel-subtitle">Heti statisztika</p>
      </div>

      <div className="fuel-chart-wrap" style={{ height: "200px" }}>
        <Line data={chartData} options={options} />
      </div>

      <hr className="my-4 opacity-25" />

      {/* Legutóbbi tankolás */}
      <table className="fuel-table w-100">
        <tbody>
          <tr>
            <td className="odd text-center field last-fuel-title" colSpan={2}>
              Legutóbbi tankolás:{" "}
              <span className="last-fuel-date">
                {latestFueling?.date ? formatDateLocale(latestFueling.date) : "-"}
              </span>
            </td>
          </tr>
          <tr>
            <td className="even field px-3">Mennyiség</td>
            <td className="even field text-end px-3">
              {formatGroupedNumber(latestFueling?.liters ?? 0, { decimals: 2 })} l
            </td>
          </tr>
          <tr>
            <td className="odd field px-3">Elköltött összeg</td>
            <td className="odd field text-end px-3">
              {formatMoney(latestFueling?.spent ?? 0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}