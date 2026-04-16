import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


class RouteEstimateError(Exception):
    pass


class AddressNotFoundError(RouteEstimateError):
    pass


def _fetch_json(url: str, timeout: int = 10):
    req = Request(url, headers={"User-Agent": "AutoMate/1.0"})
    with urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _geocode(city_text: str):
    query = quote(city_text or "")
    url = f"https://nominatim.openstreetmap.org/search?format=json&limit=1&q={query}"
    data = _fetch_json(url)
    if not data:
        raise AddressNotFoundError("Nem található cím.")
    return data[0]


def estimate_route(from_text: str, to_text: str, avg_consumption=None):
    try:
        from_point = _geocode(from_text)
        to_point = _geocode(to_text)

        route_url = (
            "https://router.project-osrm.org/route/v1/driving/"
            f"{from_point['lon']},{from_point['lat']};{to_point['lon']},{to_point['lat']}?overview=false"
        )
        route_data = _fetch_json(route_url)
    except (HTTPError, URLError, TimeoutError):
        raise RouteEstimateError("Külső útvonal szolgáltatás nem elérhető.")
    except KeyError:
        raise RouteEstimateError("Érvénytelen válasz érkezett az útvonal szolgáltatástól.")

    route = (route_data or {}).get("routes", [None])[0]
    if not route:
        raise RouteEstimateError("Nem sikerült útvonalat számolni.")

    km = float(route.get("distance", 0)) / 1000
    minutes = round(float(route.get("duration", 0)) / 60)

    liters = None
    if avg_consumption not in (None, ""):
        liters = (km * float(avg_consumption)) / 100

    return {
        "km": round(km, 1),
        "minutes": int(minutes),
        "liters": None if liters is None else round(liters, 2),
    }
