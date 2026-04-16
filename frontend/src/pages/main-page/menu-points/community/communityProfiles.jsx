import Card from "../../../../components/card/card";
import Button from "../../../../components/button/button";
import { getCarImageSrc } from "../../../../assets/car-images/carImageOptions";

export default function CommunityProfiles({ loading, enabled, profiles, onCompare }) {
  if (loading) {
    return null;
  }

  if (!enabled) {
    return (
      <p className="text-center text-light">
        Ehhez az autóhoz nincs engedélyezve a közösségi rész.
      </p>
    );
  }

  // Profilok megjelenítése
  function renderProfiles() {
    if (profiles.length === 0) {
      return (
        <div className="col-12 community-empty-profiles">
          <p className="text-center text-light fs-4 m-0">
            Még nincs másik engedélyezett profil.
          </p>
        </div>
      );
    }

    return profiles.map(function(profile) {
      const profileKey = `${profile.user_id}_${profile.car_id}`;
      const carImage = profile.car_image || profile.carImage;
      const imageSrc = profile.profile_image || getCarImageSrc(carImage);

      return (
        <div key={profileKey} className="col-12 col-md-6 col-xl-4">
          <Card>
            <div className="p-3 text-center text-light">
              <img
                src={imageSrc}
                alt={profile.car_name || "Autó"}
                style={{ width: "130px", height: "130px", objectFit: "contain" }}
              />
              <h5 className="text-primary mt-3 mb-1">{profile.full_name}</h5>
              <p className="mb-1">{profile.car_name}</p>
              <p className="mb-3 text-secondary">{profile.license_plate}</p>
              
              <Button 
                text="Statisztikák összehasonlítása" 
                onClick={function() {
                  onCompare(profile);
                }} 
              />
            </div>
          </Card>
        </div>
      );
    });
  }

  return (
    <div className="row g-4">
      {renderProfiles()}
    </div>
  );
}
