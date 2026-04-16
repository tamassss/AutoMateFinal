import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";

import Navbar from "../../../../components/navbar/navbar";
import Menu from "../../dashboard/menu/menu";
import CommunityComparisonModal from "../../../../modals/communityComparisonModal/communityComparisonModal";
import CommunityProfiles from "./communityProfiles";
import CommunityGasStations from "./communityGasStations";

import * as CommunityActions from "../../../../actions/community/communityLocalActions";

import "../menuLayout.css";
import "./community.css";

export default function Community() {
  const { role } = CommunityActions.getCurrentUserMeta();
  const selectedCarId = Number(localStorage.getItem("selected_car_id") || 0);
  const isModerator = role === "moderator" || role === "admin";

  const [activeTab, setActiveTab] = useState("profiles");
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");

  const [profiles, setProfiles] = useState([]);
  const [sharedStations, setSharedStations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const [myProfile, setMyProfile] = useState(null);
  const [compareTarget, setCompareTarget] = useState(null);
  const [compareState, setCompareState] = useState({ data: null, loading: false, error: "" });

  /***** FUNCTION-ÖK *****/
  // Közösségi adatok frissítése
  const refreshCommunityData = useCallback(async function() {
    setLoading(true);
    setError("");
    try {
      const payload = await CommunityActions.getCommunityProfilesPayload(selectedCarId);
      const shared = await CommunityActions.getApprovedSharedStations();

      setEnabled(!!payload.enabled);
      setMyProfile(payload.my_profile || null);
      setProfiles(payload.profiles || []);
      setSharedStations(shared || []);

      if (isModerator) {
        const pending = await CommunityActions.getPendingShareRequests();
        setPendingRequests(pending);
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      setError(err.message || "Error loading community data.");
    } finally {
      setLoading(false);
    }
  }, [isModerator, selectedCarId]);

  useEffect(function() {
    refreshCommunityData();
  }, [refreshCommunityData]);

  // Benzinkút elfogadása/elutasítása
  async function handleReviewRequest(requestId, decision) {
    await CommunityActions.reviewShareRequest(requestId, decision);
    await refreshCommunityData();
  }

  // Benzinkút törlése
  async function handleDeleteShared(requestId) {
    if (!isModerator) return;
    try {
      await CommunityActions.moderatorDeleteSharedStation(requestId);
      await refreshCommunityData();
    } catch (err) {
      setError("Failed to delete shared station.");
    }
  }

  // Profilok összehasonlítása
  async function handleCompare(targetProfile) {
    if (!myProfile) return;
    setCompareTarget(targetProfile);
    setCompareState({ data: null, loading: true, error: "" });

    try {
      const result = await CommunityActions.getCommunityMonthlyComparison({
        carId: selectedCarId,
        otherUserId: targetProfile.user_id,
        otherCarId: targetProfile.car_id,
      });
      setCompareState(function(prevState) {
        return { ...prevState, data: result, loading: false };
      });
    } catch (err) {
      setCompareState(function(prevState) {
        return { ...prevState, error: "Comparison failed.", loading: false };
      });
    }
  }

  // Benzinkutak formázása
  const formattedStations = sharedStations.map(function(item) {
    return {
      ...item.station,
      date: item.approved_at?.slice(0, 10) || "-",
      extraInfo: `${item.full_name} - ${item.car_name}`,
      requestId: item.request_id,
    };
  });

  if (!loading && !enabled && !isModerator) {
    return (
      <Navigate 
        to="/muszerfal" 
        replace 
        state={{ successMessage: "Nincs engedélyezve a közösség ehhez az autóhoz." }} 
      />
    );
  }

  return (
    <div className="main-menu-layout">
      <div className="main-menu-content">
        <Menu />
      </div>

      <div className="flex-grow-1">
        <Navbar />

        <div>
          <div className="container-fluid p-0 tf-nav-tabs community-tabs">
            <div className="row g-0">
              {["profiles", "stations"].map(function(tab) {
                return (
                  <div
                    key={tab}
                    className={`col-6 d-flex justify-content-center align-items-center tf-nav-tab community-tab ${activeTab === tab ? "active" : "inactive"}`}
                    onClick={function() { setActiveTab(tab); }}
                  >
                    <p className="fs-5 m-0 py-3">
                      {tab === "profiles" ? "Profilok" : "Benzinkutak"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="container py-4">
            {error && <p className="text-danger text-center">{error}</p>}

            {!loading && activeTab === "profiles" && (
              <CommunityProfiles 
                loading={loading} 
                enabled={enabled} 
                profiles={profiles} 
                onCompare={handleCompare} 
              />
            )}

            {!loading && activeTab === "stations" && (
              <CommunityGasStations
                loading={loading}
                canShowStationsTab={enabled || isModerator}
                isModerator={isModerator}
                pendingRequests={pendingRequests}
                sharedCards={formattedStations}
                onReview={handleReviewRequest}
                onDeleteShared={handleDeleteShared}
              />
            )}
          </div>
        </div>
      </div>

      {compareTarget && myProfile && (
        <CommunityComparisonModal
          onClose={function() { setCompareTarget(null); }}
          myProfile={myProfile}
          otherProfile={compareTarget}
          compareData={compareState.data}
          compareLoading={compareState.loading}
          compareError={compareState.error}
        />
      )}
    </div>
  );
}
