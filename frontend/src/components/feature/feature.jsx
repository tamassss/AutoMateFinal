import "./feature.css"

export default function Feature({icon, title, content, content2}){
    return(
        <div className="feature">
            <img src={icon}/>
            <div>
                <h4>{title}</h4>
                <p>{content}</p>
                <p>{content2}</p>
            </div>
        </div>
    )
}