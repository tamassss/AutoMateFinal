import { Bar, Line } from "react-chartjs-2";
import Modal from "../../components/modal/modal";
import "./communityComparisonModal.css";

// chart.js
function getChartOptions(yAxisTitle) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#ddd" } },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: yAxisTitle, color: "#7ec8ff" },
        ticks: { color: "#ccc" },
        grid: { color: "rgba(255,255,255,0.12)" },
      },
      x: {
        ticks: { color: "#ccc" },
        grid: { display: false },
      },
    },
  };
}

// Oszlopdiagram
function MonthlyBarChart({ title, unit, months, meValues, otherValues, meName, otherName }) {
  const chartData = {
    labels: months,
    datasets: [
      { label: meName, data: meValues, backgroundColor: "#0a6ddf" },
      { label: otherName, data: otherValues, backgroundColor: "#2cb67d" },
    ],
  };

  return (
      <div className="community-compare-chart-item">
      <p className="text-light text-center mb-2">{title}</p>
      <div style={{ height: "320px" }}>
        <Bar data={chartData} options={getChartOptions(unit)} />
      </div>
    </div>
  );
}

// Vonaldiagram
function MonthlyLineChart({ title, unit, months, meValues, otherValues, meName, otherName }) {
  const chartData = {
    labels: months,
    datasets: [
      {
        label: meName,
        data: meValues,
        borderColor: "#0a6ddf",
        backgroundColor: "rgba(10,109,223,0.12)",
        fill: true,
        tension: 0.25,
      },
      {
        label: otherName,
        data: otherValues,
        borderColor: "#2cb67d",
        backgroundColor: "rgba(44,182,125,0.12)",
        fill: true,
        tension: 0.25,
      },
    ],
  };

  return (
    <div className="community-compare-chart-item">
      <p className="text-light text-center mb-2">{title}</p>
      <div style={{ height: "320px" }}>
        <Line data={chartData} options={getChartOptions(unit)} />
      </div>
    </div>
  );
}

export default function CommunityComparisonModal({
  onClose,
  myProfile,
  otherProfile,
  compareData,
  compareLoading,
  compareError,
}) {
  // Autók nevei
  const myName = myProfile?.car_name || "Saját autó";
  const otherName = otherProfile?.car_name || "Másik autó";

  // loading, error, data
  function renderContent() {
    if (compareLoading) {
      return <p className="text-center text-light mt-2">Adatok betöltése...</p>;
    }

    if (compareError) {
      return <p className="text-center text-danger mt-2">{compareError}</p>;
    }

    if (!compareData) {
      return null;
    }

    const months = compareData.months || [];
    const series = compareData.series || {};

    return (
      <div className="community-compare-charts">
        <MonthlyBarChart
          title="Megtett távolság havonta"
          unit="Km"
          months={months}
          meValues={series.distance?.me || []}
          otherValues={series.distance?.other || []}
          meName={myName}
          otherName={otherName}
        />
        
        <MonthlyBarChart
          title="Tankolt liter havonta"
          unit="Liter"
          months={months}
          meValues={series.liters?.me || []}
          otherValues={series.liters?.other || []}
          meName={myName}
          otherName={otherName}
        />
        
        <MonthlyLineChart
          title="1 km ára havonta"
          unit="Ft/km"
          months={months}
          meValues={series.price_per_km?.me || []}
          otherValues={series.price_per_km?.other || []}
          meName={myName}
          otherName={otherName}
        />
      </div>
    );
  }

  return (
    <Modal title={`${myName} vs ${otherName}`} onClose={onClose} columns={1} compact={false}>
      <div className="community-compare-wrap">
        {renderContent()}
      </div>
    </Modal>
  );
}
