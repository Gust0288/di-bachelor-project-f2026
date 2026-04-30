import httpx

CVR_BASE_URL = "https://cvrapi.dk/api"
USER_AGENT = "DI - Indmeldelsesportal - gustavbogh@gmail.com"


def lookup_company(search: str, search_type: str = "vat") -> dict:
    """search_type: 'vat' | 'name' | 'produ' | 'phone'"""
    with httpx.Client() as client:
        response = client.get(
            CVR_BASE_URL,
            params={"country": "dk", search_type: search},
            headers={"User-Agent": USER_AGENT},
            timeout=10.0,
        )

    data = response.json()

    if "error" in data:
        raise ValueError(data["error"])

    return {
        "navn": data.get("name"),
        "cvr": data.get("vat"),
        "virksomhedsform": data.get("companydesc"),
        "adresse": data.get("address"),
        "postnummer": data.get("zipcode"),
        "by": data.get("city"),
        "branchekode": data.get("industrycode"),
        "branchetekst": data.get("industrydesc"),
    }
