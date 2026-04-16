export default function FuelInfo(){
    return(
        <div>
            <h2 style={{color:"#075DBF", fontWeight:"bold"}}>Tankolás</h2>
            <h5>Adjon hozzá új tankolást és kövesse nyomon:</h5>
            <ul className="text-start">
                <li>heti statisztika</li>
                <li>legutóbbi tankolás</li>
                <li>hány kilométerre elég</li>
            </ul>
        </div>
    );
}