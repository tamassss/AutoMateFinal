import Card from "../../../../components/card/card"
import Navbar from "../../../../components/navbar/navbar"
import "./fuelSaving.css"

export default function FuelSaving() {
    return (
        <>
        <Navbar/>
        <div className="fuelSaving-container">
            
            <h1 className="fuelSaving-title">Üzemanyag spórolás</h1>

            <div className="content-wrapper">
                <Card>
                    <div className="tips">
                        <p><span className="tip-span">1. tipp:</span> Fújja fel megfelelően az abroncsokat, hogy kisebb legyen az ellenállásuk</p>
                        <p><span className="tip-span">2. tipp:</span> Vegye ki az autóból a felesleges tárgyakat, hogy csökkentse az össztömeget</p>
                        <p><span className="tip-span">3. tipp:</span> Ha gyorsan megy, húzza fel az ablakokat, hogy csökkentse a légellenállást</p>
                        <p><span className="tip-span">4. tipp:</span> Ne használja feleslegesen a fűtést vagy a légkondit</p>
                        <p><span className="tip-span">5. tipp:</span> Ha több, mint 30 másodpercet kell várnia, állítsa le az autót</p>
                        <p><span className="tip-span">6. tipp:</span> Váltson megfelelő időben, ne legyen magas a fordulatszám</p>
                        <p><span className="tip-span">7. tipp:</span> Kerülje a hirtelen gyorsítást és fékezést</p>
                    </div>
                </Card>

                <p className="fuelSaving-footer">
                    Ha ezekre odafigyel, jelentősen csökkentheti az autója üzemanyag fogyasztását!
                </p>
            </div>
            

        </div>
        </>
    )
}