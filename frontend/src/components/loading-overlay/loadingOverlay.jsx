import { useEffect, useState } from "react";
import { subscribeLoading } from "../../actions/shared/loadingTracker";
import "./loadingOverlay.css";

export default function LoadingOverlay() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeLoading(setPendingCount);
    return unsubscribe;
  }, []);

  if (pendingCount <= 0) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-overlay-box">Betöltés...</div>
    </div>
  );
}
