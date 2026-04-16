import { useCallback, useEffect, useState } from "react";
import Button from "../../components/button/button";
import LabeledInput from "../../components/labeledInput/labeledInput";
import Loading from "../../components/loading/loading";
import Modal from "../../components/modal/modal";
import SuccessModal from "../../components/success-modal/successModal";
import { deleteEvent, getEvents, updateEvent } from "../../actions/events/eventActions";
import { clampNumberInput, limitTextLength } from "../../actions/shared/inputValidation";
import "./eventsModal.css";

// Szövegek tisztítása
function parseReminder(reminder) {
  let text = String(reminder || "").trim();
  if (!text) return "";
  
  // | karakter jobb oldala
  if (text.includes("|")) {
    const parts = text.split("|");
    text = (parts[1] || "").trim();
  }
  
  // "km" levágása
  let cleanValue = text;
  if (cleanValue.toLowerCase().endsWith("km")) {
    cleanValue = cleanValue.substring(0, cleanValue.length - 2).trim();
  }
  
  return cleanValue;
}

export default function EventsModal({ onClose, onChanged, onSuccess }) {
  const today = new Date().toISOString().slice(0, 10);
  
  // Állapotkezelők
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrorsById, setFieldErrorsById] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successText, setSuccessText] = useState("");

  // Események betöltése
  const loadEvents = useCallback(async function() {
    setError("");
    setIsLoading(true);

    try {
      const data = await getEvents();
      const formattedEvents = data.map(function(event) {
        return {
          id: event.id,
          title: event.title || "",
          date: event.date ? String(event.date).slice(0, 10) : "",
          reminder: parseReminder(event.reminder),
        };
      });
      setEvents(formattedEvents);
      setFieldErrorsById({});
    } catch (err) {
      setError(err.message || "Nem sikerült betölteni az eseményeket.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(function() {
    loadEvents();
  }, [loadEvents]);

  // inputok frissítése gépeléskor
  function updateEventField(eventId, key, value) {
    setEvents(function(prev) {
      return prev.map(function(item) {
        return item.id === eventId ? { ...item, [key]: value } : item;
      });
    });

    // Hibaüzenet törlése
    if (fieldErrorsById[eventId]?.[key]) {
      setFieldErrorsById(function(prev) {
        const next = { ...prev };
        next[eventId] = { ...next[eventId], [key]: "" };
        return next;
      });
    }
  }

  // Mentés
  async function handleSave(eventId) {
    const current = events.find(function(item) {
      return item.id === eventId;
    });
    
    if (!current) return;

    // Validáció
    const errors = {};
    if (!current.title.trim()) errors.title = "A név kötelező.";
    if (!current.date) errors.date = "A dátum kötelező.";
    if (current.date && current.date < today) errors.date = "Múltbeli dátum nem adható meg.";

    if (Object.keys(errors).length > 0) {
      setFieldErrorsById(function(prev) {
        return { ...prev, [eventId]: errors };
      });
      return;
    }

    setError("");
    setActionLoadingId(eventId);

    try {
      await updateEvent(eventId, {
        partName: current.title.trim(),
        date: current.date,
        reminder: current.reminder,
      });

      onChanged?.();
      await loadEvents();
      onSuccess?.("Esemény sikeresen módosítva");
      onClose?.();
    } catch (err) {
      setError(err.message || "Hiba történt a mentés során.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Törlés
  async function handleDelete(eventId) {
    setError("");
    setActionLoadingId(eventId);

    try {
      await deleteEvent(eventId);
      onChanged?.();
      await loadEvents();
      onSuccess?.("Esemény sikeresen törölve");
      onClose?.();
    } catch (err) {
      setError(err.message || "Hiba történt a törlés során.");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <>
      <Modal title="Események kezelése" onClose={onClose} columns={1}>
        <div className="events-modal-wrap full-width">
          {isLoading && <Loading />}
          
          {!isLoading && error && <p className="text-danger text-center">{error}</p>}

          {!isLoading && !error && events.length === 0 && (
            <p className="text-center mt-3">Még nincs felvett esemény.</p>
          )}

          {!isLoading && !error && events.length > 0 && (
            <div className="events-modal-list">
              {events.map(function(event) {
                const rowErrors = fieldErrorsById[event.id] || {};
                const isWorking = actionLoadingId === event.id;

                return (
                  <div key={event.id} className="events-modal-item">
                    <LabeledInput
                      label="Esemény neve"
                      value={event.title}
                      onChange={function(e) {
                        updateEventField(event.id, "title", limitTextLength(e.target.value, 25));
                      }}
                      error={rowErrors.title}
                    />

                    <LabeledInput
                      label="Dátum"
                      type="date"
                      value={event.date}
                      min={today}
                      onChange={function(e) {
                        updateEventField(event.id, "date", e.target.value);
                      }}
                      error={rowErrors.date}
                    />

                    <LabeledInput
                      label="Emlékeztető (km)"
                      type="number"
                      value={event.reminder}
                      onChange={function(e) {
                        const val = clampNumberInput(e.target.value, { min: 0, max: 999999, integer: true });
                        updateEventField(event.id, "reminder", val);
                      }}
                    />

                    <div className="events-modal-actions">
                      <Button
                        text={isWorking ? "..." : "Mentés"}
                        onClick={function() { handleSave(event.id); }}
                        disabled={isWorking}
                      />
                      <Button
                        text={isWorking ? "..." : "Törlés"}
                        className="btn-danger"
                        onClick={function() { handleDelete(event.id); }}
                        disabled={isWorking}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {showSuccess && (
        <SuccessModal
          description={successText}
          onClose={function() {
            setShowSuccess(false);
            setSuccessText("");
          }}
        />
      )}
    </>
  );
}
