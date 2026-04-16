import Input from "../input/input";
import "./labeledInput.css"

export default function LabeledInput({label, ...inputProps}){
    return(
        <div className="labeled-input">
            <p>{label}</p>
            <Input {...inputProps}/>
        </div>
    )
}