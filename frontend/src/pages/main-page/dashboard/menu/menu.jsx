import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import tripsAndFuelsIcon from "../../../../assets/menu-points/trips-fuels.png";
import gasStationsIcon from "../../../../assets/menu-points/gas-stations.png";
import statisticsIcon from "../../../../assets/menu-points/statistics.png";
import servicelogIcon from "../../../../assets/menu-points/servicelog.png";
import communityIcon from "../../../../assets/menu-points/community.png";

import EventItem from "../../../../components/event-item/eventItem";
import NewEvent from "../../../../modals/newEvent/newEvent";
import EventsModal from "../../../../modals/eventsModal/eventsModal";
import Button from "../../../../components/button/button";
import SuccessModal from "../../../../components/success-modal/successModal";

import { createEvent, getEvents } from "../../../../actions/events/eventActions";
import { getCurrentUserMeta, isCommunityEnabledForCar, setCommunityEnabledForCar } from "../../../../actions/community/communityLocalActions";

import "./menu.css";

export default function Menu({ events, onEventCreated }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loadedEvents, setLoadedEvents] = useState([]);
  const [communityEnabled, setCommunityEnabled] = useState(false);
  const [savingCommunity, setSavingCommunity] = useState(false);

  const selectedCarId = Number(localStorage.getItem("selected_car_id") || 0);
  const { userId, role } = getCurrentUserMeta();
  const isModerator = role === "moderator";
  const isCommunityRoute = location.pathname === "/muszerfal/kozosseg";

  const closeMenu = () => setIsOpen(false);

  // Események API-ból
  const loadEvents = async () => {
    try {
      const data = await getEvents();
      const formattedEvents = (data || []).map((event) => ({
        event_id: event.id,
        title: event.title,
        reminder: event.reminder,
        date: event.date,
      }));
      setLoadedEvents(formattedEvents);
    } catch (err) {
      console.error("Hiba az események betöltésekor:", err);
      setLoadedEvents([]);
    }
  };

  // Események betöltése
  useEffect(() => {
    if (events) {
      setLoadedEvents(events);
    } else {
      loadEvents();
    }
  }, [events]);

  /*****KÖZÖSSÉGI RÉSZ*****/
  // Be van-e kapcsolva a közösség az autóhoz
  useEffect(() => {
    if (isModerator) {
      setCommunityEnabled(true);
      return;
    }

    isCommunityEnabledForCar(userId, selectedCarId)
      .then((status) => setCommunityEnabled(status))
      .catch(() => setCommunityEnabled(false));
  }, [isModerator, selectedCarId, userId]);

  // 2. Kapcsoló kezelése (Checkbox)
  const handleCommunityToggle = async (e) => {
    e.stopPropagation(); // pipa != menüpont
    
    const newStatus = e.target.checked;
    setSavingCommunity(true);

    try {
      // mentés DB-be
      await setCommunityEnabledForCar(userId, selectedCarId, newStatus);
      // UI frissítés
      setCommunityEnabled(newStatus);
      window.dispatchEvent(new CustomEvent("community-settings-changed", { detail: { carId: selectedCarId, enabled: newStatus } }));
    } catch (err) {
      alert("Sajnos nem sikerült menteni a beállítást!");
    } finally {
      setSavingCommunity(false);
    }
  };
  /************************/

  return (
    <>
      {/* Hamburger menü gomb */}
      <button className="menu-toggle" type="button" onClick={() => setIsOpen(true)}>
        <span className="menu-toggle-bar" />
        <span className="menu-toggle-bar" />
        <span className="menu-toggle-bar" />
      </button>

      {/* Sötét háttér overlay */}
      <div className={`menu-overlay ${isOpen ? "is-open" : ""}`} onClick={closeMenu} />

      {/* Oldal menü */}
      <div className={`menu-panel ${isOpen ? "is-open" : ""}`}>
        <div className="menu-items">
          <MenuLink to="/muszerfal/utak-tankolasok" icon={tripsAndFuelsIcon} text="Utak és Tankolások" onClick={closeMenu} />
          <MenuLink to="/muszerfal/benzinkutak" icon={gasStationsIcon} text="Benzinkutak" onClick={closeMenu} />
          <MenuLink to="/muszerfal/szerviznaplo" icon={servicelogIcon} text="Szerviznapló" onClick={closeMenu} />
          <MenuLink to="/muszerfal/statisztikak" icon={statisticsIcon} text="Statisztikák" onClick={closeMenu} />

          {/* Közösség */}
          <NavLink
            className={({ isActive }) => 
              `menu-item ${isActive ? "menu-item-active" : ""} ${!communityEnabled ? "menu-item-unavailable" : ""}`
            }
            to={communityEnabled ? "/muszerfal/kozosseg" : "#"}
            onClick={(e) => {
              if (!communityEnabled) e.preventDefault();
              else closeMenu();
            }}
          >
            <img className="menu-icon" src={communityIcon} alt="K" />
            <div className="menu-community-row w-100 d-flex justify-content-between align-items-center">
              <p className="menu-text m-0">Közösség</p>
              {!isModerator && (
                <input
                  type="checkbox"
                  checked={communityEnabled}
                  disabled={isCommunityRoute || savingCommunity}
                  onChange={handleCommunityToggle}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </NavLink>
        </div>

        {/* Események */}
        <div className="menu-events d-flex flex-column" onClick={() => { setShowEventsModal(true); closeMenu(); }}>
          <div className="menu-events-open-target">
            <h3>Események</h3>
            <hr className="my-2 mx-3" />
          </div>

          <div className="menu-events-content overflow-auto px-3">
            {loadedEvents.length > 0 ? (
              loadedEvents.slice(0, 5).map((event) => (
                <EventItem
                  key={event.event_id}
                  title={event.title || "Esemény"}
                  reminder={event.reminder}
                  date={event.date}
                />
              ))
            ) : (
              <p className="menu-events-empty">Még nincs felvett esemény.</p>
            )}
          </div>

          <div className="menu-events-footer mt-auto p-3" onClick={(e) => e.stopPropagation()}>
            <Button text="Új esemény" onClick={() => setShowNewEvent(true)} />
          </div>
        </div>
      </div>

      {showNewEvent && (
        <NewEvent
          onClose={() => setShowNewEvent(false)}
          onSave={async (payload) => {
            if (onEventCreated) {
              await onEventCreated(payload);
            } else {
              await createEvent(payload);
            }
            await loadEvents();
            setSuccessMessage("Esemény sikeresen hozzáadva");
          }}
        />
      )}

      {showEventsModal && (
        <EventsModal
          onClose={() => setShowEventsModal(false)}
          onChanged={loadEvents}
          onSuccess={setSuccessMessage}
        />
      )}

      {successMessage && (
        <SuccessModal
          description={successMessage}
          onClose={function() {
            setSuccessMessage("");
          }}
        />
      )}
    </>
  );
}

// Menüpont sablon
function MenuLink({ to, icon, text, onClick }) {
  return (
    <NavLink 
      className={({ isActive }) => `menu-item ${isActive ? "menu-item-active" : ""}`} 
      to={to} 
      onClick={onClick}
    >
      <img className="menu-icon" src={icon} alt={text} />
      <p className="menu-text">{text}</p>
    </NavLink>
  );
}
