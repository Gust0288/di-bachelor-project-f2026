_ARBEJDSGIVER_SERVICES = {"overenskomst", "personalejuridisk_raadgivning", "erhvervsjuridisk_raadgivning"}
_BYGGERI_SERVICES = {"byggegaranti", "di_byggeri_sektion"}


def calculate_membership(
    tier: str,
    flags: dict,
    branchefaellesskaber: list[str],
    selected_services: list[str],
) -> str:
    """
    Beregner membership type baseret på tier, flags, branchefællesskaber og services.

    tier: 'mikro' | 'smv' | 'erhverv'
    flags: { 'non_ovk': bool, 'established_ag': bool }
    branchefaellesskaber: valgte DI-fællesskaber fra step 6
    selected_services: valgte services fra step 3

    Returner en af: 'Associeret', 'Arbejdsgiver', 'Branchemedlem', 'Erhvervsmedlem'

    Service-regler:
    - overenskomst / personalejuridisk / erhvervsjuridisk → løfter SMV til Arbejdsgiver
    - byggegaranti / di_byggeri_sektion → tilføjer di-byggeri → løfter erhverv til Branchemedlem
    """
    services = set(selected_services)

    effective_branches = set(branchefaellesskaber)
    if services & _BYGGERI_SERVICES:
        effective_branches.add("di-byggeri")

    has_branch = bool(effective_branches)
    established = bool(flags.get("established_ag"))
    service_requires_arbejdsgiver = bool(services & _ARBEJDSGIVER_SERVICES)

    if tier == "erhverv":
        return "Branchemedlem" if has_branch else "Erhvervsmedlem"

    if tier == "smv":
        if established or service_requires_arbejdsgiver:
            return "Arbejdsgiver"
        return "Associeret"

    return "Associeret"


def compute_tier(employee_count: int) -> str:
    if employee_count < 10:
        return "mikro"
    elif employee_count < 50:
        return "smv"
    return "erhverv"
