import Button from "../../../components/button/button";
import Card from "../../../components/card/card";
import GasStationCard from "../../../components/gas-station-card/gasStationCard";

export default function ModeratorPage({ pendingRequests = [], onReview }) {
  
  // Üres állapot
  if (pendingRequests.length === 0) {
    return (
      <div className="mt-5 mb-4">
        <Card>
          <div className="community-section-card">
            <h3 className="text-primary mb-3">Várólista</h3>
            <p className="text-light mb-0">Nincs függőben lévő kérelem.</p>
          </div>
        </Card>

        <hr className="mt-5"/>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <Card>
        <div className="community-section-card">
          <h3 className="text-primary mb-1">Várólista</h3>

          <div className="mb-4">
            <a 
              href="https://holtankoljak.hu/#!" 
              target="_blank" 
              rel="noreferrer" 
              className="community-help-link"
            >
              Segítség
            </a>
          </div>

          <div className="row g-4 justify-content-center">
            {/* kérelmek */}
            {pendingRequests.map(function(item) {
              // Dátum formázás
              const date = String(item.created_at).slice(0, 10);

              return (
                <div
                  key={item.request_id}
                  className="col-11 col-md-6 col-lg-4 d-flex flex-column align-items-center"
                >
                  {/* Benzinkút */}
                  <GasStationCard
                    station={{ ...item.station, datum: date }}
                    showDefaultActions={false}
                    extraInfo={item.full_name + " - " + item.car_name}
                  />

                  {/* Elfogadás/Elutasítás */}
                  <div className="d-flex gap-2 justify-content-center mt-2">
                    <Button 
                      text="Elfogadás" 
                      onClick={function() {
                        onReview?.(item.request_id, "accept");
                      }} 
                    />
                    <Button 
                      text="Elutasítás" 
                      onClick={function() {
                        onReview?.(item.request_id, "reject");
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}