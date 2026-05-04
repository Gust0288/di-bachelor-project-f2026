def build_spec() -> dict:
    return {
        "openapi": "3.0.3",
        "info": {
            "title": "DI Indmeldelsesportal API",
            "version": "1.0",
            "description": (
                "Backend API til DI's selvbetjeningswizard. "
                "Start med POST /registration/session, gem derefter hvert step med "
                "POST /registration/session/{session_id}/step/{n}."
            ),
        },
        "tags": [
            {"name": "Flow", "description": "Wizard flow-definition"},
            {"name": "Session", "description": "Opret og hent session"},
            {"name": "Steps", "description": "Gem step-data og hent forslag"},
            {"name": "Dokumenter", "description": "Fil-upload"},
        ],
        "paths": {
            "/registration/flow": {
                "get": {
                    "tags": ["Flow"],
                    "summary": "Hent komplet wizard flow-definition",
                    "description": "Returnerer alle 11 steps med felter, valgmuligheder og blokerende options.",
                    "responses": {
                        "200": {
                            "description": "Flow-definition JSON med version, total_steps og steps[]"
                        }
                    },
                }
            },
            "/registration/session": {
                "post": {
                    "tags": ["Session"],
                    "summary": "Opret ny wizard-session",
                    "responses": {
                        "201": {
                            "description": "Session oprettet",
                            "content": {
                                "application/json": {
                                    "example": {
                                        "session_id": "550e8400-e29b-41d4-a716-446655440000",
                                        "current_step": 1,
                                        "expires_at": "2026-05-18T10:00:00+00:00",
                                    }
                                }
                            },
                        }
                    },
                }
            },
            "/registration/session/{session_id}": {
                "get": {
                    "tags": ["Session"],
                    "summary": "Hent session state (til genoptagelse)",
                    "parameters": [
                        {
                            "name": "session_id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Session med current_step, tier, flags og step_data",
                            "content": {"application/json": {"example": {
                                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                                "current_step": 7,
                                "tier": "smv",
                                "flags": {"established_ag": True},
                                "status": "draft",
                                "expires_at": "2026-05-18T10:00:00+00:00",
                                "step_data": {
                                    "1": {"cvr_number": "12345678", "company_name": "Test A/S", "contact_name": "Jane Doe", "contact_email": "jane@test.dk"},
                                    "3": {"selected_services": ["overenskomst", "personalejuridisk_raadgivning"]},
                                    "4": {"employee_count": 25},
                                    "5": {"overenskomst_status": "ja", "overenskomst_type": "direkte", "document_id": "uuid"},
                                    "6": {"branchefaellesskaber": ["di-handel"]},
                                    "7": {"computed_membership": "Arbejdsgiver", "membership_type": "Arbejdsgiver"},
                                },
                            }}},
                        },
                        "404": {"description": "Session ikke fundet eller udløbet"},
                    },
                }
            },
            "/registration/session/{session_id}/submit": {
                "post": {
                    "tags": ["Session"],
                    "summary": "Afslut wizard og opret registrering",
                    "description": (
                        "Kræver at alle 11 steps er gennemført (current_step = 11). "
                        "Opretter en række i `registrations`-tabellen og sætter session status til 'submitted'."
                    ),
                    "parameters": [
                        {
                            "name": "session_id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Registrering oprettet – data er nu i registrations-tabellen",
                            "content": {"application/json": {"example": {
                                "registration_id": "550e8400-e29b-41d4-a716-446655440000",
                                "session_id": "661f9511-f30c-52e5-b827-557766551111",
                                "status": "submitted",
                            }}},
                        },
                        "400": {"description": "Wizard ikke gennemført endnu (current_step < 11)"},
                        "404": {"description": "Session ikke fundet eller udløbet"},
                    },
                }
            },
            "/registration/session/{session_id}/step/{step_number}": {
                "post": {
                    "tags": ["Steps"],
                    "summary": "Gem data for et wizard-step",
                    "description": (
                        "**Membership beregnes automatisk efter step 6** ud fra:\n\n"
                        "- **Step 3** services: `overenskomst`, `personalejuridisk_raadgivning`, `erhvervsjuridisk_raadgivning` → løfter SMV til Arbejdsgiver. "
                        "`byggegaranti` / `di_byggeri_sektion` → tilføjer DI Byggeri → Branchemedlem for erhverv.\n"
                        "- **Step 4** ansatte: 1-9=mikro→Associeret, 10-49=smv, 50+=erhverv\n"
                        "- **Step 5** overenskomst: `nej`→non_ovk flag, `ja`+`direkte`→established_ag flag (dokument påkrævet), `ved_ikke`/`anden`→BLOKERET\n"
                        "- **Step 6** branches: mandatory fællesskab tilføjes automatisk fra branchekode\n\n"
                        'Resultat gemmes i `session.step_data["7"]["computed_membership"]`.'
                    ),
                    "parameters": [
                        {
                            "name": "session_id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                        },
                        {
                            "name": "step_number",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "integer", "minimum": 1, "maximum": 10},
                        },
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"type": "object"},
                                "examples": {
                                    "Step 1 – Virksomhedsinformation": {
                                        "value": {
                                            "cvr_number": "12345678",
                                            "company_name": "Test A/S",
                                            "company_type": "Aktieselskab",
                                            "address": "Testvej 1",
                                            "zip_code": "2100",
                                            "city": "København Ø",
                                            "industry_code": "620200",
                                            "industry_description": "Konsulentbistand vedrørende informationsteknologi",
                                            "contact_name": "Jane Doe",
                                            "contact_email": "jane@test.dk",
                                            "contact_phone": "12345678",
                                        }
                                    },
                                    "Step 2 – Bekræft CVR-oplysninger": {
                                        "value": {
                                            "cvr_confirmed": True,
                                        }
                                    },
                                    "Step 3 – Servicevalg (løfter til Arbejdsgiver)": {
                                        "value": {
                                            "selected_services": [
                                                "overenskomst",
                                                "personalejuridisk_raadgivning",
                                            ],
                                        }
                                    },
                                    "Step 3 – Servicevalg (Byggegaranti → DI Byggeri påkrævet)": {
                                        "value": {
                                            "selected_services": ["byggegaranti"],
                                        }
                                    },
                                    "Step 4 – Medarbejdere (mikro, 5 ansatte)": {"value": {
                                        "employee_count": 5,
                                        "no_employees": False,
                                        "employee_types": ["funktionaer", "timeloennet"],
                                        "total_loensum": 1500000,
                                    }},
                                    "Step 4 – Medarbejdere (SMV, 25 ansatte)": {"value": {
                                        "employee_count": 25,
                                        "no_employees": False,
                                        "employee_types": ["funktionaer"],
                                        "total_loensum": 8000000,
                                    }},
                                    "Step 4 – Medarbejdere (Erhverv, 75 ansatte)": {"value": {
                                        "employee_count": 75,
                                        "no_employees": False,
                                        "employee_types": ["funktionaer", "timeloennet", "vikar"],
                                        "total_loensum": 25000000,
                                    }},
                                    "Step 4 – Ingen ansatte endnu": {"value": {
                                        "employee_count": 0,
                                        "no_employees": True,
                                        "employee_types": ["ved_ikke"],
                                        "total_loensum": 0,
                                    }},
                                    "Step 5 – Overenskomst: Nej → non_ovk flag": {
                                        "value": {
                                            "overenskomst_status": "nej",
                                        }
                                    },
                                    "Step 5 – Overenskomst: Ja + direkte → established_ag flag (dokument påkrævet)": {
                                        "value": {
                                            "overenskomst_status": "ja",
                                            "overenskomst_type": "direkte",
                                            "document_id": "550e8400-e29b-41d4-a716-446655440000",
                                        }
                                    },
                                    "Step 5 – BLOKERENDE: Ved ikke": {
                                        "value": {"overenskomst_status": "ved_ikke"}
                                    },
                                    "Step 5 – BLOKERENDE: Anden overenskomsttype": {
                                        "value": {
                                            "overenskomst_status": "ja",
                                            "overenskomst_type": "anden",
                                        }
                                    },
                                    "Step 6 – Branchefællesskaber (mandatory tilføjes automatisk)": {
                                        "value": {
                                            "branchefaellesskaber": ["di-byggeri"],
                                        }
                                    },
                                    "Step 7 – Bekræft Associeret": {
                                        "value": {
                                            "membership_type": "Associeret",
                                            "accept_membership": True,
                                        }
                                    },
                                    "Step 7 – Bekræft Arbejdsgiver": {
                                        "value": {
                                            "membership_type": "Arbejdsgiver",
                                            "accept_membership": True,
                                        }
                                    },
                                    "Step 7 – Bekræft Branchemedlem": {
                                        "value": {
                                            "membership_type": "Branchemedlem",
                                            "accept_membership": True,
                                        }
                                    },
                                    "Step 8 – Kontaktpersoner (email faktura)": {
                                        "value": {
                                            "managing_director": {
                                                "name": "Jane Doe",
                                                "email": "jane@test.dk",
                                                "phone": "12345678",
                                                "title": "Administrerende direktør",
                                            },
                                            "hr_contact": {
                                                "name": "HR Person",
                                                "email": "hr@test.dk",
                                                "phone": "87654321",
                                            },
                                            "payroll_contact": {
                                                "name": "Løn Person",
                                                "email": "loen@test.dk",
                                            },
                                            "authorized_signatory": None,
                                            "invoice_delivery": "email",
                                        }
                                    },
                                    "Step 8 – Kontaktpersoner (betalingsservice)": {
                                        "value": {
                                            "managing_director": {
                                                "name": "Jane Doe",
                                                "email": "jane@test.dk",
                                                "phone": "12345678",
                                            },
                                            "hr_contact": None,
                                            "payroll_contact": None,
                                            "authorized_signatory": None,
                                            "invoice_delivery": "betalingsservice",
                                        }
                                    },
                                    "Step 9 – Accepter betingelser": {
                                        "value": {
                                            "accept_terms": True,
                                            "accept_authority": True,
                                        }
                                    },
                                    "Step 10 – MitID (mock – send tomt body)": {
                                        "value": {},
                                        "summary": "Backend auto-godkender og sætter mitid_verified=true. Send blot et tomt objekt.",
                                    },
                                },
                            }
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "Step gemt. is_blocked=true hvis blokerende svar er valgt.",
                            "content": {
                                "application/json": {
                                    "example": {
                                        "session_id": "uuid",
                                        "current_step": 6,
                                        "tier": "smv",
                                        "flags": {"non_ovk": True},
                                        "is_blocked": False,
                                        "blocking_popup": None,
                                        "next_step": 6,
                                    }
                                }
                            },
                        },
                        "404": {"description": "Session ikke fundet"},
                        "422": {"description": "Valideringsfejl"},
                    },
                },
                "get": {
                    "tags": ["Steps"],
                    "summary": "Hent gemt data for et step (back-navigation)",
                    "parameters": [
                        {
                            "name": "session_id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                        },
                        {
                            "name": "step_number",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "integer"},
                        },
                    ],
                    "responses": {
                        "200": {"description": "Gemt step-data"},
                        "404": {"description": "Session ikke fundet"},
                    },
                },
            },
            "/registration/session/{session_id}/step/6/suggestions": {
                "get": {
                    "tags": ["Steps"],
                    "summary": "Hent DI branchefællesskabs-forslag til step 6",
                    "description": "Returnerer mandatory (låst), suggested og all (alle 13 fællesskaber) baseret på CVR-branchekode.",
                    "parameters": [
                        {
                            "name": "session_id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Forslag til branchefællesskaber",
                            "content": {
                                "application/json": {
                                    "example": {
                                        "mandatory": ["di-byggeri"],
                                        "suggested": ["di-teknik-og-installation"],
                                        "all": [
                                            {"id": "di-byggeri", "name": "DI Byggeri"}
                                        ],
                                    }
                                }
                            },
                        },
                        "404": {"description": "Session ikke fundet"},
                    },
                }
            },
            "/documents/upload": {
                "post": {
                    "tags": ["Dokumenter"],
                    "summary": "Upload dokument (f.eks. overenskomst til step 5)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "multipart/form-data": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "session_id": {"type": "string"},
                                        "file": {"type": "string", "format": "binary"},
                                    },
                                    "required": ["session_id", "file"],
                                }
                            }
                        },
                    },
                    "responses": {
                        "201": {"description": "Dokument uploadet"},
                        "400": {"description": "Mangler session_id eller fil"},
                    },
                }
            },
            "/cvr/lookup": {
                "get": {
                    "tags": ["Flow"],
                    "summary": "Slå virksomhed op via CVR eller navn",
                    "parameters": [
                        {
                            "name": "vat",
                            "in": "query",
                            "schema": {"type": "string"},
                            "description": "CVR-nummer (8 cifre)",
                        },
                        {
                            "name": "name",
                            "in": "query",
                            "schema": {"type": "string"},
                            "description": "Virksomhedsnavn (min. 3 tegn)",
                        },
                    ],
                    "responses": {
                        "200": {"description": "Virksomhedsoplysninger"},
                        "404": {"description": "Virksomhed ikke fundet"},
                    },
                }
            },
        },
    }
