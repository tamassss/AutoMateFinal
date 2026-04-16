import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import Card from "../../../../../components/card/card";
import { getGeneralStats } from "../../../../../actions/stats/statsActions";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Filler,
  Tooltip,
  Legend,
);

export default function DataVisual() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(function() {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const data = await getGeneralStats();
        setStats(data?.monthly || null);
      } catch (err) {
        setError(err.message || "Nem sikerült betölteni a grafikon adatait.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const monthlyStats = {
    distance: stats?.distance || Array(12).fill(0),
    liters: stats?.liters || Array(12).fill(0),
    pricePerKm: stats?.price_per_km || Array(12).fill(0),
    totalSpent: stats?.total_spent || Array(12).fill(0),
  };

  function getOptions(yTitle) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(255, 255, 255, 0.1)" },
          ticks: { color: "#ccc" },
          title: {
            display: true,
            text: yTitle,
            color: "#075DBF",
            font: { size: 12, weight: "bold" },
          },
        },
        x: {
          grid: { display: false },
          ticks: { color: "#ccc" },
          title: {
            display: true,
            text: "Hónap",
            color: "#075DBF",
            font: { size: 12, weight: "bold" },
          },
        },
      },
    };
  }

  function getBarData(label, data) {
    return {
      labels: months,
      datasets: [
        {
          label: label,
          data: data,
          backgroundColor: "#075DBF",
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }

  return (
    <Card>
      <div className="p-3 w-100">
        <h5 className="text-primary mb-4 fs-4 text-center">
          Utak <span style={{ color: "white" }}>|</span> Tankolások <span style={{ color: "white" }}>|</span> Költségek
        </h5>

        {loading && <p className="text-center text-light">Betöltés...</p>}
        {error && <p className="text-center text-danger">{error}</p>}

        {!loading && !error && (
          <div className="row g-4">
            <div className="col-md-6">
              <p className="text-center text-light opacity-75 small">Megtett távolság havonta</p>
              <div style={{ height: "250px" }}>
                <Bar data={getBarData("Km", monthlyStats.distance)} options={getOptions("Km")} />
              </div>
            </div>

            <div className="col-md-6">
              <p className="text-center text-light opacity-75 small">Tankolások havonta</p>
              <div style={{ height: "250px" }}>
                <Bar data={getBarData("Liter", monthlyStats.liters)} options={getOptions("Liter")} />
              </div>
            </div>

            <div className="col-md-6 mt-2">
              <p className="text-center text-light opacity-75 small">1 km ára havonta</p>
              <div style={{ height: "300px" }}>
                <Line
                  data={{
                    labels: months,
                    datasets: [
                      {
                        label: "Ft/km",
                        data: monthlyStats.pricePerKm,
                        borderColor: "#075DBF",
                        backgroundColor: "rgba(7, 93, 191, 0.2)",
                        fill: true,
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={getOptions("Ft/km")}
                />
              </div>
            </div>

            <div className="col-md-6 mt-2">
              <p className="text-center text-light opacity-75 small">Költések havonta</p>
              <div style={{ height: "300px" }}>
                <Bar data={getBarData("Ft", monthlyStats.totalSpent)} options={getOptions("Ft")} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
