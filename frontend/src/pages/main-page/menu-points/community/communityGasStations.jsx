import GasStationCard from "../../../../components/gas-station-card/gasStationCard";
import ModeratorPage from "../../../roles/moderator/moderatorPage";

export default function CommunityGasStations({
  loading,
  isModerator,
  pendingRequests,
  sharedCards,
  onReview,
  onDeleteShared,
}) {
  if (loading) {
    return null;
  }

  // Kártyák megjelenítése
  function renderSharedCards() {
    if (sharedCards.length === 0) {
      return (
        <p className="text-center text-light mt-4">
          Még nincs jóváhagyott megosztott benzinkút.
        </p>
      );
    }

    return (
      <div className="row g-4 justify-content-center mt-1">
        {sharedCards.map(function(card) {
          const cardKey = `${card.gasStationId}_${card.requestId}`;
          
          return (
            <div key={cardKey} className="col-11 col-md-6 col-lg-4 d-flex justify-content-center">
              <GasStationCard
                station={card}
                showDefaultActions={false}
                extraInfo={card.extraInfo}
                extraButtonText={isModerator ? "Törlés" : ""}
                onExtraButtonClick={function() {
                  onDeleteShared(card.requestId);
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {isModerator && (
        <ModeratorPage 
          pendingRequests={pendingRequests} 
          onReview={onReview} 
        />
      )}

      {renderSharedCards()}
    </>
  );
}