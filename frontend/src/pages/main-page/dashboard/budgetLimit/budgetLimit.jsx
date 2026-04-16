import "./budgetLimit.css";
import { formatGroupedNumber } from "../../../../actions/shared/formatters";

export default function BudgetLimit({ spent = 0, limit = 0 }) {
  
  // Százalék számítása (max 100%)
  const percentage = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
  
  // Túllépte-e
  const isOverLimit = limit > 0 && spent > limit;

  return (
    <div className="budget-container mx-auto">
      <h3 className="fw-bold budget-title">HAVI KÖLTÉSI LIMIT</h3>
      
      {/* LimitBar */}
      <div className="bar-wrapper">
        <div className="bar">
          <div 
            className="limit-indicator" 
            style={{ left: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Statisztikák */}
      <div className="d-flex flex-column">
        {/* elköltött VS limit */}
        <p className={`stats-ft ${isOverLimit ? "stats-ft-over" : ""}`}>
          {`${formatGroupedNumber(spent)} / ${formatGroupedNumber(limit)}`}
        </p>
        
        {/* Százalék */}
        <p className="stats-percentage">{percentage}%</p>
      </div>
    </div>
  );
}