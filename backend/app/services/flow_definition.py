from __future__ import annotations

FLOW_DEFINITION: dict = {
    "version": "1.0",
    "total_steps": 11,
    "steps": [
        {
            "step_number": 1,
            "step_id": "virksomhedsinformation",
            "title": "Virksomhedsinformation",
            "description": "Søg på CVR-nummer eller virksomhedsnavn for at hente oplysninger, og udfyld kontaktpersonens informationer.",
            "fields": [
                {
                    "field_id": "cvr_number",
                    "type": "cvr_lookup",
                    "label": "CVR-nummer eller virksomhedsnavn",
                    "required": True,
                    "validation": {"pattern": "^[0-9]{8}$"},
                    "autocomplete": "off",
                },
                {
                    "field_id": "company_name",
                    "type": "text",
                    "label": "Virksomhedens navn",
                    "required": True,
                    "readonly": True,
                    "hint": "Udfyldes automatisk fra CVR",
                },
                # Disse felter sendes fra frontend efter CVR-opslag og gemmes i DB
                {
                    "field_id": "company_type",
                    "type": "hidden",
                    "label": "Virksomhedsform",
                    "required": False,
                    "source": "cvr.virksomhedsform",
                },
                {
                    "field_id": "address",
                    "type": "hidden",
                    "label": "Adresse",
                    "required": False,
                    "source": "cvr.adresse",
                },
                {
                    "field_id": "zip_code",
                    "type": "hidden",
                    "label": "Postnummer",
                    "required": False,
                    "source": "cvr.postnummer",
                },
                {
                    "field_id": "city",
                    "type": "hidden",
                    "label": "By",
                    "required": False,
                    "source": "cvr.by",
                },
                {
                    "field_id": "industry_code",
                    "type": "hidden",
                    "label": "Branchekode",
                    "required": False,
                    "source": "cvr.branchekode",
                },
                {
                    "field_id": "industry_description",
                    "type": "hidden",
                    "label": "Branchetekst",
                    "required": False,
                    "source": "cvr.branchetekst",
                },
                {
                    "field_id": "contact_name",
                    "type": "text",
                    "label": "Kontaktpersonens fulde navn",
                    "required": True,
                    "autocomplete": "name",
                },
                {
                    "field_id": "contact_email",
                    "type": "email",
                    "label": "Email",
                    "required": True,
                    "autocomplete": "email",
                },
                {
                    "field_id": "contact_phone",
                    "type": "tel",
                    "label": "Telefonnummer",
                    "required": False,
                    "autocomplete": "tel",
                },
                {
                    "field_id": "website",
                    "type": "url",
                    "label": "Hjemmeside",
                    "required": False,
                    "autocomplete": "url",
                },
            ],
            "blocking_options": None,
            "next_step": 2,
        },
        {
            "step_number": 2,
            "step_id": "bekraeft-virksomhedsinfo",
            "title": "Bekræft virksomhedsoplysninger",
            "description": (
                "Gennemgå oplysningerne vi har hentet fra CVR-registeret. "
                "Er der fejl, skal du rette dem på virk.dk – herefter kan du genindlæse siden og forsætte."
            ),
            "fields": [
                {
                    "field_id": "cvr_confirmed",
                    "type": "checkbox",
                    "label": "Jeg bekræfter at ovenstående virksomhedsoplysninger er korrekte",
                    "required": True,
                },
            ],
            "display_fields": [
                {"label": "Virksomhedsnavn", "source": "step_data.1.company_name"},
                {"label": "CVR-nummer", "source": "step_data.1.cvr_number"},
                {"label": "Adresse", "source": "step_data.1.address"},
                {"label": "Branchekode(r)", "source": "step_data.1.industry_code"},
            ],
            "blocking_options": None,
            "next_step": 3,
        },
        {
            "step_number": 3,
            "step_id": "servicevalg",
            "title": "Vælg Service",
            "description": "Vælg hvilke services og ydelser I ønsker som DI-medlem. Jeres valg er med til at bestemme jeres endelige medlemskabstype.",
            "fields": [
                {
                    "field_id": "selected_services",
                    "type": "checkbox_group",
                    "label": "Ønskede services",
                    "required": True,
                    "min_selections": 1,
                    "options": [
                        {"value": "overenskomst", "label": "Overenskomst"},
                        {
                            "value": "personalejuridisk_raadgivning",
                            "label": "Personalejuridisk rådgivning",
                        },
                        {
                            "value": "erhvervsjuridisk_raadgivning",
                            "label": "Erhvervsjuridisk rådgivning",
                        },
                        {"value": "byggegaranti", "label": "Byggegaranti"},
                        {
                            "value": "di_byggeri_sektion",
                            "label": "Medlemskab af sektion i DI Byggeri",
                        },
                        {"value": "andet", "label": "Andet"},
                    ],
                },
                {
                    "field_id": "andet_beskrivelse",
                    "type": "textarea",
                    "label": "Beskriv venligst",
                    "required": False,
                    "depends_on": {
                        "field_id": "selected_services",
                        "contains": "andet",
                    },
                },
            ],
            "blocking_options": None,
            "next_step": 4,
        },
        {
            "step_number": 4,
            "step_id": "medarbejdere",
            "title": "Medarbejdere",
            "description": "Angiv oplysninger om jeres medarbejdere. Dette bruges til at fastsætte jeres medlemskabstier og kontingent.",
            "fields": [
                {
                    "field_id": "employee_count",
                    "type": "number",
                    "label": "Antal ansatte",
                    "required": True,
                    "validation": {"min": 0},
                    "hint": "0–9 ansatte = Mikro · 10–49 = SMV · 50+ = Erhverv",
                },
                {
                    "field_id": "no_employees",
                    "type": "checkbox",
                    "label": "Virksomheden har ingen ansatte (0 ansatte)",
                    "required": False,
                    "hint": "Sæt hak her hvis I endnu ikke har ansatte – feltet ovenfor sættes automatisk til 0.",
                },
                {
                    "field_id": "employee_types",
                    "type": "checkbox_group",
                    "label": "Hvilke typer medarbejdere har virksomheden?",
                    "required": True,
                    "options": [
                        {"value": "funktionaer",                          "label": "Funktionær (funktionærkontrakt)"},
                        {"value": "timeloennet",                          "label": "Timelønnet"},
                        {"value": "timeloennet_funktionaer_lignende",     "label": "Timelønnet ansat på funktionærlignende kontrakt"},
                        {"value": "vikar",                                "label": "Vikar"},
                        {"value": "byggeri_og_anlaeg",                    "label": "Medarbejdere inden for byggeri og anlæg"},
                        {"value": "mandskabsudlejning",                   "label": "Mandskabsudlejning"},
                        {"value": "ved_ikke",                             "label": "Ved ikke"},
                    ],
                },
                {
                    "field_id": "total_loensum",
                    "type": "number",
                    "label": "Samlet lønsum (kr.) – seneste regnskabsår",
                    "required": True,
                    "validation": {"min": 0},
                    "hint": "Den samlede lønudgift bruges til at beregne jeres kontingent.",
                },
            ],
            "blocking_options": None,
            "next_step": 5,
        },
        {
            "step_number": 5,
            "step_id": "overenskomst",
            "title": "Overenskomst",
            "description": "Screeningen hjælper os med at afklare jeres nuværende overenskomstsituation inden indmeldelse.",
            "fields": [
                {
                    "field_id": "overenskomst_status",
                    "type": "radio",
                    "label": "Har virksomheden en overenskomst?",
                    "required": True,
                    "options": [
                        {"value": "nej", "label": "Nej"},
                        {"value": "ved_ikke", "label": "Ved ikke"},
                        {"value": "ja", "label": "Ja"},
                    ],
                },
                {
                    "field_id": "overenskomst_type",
                    "type": "radio",
                    "label": "Hvilken type overenskomst?",
                    "required": False,
                    "depends_on": {"field_id": "overenskomst_status", "value": "ja"},
                    "options": [
                        {"value": "direkte", "label": "Direkte med et fagforbund"},
                        {
                            "value": "anden",
                            "label": "Med en anden arbejdsgiverorganisation",
                        },
                    ],
                },
                {
                    "field_id": "document_id",
                    "type": "file_upload",
                    "label": "Upload overenskomst",
                    "required": False,
                    "depends_on": {"field_id": "overenskomst_type", "value": "direkte"},
                    "accepted_types": ["application/pdf", "image/*"],
                    "upload_endpoint": "/documents/upload",
                },
            ],
            "blocking_options": [
                {
                    "field_id": "overenskomst_status",
                    "blocking_values": ["ved_ikke"],
                    "popup": {
                        "title": "Kontakt DI for vejledning",
                        "message": (
                            "Du har angivet, at I ikke er sikre på overenskomstsituationen. "
                            "Det er vigtigt at få dette afklaret, inden I melder jer ind i DI. "
                            "Kontakt os, så hjælper vi jer videre – eller gå tilbage og ret dit svar."
                        ),
                        "phone": "3377 3377",
                        "email": "di@di.dk",
                    },
                },
                {
                    "field_id": "overenskomst_type",
                    "blocking_values": ["anden"],
                    "popup": {
                        "title": "Kontakt DI",
                        "message": (
                            "Overenskomster med andre arbejdsgiverorganisationer kræver manuel behandling "
                            "og stemmer ikke overens med DI's indmeldelseskriterier for selvbetjening. "
                            "Kontakt os direkte, eller gå tilbage og ret dit svar."
                        ),
                        "phone": "3377 3377",
                        "email": "di@di.dk",
                    },
                },
            ],
            "next_step": 6,
        },
        {
            "step_number": 6,
            "step_id": "branchefaellesskaber",
            "title": "Branchefællesskaber",
            "description": (
                "Baseret på jeres branchekode er I automatisk tilmeldt ét DI branchefællesskab. "
                "I kan derudover vælge yderligere fællesskaber."
            ),
            "fields": [
                {
                    "field_id": "branchefaellesskaber",
                    "type": "branch_community_selector",
                    "label": "DI Branchefællesskaber",
                    "required": True,
                    "mandatory_note": "Det fremhævede fællesskab er obligatorisk og kan ikke fravælges.",
                    "suggestions_endpoint": "/registration/session/{session_id}/step/6/suggestions",
                },
            ],
            "blocking_options": None,
            "next_step": 7,
        },
        {
            "step_number": 7,
            "step_id": "medlemskab",
            "title": "Jeres medlemskab",
            "description": "Baseret på jeres oplysninger har vi beregnet den anbefalede medlemskabstype. Gennemgå og bekræft.",
            "fields": [
                {
                    "field_id": "membership_type",
                    "type": "computed_display",
                    "label": "Anbefalet medlemskabstype",
                    "required": True,
                    "readonly": True,
                    "hint": "Beregnet ud fra antal ansatte, overenskomst og valgte fællesskaber.",
                },
                {
                    "field_id": "accept_membership",
                    "type": "checkbox",
                    "label": "Jeg bekræfter den anbefalede medlemskabstype",
                    "required": True,
                },
            ],
            "blocking_options": None,
            "next_step": 8,
        },
        {
            "step_number": 8,
            "step_id": "kontaktpersoner",
            "title": "Kontaktpersoner",
            "description": (
                "Oplysninger om administrerende direktør er hentet fra CVR. "
                "Kontrollér at de er korrekte og tilføj øvrige kontaktpersoner."
            ),
            "fields": [
                {
                    "field_id": "managing_director",
                    "type": "contact_person",
                    "label": "Administrerende direktør",
                    "required": True,
                },
                {
                    "field_id": "hr_contact",
                    "type": "contact_person",
                    "label": "Primær kontaktperson for personalejura",
                    "required": False,
                    "hint": "Den person DI kontakter ved personalejuridiske spørgsmål.",
                },
                {
                    "field_id": "payroll_contact",
                    "type": "contact_person",
                    "label": "Lønsumsinberreter",
                    "required": False,
                    "hint": "Den person der indberetter lønsum til DI.",
                },
                {
                    "field_id": "authorized_signatory",
                    "type": "contact_person",
                    "label": "Anden tegningsberettiget end Adm. Dir.",
                    "required": False,
                    "hint": "Udfyldes kun hvis en anden person end adm. dir. tegner virksomheden.",
                },
                {
                    "field_id": "invoice_delivery",
                    "type": "radio",
                    "label": "Hvordan ønsker I at modtage jeres faktura?",
                    "required": True,
                    "options": [
                        {"value": "email",            "label": "På e-mail"},
                        {"value": "betalingsservice", "label": "Via Betalingsservice (BS)"},
                    ],
                },
            ],
            "blocking_options": None,
            "next_step": 9,
        },
        {
            "step_number": 9,
            "step_id": "opsummering",
            "title": "Opsummering",
            "description": "Gennemgå jeres oplysninger og acceptér betingelserne for at fortsætte.",
            "fields": [
                {
                    "field_id": "accept_terms",
                    "type": "checkbox",
                    "label": "Jeg accepterer DI's medlemsbetingelser og vedtægter",
                    "required": True,
                },
                {
                    "field_id": "accept_authority",
                    "type": "checkbox",
                    "label": "Jeg bekræfter at have bemyndigelse til at indmelde virksomheden",
                    "required": True,
                },
            ],
            "blocking_options": None,
            "next_step": 10,
        },
        {
            "step_number": 10,
            "step_id": "mitid",
            "title": "MitID verificering",
            "description": "Verificér din identitet med MitID for at gennemføre indmeldelsen.",
            "backend_only": True,
            "mock_in_development": True,
            "fields": [],
            "blocking_options": None,
            "next_step": 11,
        },
        {
            "step_number": 11,
            "step_id": "bekraeftelse",
            "title": "Bekræftelse",
            "description": "Jeres anmodning om indmeldelse i DI er modtaget.",
            "fields": [],
            "blocking_options": None,
            "next_step": None,
        },
    ],
}
