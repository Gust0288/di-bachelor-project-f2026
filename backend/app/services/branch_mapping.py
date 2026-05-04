from __future__ import annotations

DI_BRANCH_COMMUNITIES: list[dict[str, str]] = [
    {"id": "di-biosolutions",              "name": "DI Biosolutions"},
    {"id": "di-byggeri",                   "name": "DI Byggeri"},
    {"id": "di-digital",                   "name": "DI Digital"},
    {"id": "di-energi",                    "name": "DI Energi"},
    {"id": "di-foedevarer",                "name": "DI Fødevarer"},
    {"id": "di-handel",                    "name": "DI Handel"},
    {"id": "di-lifescience",               "name": "DI Life Science"},
    {"id": "di-produktion",                "name": "DI Produktion"},
    {"id": "di-radgiverne",                "name": "DI Rådgiverne"},
    {"id": "di-service",                   "name": "DI Service"},
    {"id": "di-teknik-og-installation",    "name": "DI Teknik & Installation"},
    {"id": "di-transport",                 "name": "DI Transport"},
    {"id": "di-turisme-kultur-oplevelser", "name": "DI Turisme, Kultur & Oplevelser"},
]

# CVR branchekode-præfiks (2 cifre) → { mandatory, optional }
BRANCH_COMMUNITY_MAP: dict[str, dict[str, str | list[str]]] = {
    "10": {"mandatory": "di-foedevarer",              "optional": []},
    "11": {"mandatory": "di-foedevarer",              "optional": []},
    "21": {"mandatory": "di-lifescience",             "optional": ["di-biosolutions"]},
    "26": {"mandatory": "di-digital",                 "optional": ["di-lifescience"]},
    "27": {"mandatory": "di-teknik-og-installation",  "optional": ["di-produktion"]},
    "28": {"mandatory": "di-produktion",              "optional": ["di-teknik-og-installation"]},
    "35": {"mandatory": "di-energi",                  "optional": []},
    "41": {"mandatory": "di-byggeri",                 "optional": []},
    "42": {"mandatory": "di-byggeri",                 "optional": []},
    "43": {"mandatory": "di-byggeri",                 "optional": ["di-teknik-og-installation"]},
    "45": {"mandatory": "di-handel",                  "optional": []},
    "46": {"mandatory": "di-handel",                  "optional": []},
    "47": {"mandatory": "di-handel",                  "optional": []},
    "49": {"mandatory": "di-transport",               "optional": []},
    "50": {"mandatory": "di-transport",               "optional": []},
    "51": {"mandatory": "di-transport",               "optional": []},
    "52": {"mandatory": "di-transport",               "optional": []},
    "55": {"mandatory": "di-turisme-kultur-oplevelser", "optional": []},
    "56": {"mandatory": "di-turisme-kultur-oplevelser", "optional": []},
    "62": {"mandatory": "di-digital",                 "optional": []},
    "63": {"mandatory": "di-digital",                 "optional": []},
    "70": {"mandatory": "di-radgiverne",              "optional": []},
    "71": {"mandatory": "di-radgiverne",              "optional": ["di-byggeri"]},
    "72": {"mandatory": "di-biosolutions",            "optional": ["di-lifescience"]},
    "73": {"mandatory": "di-radgiverne",              "optional": []},
    "74": {"mandatory": "di-radgiverne",              "optional": []},
    "79": {"mandatory": "di-turisme-kultur-oplevelser", "optional": []},
    "85": {"mandatory": "di-service",                 "optional": []},
    "86": {"mandatory": "di-lifescience",             "optional": ["di-service"]},
    "90": {"mandatory": "di-turisme-kultur-oplevelser", "optional": []},
    "93": {"mandatory": "di-turisme-kultur-oplevelser", "optional": []},
    "_default": {"mandatory": "di-produktion",        "optional": []},
}


def get_suggestions(branch_codes: list[str]) -> dict[str, list]:
    """
    Returnerer mandatory og optional fællesskaber baseret på CVR branchekoder.
    branch_codes: liste af branchekoder fra CVR (f.eks. ["412000", "431100"])
    """
    mandatory: set[str] = set()
    optional: set[str] = set()

    for code in branch_codes:
        prefix = code[:2] if len(code) >= 2 else code
        mapping = BRANCH_COMMUNITY_MAP.get(prefix, BRANCH_COMMUNITY_MAP["_default"])
        mandatory.add(mapping["mandatory"])
        optional.update(mapping["optional"])

    # optional må ikke overlappe med mandatory
    optional -= mandatory

    return {
        "mandatory": list(mandatory),
        "suggested": list(optional),
        "all": DI_BRANCH_COMMUNITIES,
    }
