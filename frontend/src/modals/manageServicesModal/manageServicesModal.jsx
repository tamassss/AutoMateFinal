import { useCallback, useEffect, useState } from "react";
import Button from "../../components/button/button";
import LabeledInput from "../../components/labeledInput/labeledInput";
import Loading from "../../components/loading/loading";
import Modal from "../../components/modal/modal";
import SuccessModal from "../../components/success-modal/successModal";
import {
  deleteServiceLogEntry,
  getServiceLog,
  updateServiceLogEntry,
} from "../../actions/serviceLog/serviceLogActions";
import { clampNumberInput, limitTextLength } from "../../actions/shared/inputValidation";
import "./manageServicesModal.css";

function parseReminder(reminder) {
  const text = String(reminder || "").trim();

  if (!text || text === "-") {
    return { reminderDate: "", reminderKm: "" };
  }

  // ha | van benne
  if (text.includes("|")) {
    const parts = text.split("|");
    let reminderDate = (parts[0] || "").trim();
    let reminderKm = (parts[1] || "").trim();

    if (reminderKm.toLowerCase().endsWith("km")) {
      reminderKm = reminderKm.substring(0, reminderKm.length - 2).trim();
    }
    return { reminderDate, reminderKm };
  }

  // csak dátum
  if (text.includes("-")) {
    return { reminderDate: text, reminderKm: "" };
  }

  // csak km
  let cleanKm = text;
  if (cleanKm.toLowerCase().endsWith("km")) {
    cleanKm = cleanKm.substring(0, cleanKm.length - 2).trim();
  }

  return { reminderDate: "", reminderKm: cleanKm };
}

export default function ManageServicesModal({ onClose, onChanged, onSuccess }) {
  const today = new Date().toISOString().slice(0, 10);
  
  // Állapotok
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrorsById, setFieldErrorsById] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successText, setSuccessText] = useState("");

  // Adatok betöltése
  const loadServices = useCallback(async function() {
    setError("");
    setIsLoading(true);

    try {
      const data = await getServiceLog();
      const formatted = data.map(function(service) {
        const parsed = parseReminder(service.rawReminder || service.emlekeztetoDatum);
        return {
          id: service.id,
          partName: service.alkatresz === "-" ? "" : service.alkatresz,
          date: service.rawDate ? String(service.rawDate).slice(0, 10) : "",
          cost: service.rawCost == null ? "" : String(service.rawCost),
          reminderDate: parsed.reminderDate,
          reminderKm: parsed.reminderKm,
        };
      });
      setServices(formatted);
      setFieldErrorsById({});
    } catch (err) {
      setError(err.message || "Nem sikerült betölteni a szervizeket.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(function() {
    loadServices();
  }, [loadServices]);

  // Mező frissítése
  function updateServiceField(serviceId, key, value) {
    setServices(function(prev) {
      return prev.map(function(item) {
        return item.id === serviceId ? { ...item, [key]: value } : item;
      });
    });

    if (fieldErrorsById[serviceId]?.[key]) {
      setFieldErrorsById(function(prev) {
        const next = { ...prev };
        next[serviceId] = { ...next[serviceId], [key]: "" };
        return next;
      });
    }
  }

  // Mentés
  async function handleSave(serviceId) {
    const current = services.find(function(item) { return item.id === serviceId; });
    if (!current) return;

    // Validáció
    const errors = {};
    if (!current.partName.trim()) errors.partName = "Az alkatrész megadása kötelező.";
    if (!current.date) errors.date = "A dátum megadása kötelező.";
    if (current.date && current.date > today) errors.date = "A csere ideje nem lehet jövőbeli.";
    if (current.reminderDate && current.reminderDate < today) errors.reminderDate = "Az emlékeztető nem lehet múltbeli.";

    if (Object.keys(errors).length > 0) {
      setFieldErrorsById(function(prev) { return { ...prev, [serviceId]: errors }; });
      return;
    }

    setError("");
    setActionLoadingId(serviceId);

    try {
      await updateServiceLogEntry(serviceId, {
        partName: current.partName.trim(),
        date: current.date,
        cost: current.cost,
        reminderDate: current.reminderDate,
        reminderKm: current.reminderKm,
      });

      onChanged?.();
      await loadServices();
      onSuccess?.("Szerviz sikeresen módosítva");
      onClose?.();
    } catch (err) {
      setError(err.message || "Hiba történt a módosítás során.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Törlés
  async function handleDelete(serviceId) {
    setError("");
    setActionLoadingId(serviceId);

    try {
      await deleteServiceLogEntry(serviceId);
      onChanged?.();
      await loadServices();
      onSuccess?.("Szerviz sikeresen törölve");
      onClose?.();
    } catch (err) {
      setError(err.message || "Hiba történt a törlés során.");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <>
      <Modal title="Szervizek kezelése" onClose={onClose} columns={1}>
        <div className="manage-services-wrap full-width">
          {isLoading && <Loading />}
          
          {!isLoading && error && <p className="text-danger text-center">{error}</p>}

          {!isLoading && !error && services.length === 0 && (
            <p className="text-center mt-3">Még nincs felvett szerviz.</p>
          )}

          {!isLoading && !error && services.length > 0 && (
            <div className="manage-services-list">
              {services.map(function(service) {
                const rowErrors = fieldErrorsById[service.id] || {};
                const isWorking = actionLoadingId === service.id;

                return (
                  <div key={service.id} className="manage-services-item">
                    <LabeledInput
                      label="Alkatrész"
                      value={service.partName}
                      onChange={function(e) {
                        updateServiceField(service.id, "partName", limitTextLength(e.target.value, 50));
                      }}
                      error={rowErrors.partName}
                    />

                    <LabeledInput
                      label="Csere ideje"
                      type="date"
                      value={service.date}
                      max={today}
                      onChange={function(e) {
                        updateServiceField(service.id, "date", e.target.value);
                      }}
                      error={rowErrors.date}
                    />

                    <LabeledInput
                      label="Ár (Ft)"
                      type="number"
                      value={service.cost}
                      onChange={function(e) {
                        const val = clampNumberInput(e.target.value, { min: 0, max: 999999999, integer: true });
                        updateServiceField(service.id, "cost", val);
                      }}
                      error={rowErrors.cost}
                    />

                    <LabeledInput
                      label="Emlékeztető dátum"
                      type="date"
                      value={service.reminderDate}
                      min={today}
                      onChange={function(e) {
                        updateServiceField(service.id, "reminderDate", e.target.value);
                      }}
                      error={rowErrors.reminderDate}
                    />

                    <LabeledInput
                      label="Emlékeztető (km)"
                      type="number"
                      value={service.reminderKm}
                      onChange={function(e) {
                        const val = clampNumberInput(e.target.value, { min: 0, max: 999999, integer: true });
                        updateServiceField(service.id, "reminderKm", val);
                      }}
                      error={rowErrors.reminderKm}
                    />

                    <div className="manage-services-actions">
                      <Button
                        text={isWorking ? "..." : "Mentés"}
                        onClick={function() { handleSave(service.id); }}
                        disabled={isWorking}
                      />
                      <Button
                        text={isWorking ? "..." : "Törlés"}
                        className="btn-danger"
                        onClick={function() { handleDelete(service.id); }}
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
