import batteryIcon from "../../../../assets/dashboard-lights/battery.png"
import checkEngineIcon from "../../../../assets/dashboard-lights/check-engine.png"
import coolantTemperatureIcon from "../../../../assets/dashboard-lights/coolant-temperature.png"
import oilPressureIcon from "../../../../assets/dashboard-lights/oil-pressure.png"
import tirePressureIcon from "../../../../assets/dashboard-lights/tire-pressure.png"

export const lights = [
    {
        img: batteryIcon,
        title: "Akkumulátor töltésjelző",
        meaning: "Az autó elektromos rendszere nem kap töltést. Hibás lehet a generátor vagy elszakadt az ékszíj.",
        todo: "Azonnal állj meg biztonságos helyen! Ha továbbmész, az autó összes elektromos rendszere (lámpák, szervó) leállhat."
    },
    {
        img: checkEngineIcon,
        title: "Motorhiba",
        meaning: "A motorvezérlő egység hibát észlelt a motor működésében.",
        todo: "Vezess óvatosan a legközelebbi szervizbe. Ha a lámpa villog, azonnal állj meg, mert a motor súlyosan károsodhat!",
    },
    {
        img: coolantTemperatureIcon,
        title: "Hűtőfolyadék hőmérséklet",
        meaning: "A motor hűtővize túlmelegedett. Fennáll a hengerfej-károsodás vagy a motor besülésének veszélye.",
        todo: "Állj félre és állítsd le a motort. Várd meg, amíg lehűl! Soha ne nyisd ki a hűtősapkát forró állapotban a gőzveszély miatt.",
    },
    {
        img: oilPressureIcon,
        title: "Alacsony olajnyomás",
        meaning: "Nincs elegendő olajnyomás a motorban. Kenés nélkül a motoralkatrészek pillanatok alatt tönkremennek.",
        todo: "AZONNAL ÁLLÍTSD LE A MOTORT! Ellenőrizd az olajszintet. Ha a szint rendben, de a lámpa ég, ne indítsd újra, hívj autómentőt.",
    },
    {
        img: tirePressureIcon,
        title: "Guminyomás jelző",
        meaning: "Legalább az egyik gumiabroncsban jelentősen lecsökkent a levegő nyomása vagy defektet kaptál.",
        todo: "Állj meg az első benzinkúton és ellenőrizd a nyomást mind a négy kerékben. Állítsd be a gyári értékre, vagy cserélj kereket defekt esetén.",
    },
]