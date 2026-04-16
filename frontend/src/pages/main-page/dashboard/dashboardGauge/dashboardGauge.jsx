import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboardGauge.css";

import Button from "../../../../components/button/button";
import EditLimit from "../../../../modals/editLimit/editLimit";
import BudgetLimit from "../budgetLimit/budgetLimit";
import SuccessModal from "../../../../components/success-modal/successModal";
import { formatGroupedNumber } from "../../../../actions/shared/formatters";

export default function DashboardGauge({ selectedCar, monthlyBudget, onSaveLimit }) {
    const [showLimit, setShowLimit] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

    // Fogyasztás jó-e
    const avgConsumption = selectedCar?.average_consumption;
    const hasAverageConsumption = avgConsumption !== null && avgConsumption !== undefined && avgConsumption !== "";

    return (
        <div className="w-100">
            {/* Limit */}
            <div className="limit d-flex flex-column align-items-center">
                <BudgetLimit
                    spent={monthlyBudget?.spent || 0}
                    limit={monthlyBudget?.limit || 0}
                />

                <div className="limit-btn-wrapper">
                    <Button
                        text="limit"
                        onClick={() => setShowLimit(true)}
                    />
                </div>

                {/* Limit szerkesztés modal */}
                {showLimit && (
                    <EditLimit
                        onClose={() => setShowLimit(false)}
                        onSave={function(value) {
                            onSaveLimit?.(value);
                            setSuccessMessage("Sikeres limit módosítás");
                        }}
                        initialLimit={monthlyBudget?.limit || 0}
                    />
                )}
            </div>

            <hr className="mb-5" />

            {/* Fogyasztás */}
            <div className="screen d-flex flex-column align-items-center w-100">
                <div className="screen-div w-100">
                    <table className="dg-table w-100">
                        <thead>
                            <tr className="table-title-tr">
                                <th colSpan={2} className="title-th">
                                    <p className="field average-consumption-title">
                                        Átlagos fogyasztás
                                    </p>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {/* Átlagfogyasztás */}
                                <td className="even field cons-td">
                                    <p className="text-center">
                                        {hasAverageConsumption
                                            ? `${formatGroupedNumber(avgConsumption, { decimals: 2, trimTrailingZeros: true })} l/100km`
                                            : "?"}
                                    </p>
                                </td>
                                
                                {/* Teszt indítása link */}
                                <td className="odd field test-td">
                                    <button
                                        type="button"
                                        className="dashboard-gauge-test-link"
                                        onClick={() => navigate("/muszerfal/atlagfogyasztas")}
                                    >
                                        Teszt
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {successMessage && (
                <SuccessModal
                    description={successMessage}
                    onClose={function() {
                        setSuccessMessage("");
                    }}
                />
            )}
        </div>
    );
}
