import logging
import time

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

CVR_BASE_URL = "https://cvrapi.dk/api"
USER_AGENT = f"DI - Indmeldelsesportal - {get_settings().cvr_contact_email}"


def lookup_company(search: str, search_type: str = "vat") -> dict:
    """search_type: 'vat' | 'name' | 'produ' | 'phone'"""
    if get_settings().cvr_mock:
        mock_cvr = search if search_type == "vat" else str(int(time.time()) % 90000000 + 10000000)
        return {
            "navn": "Test Virksomhed ApS",
            "cvr": mock_cvr,
            "virksomhedsform": "Anpartsselskab",
            "adresse": "Testvej 1",
            "postnummer": "1000",
            "by": "København K",
            "branchekode": "620100",
            "branchetekst": "Computerprogrammering",
        }

    params = {"country": "dk", search_type: search}
    api_key = get_settings().cvr_api_key
    if api_key:
        params["token"] = api_key

    with httpx.Client() as client:
        response = client.get(
            CVR_BASE_URL,
            params=params,
            headers={"User-Agent": USER_AGENT},
            timeout=10.0,
        )

    logger.warning(
        "CVR response status=%s body=%s", response.status_code, response.text[:500]
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
