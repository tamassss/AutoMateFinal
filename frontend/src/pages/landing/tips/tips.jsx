import Navbar from "../../../components/navbar/navbar"

import "./tips.css"

import { Link } from "react-router-dom"

export default function Tips() {
    return (
        <div className="tips-page-wrapper">
            <Navbar />
            <div className="container-fluid p-0 tips-full-height">
                <div className="row g-0 h-100 w-100">
                    <div className="col-lg-4 d-flex indicators">
                        <Link to="/tippek/muszerfal-jelzesek" className="tip-link">
                            <p>Műszerfal jelzések</p>
                        </Link>
                    </div>

                    <div className="col-lg-4 d-flex fuel-saving">
                        <Link to="/tippek/uzemanyag-sporolas" className="tip-link">
                            <p>Üzemanyag spórolás</p>
                        </Link>
                    </div>

                    <div className="col-lg-4 d-flex parking-tips">
                        <Link to="/tippek/parkolasi-tippek" className="tip-link">
                            <p>Parkolási tippek</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}