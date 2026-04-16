import "./fuelTable.css"
import Card from "../card/card"
import editIcon from "../../assets/icons/edit.png"
import deleteIcon from "../../assets/icons/delete.png"
import { useState } from "react"
import DeleteFuel from "../../modals/deleteFuel/deleteFuel"
import EditFuel from "../../modals/editFuel/editFuel"
import { formatGroupedNumber } from "../../actions/shared/formatters"

export default function FuelTable({month, data, onDeletedFuel, onUpdatedFuel}){
    const [selectedFuel, setSelectedFuel] = useState(null)
    const [editedFuel, setEditedFuel] = useState(null)

    return(
        <div className="mb-5">
            <h3 className="text-left mb-3 fuel-table-date" style={{ color: "#89C4FF" }}>{month}</h3>
            
            <Card>
                <div className="fuel-table-scroll">
                <table className="table table-dark mt-2">
                    <thead>
                        <tr>
                            <th>Dátum</th>
                            <th>Mennyiség</th>
                            <th>Ft/liter</th>
                            <th>Km óra állás</th>
                            <th>Funkciók</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(fuel => (
                            <tr key={fuel.id}>
                                <td>{fuel.datum}</td>
                                <td>{`${formatGroupedNumber(fuel.mennyiseg, { decimals: 2, trimTrailingZeros: true })} l`}</td>
                                <td>{`${formatGroupedNumber(fuel.literft)} Ft/l`}</td>
                                <td>{fuel.kmallas === "-" ? "-" : `${formatGroupedNumber(fuel.kmallas)} km`}</td>
                                <td className="td-btns">
                                    <button onClick={() => setEditedFuel(fuel)}>
                                        <img src={editIcon} className="td-btn"/>
                                    </button>
                                    <button onClick={() => setSelectedFuel(fuel)}>
                                        <img src={deleteIcon} className="td-btn"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </Card>


            {/* Modals */}
            {selectedFuel && (
                <DeleteFuel
                    onClose={() => setSelectedFuel(null)}
                    fuelingId={selectedFuel.id}
                    datum={selectedFuel.datum}
                    onDeleted={(deletedFuelId) => {
                        onDeletedFuel?.(deletedFuelId)
                        setSelectedFuel(null)
                    }}
                />
            )}

            {editedFuel && (
                <EditFuel
                    onClose={() => setEditedFuel(null)}
                    selectedFuel={editedFuel}
                    onSave={(updatedFuel) => {
                        onUpdatedFuel?.(updatedFuel)
                        setEditedFuel(null)
                    }}
                />
            )}
        </div>
    )
}
