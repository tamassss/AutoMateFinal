import "./eventItem.css"
import { formatDate, formatGroupedNumber } from "../../actions/shared/formatters";

// km formázás
function formatKmText(rawValue) {
  if (!rawValue) return "";

  const text = String(rawValue).trim();
  const numericString = text.toLowerCase().replace("km", "").trim();

  const isNumeric = !isNaN(numericString) && numericString !== "";

  if (isNumeric) {
    return `${formatGroupedNumber(numericString)} km`;
  }

  return text;
}

// km emlékeztető
function formatReminderText(reminder) {
  if (!reminder) return "";

  const text = String(reminder).trim();
  if (!text) return "";

  return formatKmText(text);
}

export default function EventItem({ title, days, km, reminder, date }) {
  // Km emlékeztető
  const reminderText = formatReminderText(reminder ?? km);
  const dateText = formatDate(date);

  return (
    <div className="event-item d-flex flex-column align-items-center">
      <h4 className="event-item-title">{title}</h4>
      
      <div className="d-flex flex-column align-items-center">
        {date && dateText !== "-" && (
          <p className="event-detail-text">{dateText}</p>
        )}
        
        {days && (
          <p className="event-detail-text">{days} nap</p>
        )}
        
        {reminderText && (
          <p className="event-detail-text">{reminderText}</p>
        )}
      </div>
    </div>
  );
}
