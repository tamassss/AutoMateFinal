import "./dashboardLight.css";

// Egy adott jelzés
export default function DashboardLight({ light }) {
  // Üres állapot
  if (!light) return null;

  return (
    <section className="dashboard-light-details">

      <div className="dashboard-light-image-wrap">
        <img src={light.img} alt={light.title} className="dashboard-light-image" />
        <h2 className="dashboard-light-name">{light.title}</h2>
      </div>

      <div className="dashboard-light-text">
        <p>
          <span>Jelentés:</span> {light.meaning}
        </p>
        <p>
          <span>Tennivaló:</span> {light.todo}
        </p>
      </div>
    </section>
  );
}