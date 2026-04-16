import { useState } from "react"
import "./parkingHelp.css"

import em1 from "../../../../assets/parking/em/em_1.png"
import em2 from "../../../../assets/parking/em/em_2.png"

import hm1 from "../../../../assets/parking/hm/hm_1.png"
import hm2 from "../../../../assets/parking/hm/hm_2.png"
import hm3 from "../../../../assets/parking/hm/hm_3.png"

import ep1 from "../../../../assets/parking/ep/ep_1.png"
import ep2 from "../../../../assets/parking/ep/ep_2.png"
import ep3 from "../../../../assets/parking/ep/ep_3.png"
import ep4 from "../../../../assets/parking/ep/ep_4.png"

import hp1 from "../../../../assets/parking/hp/hp_1.png"
import hp2 from "../../../../assets/parking/hp/hp_2.png"
import hp3 from "../../../../assets/parking/hp/hp_3.png"
import hp4 from "../../../../assets/parking/hp/hp_4.png"
import Navbar from "../../../../components/navbar/navbar"

export default function ParkingHelp() {
    const [activeParking, setActiveParking] = useState("eloreMeroleges")

    return (
        <>
            <Navbar />
            <div className="container parking-container">
                <div className="row parking-nav">
                    <div className="col-3" onClick={() => setActiveParking("eloreMeroleges")}>
                        <p className={`parking-nav-tab ${activeParking === "eloreMeroleges" ? "active-tab" : ""}`}>EM</p>
                    </div>
                    <div className="col-3" onClick={() => setActiveParking("hatraMeroleges")}>
                        <p className={`parking-nav-tab ${activeParking === "hatraMeroleges" ? "active-tab" : ""}`}>HM</p>
                    </div>
                    <div className="col-3" onClick={() => setActiveParking("eloreParhuzamos")}>
                        <p className={`parking-nav-tab ${activeParking === "eloreParhuzamos" ? "active-tab" : ""}`}>EP</p>
                    </div>
                    <div className="col-3" onClick={() => setActiveParking("hatraParhuzamos")}>
                        <p className={`parking-nav-tab ${activeParking === "hatraParhuzamos" ? "active-tab" : ""}`}>HP</p>
                    </div>
                </div>

                <div className="parking-div">
                    <div className="row">
                        {/* ELŐRE MERŐLEGES */}
                        {activeParking === "eloreMeroleges" && (
                            <>
                                <h1 className="parking-title">Előre merőleges</h1>
                                <div className="row parking-content gx-5 align-items-center">
                                    <div className="col-12 col-md-6">
                                        <p>1. lépés</p>
                                        <p>Indexelj balra, majd a parkolóhely előtti második vonalnál forgasd el a kormányt</p>
                                        <img src={em1} className="w-100 p-3" />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <p>2. lépés</p>
                                        <p>Korrigáld az autót, hogy a megfelelő helyre érkezz</p>
                                        <img src={em2} className="w-100 p-3" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* HÁTRA MERŐLEGES */}
                        {activeParking === "hatraMeroleges" && (
                            <>
                                <h1 className="parking-title">Hátra merőleges</h1>
                                <div className="row parking-content gx-5 align-items-center">
                                    <div className="col-12 col-md-6">
                                        <p>1. lépés</p>
                                        <p>A parkolóhely megtalálása után hajts tovább, amíg a 3. vonal nincs a válladdal egyvonalban</p>
                                        <img src={hm1} className="w-100 p-3" />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <p>2. lépés</p>
                                        <p>Tedd az autót rükvercbe, majd amikor elindulsz kormányozz jobbra koppanásig</p>
                                        <img src={hm2} className="w-100 p-3" />
                                    </div>

                                    <div className="col-12 text-center">
                                        <p>3. lépés</p>
                                        <p>Ügyelj a többi autóra, ha szükséges, korrigálj</p>
                                        <img src={hm3} className="w-50 p-3" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ELŐRE PÁRHUZAMOS */}
                        {activeParking === "eloreParhuzamos" && (
                            <>
                                <h1 className="parking-title">Előre párhuzamos</h1>
                                <div className="row parking-content gx-5 align-items-center">
                                    <div className="col-12 col-md-6">
                                        <p>1. lépés</p>
                                        <p>Amikor a vállad egyvonalban van a melletted lévő autó elejével, kormányozz jobbra</p>
                                        <img src={ep1} className="w-100 p-3" />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <p>2. lépés</p>
                                        <p>Kormányozz balra úgy, hogy az autód a padka mellett menjen el</p>
                                        <img src={ep2} className="w-100 p-3" />
                                    </div>
                                </div>

                                <div className="row parking-content gx-5 align-items-center">
                                    <div className="col-12 col-md-6">
                                        <p>3. lépés</p>
                                        <p>Hajts egy kicsit tovább, majd tedd az autót rükvercbe</p>
                                        <img src={ep3} className="w-100 p-3" />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <p>4. lépés</p>
                                        <p>Korrigáld úgy, hogy a padkához közel állj és megfelelő távolság legyen az autók között</p>
                                        <img src={ep4} className="w-100 p-3" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* HÁTRA PÁRHUZAMOS */}
                        {activeParking === "hatraParhuzamos" && (
                            <>
                                <h1 className="parking-title">Hátra párhuzamos</h1>
                                <div className="row parking-content gx-5 align-items-center">
                                    <div className="col-12 col-md-6">
                                        <p>1. lépés</p>
                                        <p>Amikor a vállad egyvonalban van a melletted lévő autó visszapillantójával, állj meg</p>
                                        <img src={hp1} className="w-100 p-3" />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <p>2. lépés</p>
                                        <p>Indulj el hátrafelé, tekerd a kormányt jobbra addig, amíg a bal visszapillantóban nem látod a mögötted álló autó jobb első lámpáját. Ezután tolass tovább egyenesen</p>
                                        <img src={hp2} className="w-100 p-3" />
                                    </div>
                                </div>

                                <div className="row parking-content gx-5 align-items-center">
                                    <div className="col-12 col-md-6">
                                        <p>3. lépés</p>
                                        <p>Amikor a jobb visszapillantód kitakarja az előtted álló autó rendszámát, tekerd balra a kormányt</p>
                                        <img src={hp3} className="w-100 p-3" />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <p>4. lépés</p>
                                        <p>Korrigáld úgy, hogy a padkához közel állj és megfelelő távolság legyen az autók között</p>
                                        <img src={hp4} className="w-100 p-3" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
