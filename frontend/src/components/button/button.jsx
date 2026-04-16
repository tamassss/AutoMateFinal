import "./button.css"

export default function Button({text, onClick, type, className, disabled}){
    return(
        <button onClick={onClick} type={type} className={className} disabled={disabled}> 
            {text}
        </button>
    )
}
