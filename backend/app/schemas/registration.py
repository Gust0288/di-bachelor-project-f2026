from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, EmailStr, field_validator, model_validator


class Step1Data(BaseModel):
    # CVR-data (sendes fra frontend efter CVR-opslag)
    cvr_number: str
    company_name: str
    company_type: Optional[str] = None  # virksomhedsform
    address: Optional[str] = None  # adresse
    zip_code: Optional[str] = None  # postnummer
    city: Optional[str] = None  # by
    industry_code: Optional[str] = None  # branchekode
    industry_description: Optional[str] = None  # branchetekst

    # Kontaktpersonens oplysninger
    contact_name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    website: Optional[str] = None

    @field_validator("cvr_number")
    @classmethod
    def validate_cvr(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 8:
            raise ValueError("CVR-nummer skal være 8 cifre")
        return v


class Step2Data(BaseModel):
    cvr_confirmed: bool

    @field_validator("cvr_confirmed")
    @classmethod
    def must_be_confirmed(cls, v: bool) -> bool:
        if not v:
            raise ValueError(
                "Du skal bekræfte virksomhedsoplysningerne for at fortsætte"
            )
        return v


class Step3Data(BaseModel):
    selected_services: list[str]
    andet_beskrivelse: Optional[str] = None


VALID_EMPLOYEE_TYPES = {
    "funktionaer",
    "timeloennet",
    "timeloennet_funktionaer_lignende",
    "vikar",
    "byggeri_og_anlaeg",
    "mandskabsudlejning",
    "ved_ikke",
}


class Step4Data(BaseModel):
    employee_count: int
    no_employees: bool = False
    employee_types: list[str]
    total_loensum: int

    @model_validator(mode="after")
    def validate_step4(self) -> "Step4Data":
        if self.no_employees:
            self.employee_count = 0
        if self.employee_count < 0:
            raise ValueError("Antal ansatte kan ikke være negativt")
        if self.total_loensum < 0:
            raise ValueError("Lønsum kan ikke være negativ")
        invalid = set(self.employee_types) - VALID_EMPLOYEE_TYPES
        if invalid:
            raise ValueError(f"Ugyldige medarbejdertyper: {invalid}")
        if not self.employee_types:
            raise ValueError("Vælg mindst én medarbejdertype")
        return self


class Step5Data(BaseModel):
    overenskomst_status: Literal["nej", "ved_ikke", "ja"]
    overenskomst_type: Optional[Literal["direkte", "anden"]] = None
    document_id: Optional[str] = None

    @model_validator(mode="after")
    def document_required_for_direkte(self) -> "Step5Data":
        if self.overenskomst_type == "direkte" and not self.document_id:
            raise ValueError(
                "Du skal uploade jeres overenskomst når I har en direkte aftale med et fagforbund"
            )
        return self


class Step6Data(BaseModel):
    branchefaellesskaber: list[str]


class Step7Data(BaseModel):
    membership_type: str
    accept_membership: bool


class ContactPerson(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    title: Optional[str] = None


class Step8Data(BaseModel):
    managing_director: ContactPerson
    hr_contact: Optional[ContactPerson] = None
    payroll_contact: Optional[ContactPerson] = None
    authorized_signatory: Optional[ContactPerson] = None
    invoice_delivery: Literal["email", "betalingsservice"]


class Step9Data(BaseModel):
    accept_terms: bool
    accept_authority: bool


class Step10Data(BaseModel):
    mitid_verified: bool = False


STEP_SCHEMAS: dict[int, type[BaseModel]] = {
    1: Step1Data,
    2: Step2Data,
    3: Step3Data,
    4: Step4Data,
    5: Step5Data,
    6: Step6Data,
    7: Step7Data,
    8: Step8Data,
    9: Step9Data,
    10: Step10Data,
}


class SessionCreateResponse(BaseModel):
    session_id: str
    current_step: int
    expires_at: str


class SessionStateResponse(BaseModel):
    session_id: str
    current_step: int
    tier: Optional[str]
    flags: dict[str, Any]
    step_data: dict[str, Any]
    status: str
    expires_at: str


class StepSubmitResponse(BaseModel):
    session_id: str
    current_step: int
    tier: Optional[str]
    flags: dict[str, Any]
    is_blocked: bool
    blocking_popup: Optional[dict[str, Any]]
    next_step: Optional[int]


class StepDataResponse(BaseModel):
    step_number: int
    data: dict[str, Any]


class BranchSuggestionsResponse(BaseModel):
    mandatory: list[str]
    suggested: list[str]
    all: list[dict[str, str]]


class SubmitResponse(BaseModel):
    registration_id: str
    session_id: str
    status: str
