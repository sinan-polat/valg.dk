# valg.dk – prototype til bachelorprojekt

Kodet, klikbar prototype (ren HTML, CSS og JavaScript – ingen frameworks, ingen server) af en **opgavebaseret informationsarkitektur** for Valg.dk. Den er lavet til at blive testet med rigtige brugere og dokumenteret i bachelorprojektet.

> **Vigtigt:** Alle tal er **eksempeldata** (genereret af `tools/generate_data.py`). Prototypen er **ikke** den officielle Valg.dk og indeholder ingen officielle valgresultater. Det fremgår af banner og footer på alle sider.

Hvad kan prototypen?
| Skærm | Adresse | Hvad virker |
|---|---|---|
| Forside | #/ | Opgavekort, søgning, skematisk Danmarkskort med regioner (valgdeltagelse / største parti), landsresultat, regioner |
| Find resultat | #/find | Valg, søgning på kommune/region, hurtigvalg for Hele landet og regioner |
| Resultat | #/resultat/horsholm, #/resultat/region-hovedstaden, #/resultat/land | Mandater, sortering, ændring, kort og kommuneliste for regioner/landet, download |
| Sammenlign | #/sammenlign | 2–3 områder (kommuner, regioner, hele landet) i diagram eller tabel |
| Hent data | #/data | Guide i 4 trin: nøgletal/parti, hele landet/regioner/kommuner, valg, format. Forhåndsvisning og download |
| Vejledning | #/vejledning | Søg og trin-for-trin-artikler |
| Faste sider | #/om-valg, #/driftstatus, #/tilgaengelighed, #/privatliv, #/sitemap | Tekst gengivet fra officielle valg.dk (gælder ikke prototypen) |

Kortet er skematisk (ikke et officielt kort); kommunernes placering er omtrentlig, og cirklens areal viser antal valgberettigede, så København ikke ser lille ud. Alle tal er eksempeldata.

Testpanel: åbn adressen med ?test=1. Panelet er en diskret fane i højre kant (Alt+T åbner/lukker) og lukker selv ved Start. Opgaver T1–T5; T5 = hent tal for alle kommuner i Region Hovedstaden (Hent data > Udvalgte regioner, 29 kommuner).

Opdater siden: git add . / git commit -m "Opdatering" / git push.

Læg den på GitHub Pages (ca. 5 minutter)

1. Log ind på github.com og klik **New repository**. Giv det et neutralt navn, fx `valg-prototype`. Vælg **Public**. (Gratis Pages kræver et offentligt repository.)
2. På repoets side: **uploading an existing file**. Træk **hele indholdet** af denne mappe ind (`index.html`, `css/`, `js/`, `tools/`, `README.md`, `.nojekyll`). Husk, at `index.html` skal ligge øverst i repoet. Klik **Commit changes**.
3. Gå til **Settings → Pages**. Under *Build and deployment* vælger du **Deploy from a branch**, branch **main** og mappe **/ (root)**. Klik **Save**.
4. Vent 1–2 minutter. Adressen står øverst på Pages-siden:  
   `https://DIT-BRUGERNAVN.github.io/valg-prototype/`
5. Test linket selv. Til deltagerne sender du blot det link. Til dig selv som facilitator åbner du:  
   `https://DIT-BRUGERNAVN.github.io/valg-prototype/?test=1`

Opdatering senere: upload de ændrede filer igen (samme filnavne), og vent et minut.

Siden har `noindex`, så søgemaskiner ikke bør vise den, men et offentligt link kan stadig deles. Kontrollér med Søren/KOMBIT, før du deler linket, da KOMBITs navn indgår i footeren. Læg ingen interviewcitater eller fortrolige oplysninger i repoet.

## Brug testpanelet (til dig som facilitator)

Åbn siden med `?test=1`. Panelet i hjørnet viser opgaven, og alt gemmes **kun lokalt i browseren**. Der indsamles ingen personoplysninger – brug et anonymt deltager-id (P01, P02 …).

1. Vælg opgave (T1–T4), læs den højt for deltageren, og tryk **Start**. Siden hopper til forsiden.
2. Deltageren løser opgaven og tænker højt. Panelet måler **tid, klik, sider og blindgyder** automatisk.
3. Tryk **Stop**, vælg udfald (Lykkedes / Delvist / Mislykkedes) og **SEQ 1–7** (hvor let var opgaven?), og skriv noter. Tryk **Gem opgave**.
4. Tryk **Næste** ved ny deltager. **Download CSV** giver alle resultater (åbner i Excel). Kolonner: deltager, opgave, gruppe, udfald, seq, sekunder, klik, sider, blindgyder, sorteringer, eksporter, søgninger, note, rutesti, tidspunkt.

Tip: Skjul panelet (pilen) under skærmdeling, og læs selv opgaven højt.

### Testopgaver og forventede svar

| Id | Brugergruppe | Opgave | Forventet svar |
|---|---|---|---|
| T1 | Borger | Find ud af, hvor mange mandater Hørsholm Kommune fik ved Kommunalvalg 2025, og hvilket parti der fik flest. | 19 mandater. Parti C (Konservative) fik flest (6). |
| T2 | Journalist/analytiker | Sammenlign mandatfordelingen i Hørsholm og Ishøj, og hent tallene, så du kan åbne dem i et regneark. | Sammenligningssiden Hørsholm vs. Ishøj og en downloadet fil. |
| T3 | Kommunal medarbejder | Du arbejder i en kommune. Find vejledning til, hvordan resultatet indberettes efter optælling. | Artiklen "Optælling og indberetning". |
| T4 | Borger/analytiker | Find ud af, hvilket parti der fik flest mandater i Ishøj, og om partiet fik flere eller færre end ved valget i 2021. | A (Socialdemokratiet), 9 mandater, ét færre end 2021. |

Forslag til succeskriterier: T1 inden for 30 sekunder uden hjælp; T2 når eksport uden hjælp; T3 inden for 3 klik; T4 inden for 60 sekunder. Brug 3–5 deltagere pr. brugergruppe.

## Hvordan prototypen hænger sammen med opgaven

- **Garrett (struktur/skelet):** forsiden er organiseret efter opgaver, ikke valgtyper. Valgtyperne ligger nederst som sekundær indgang.
- **Yablonski:** Hicks lov (fire tydelige indgange), Jakobs lov (kendte mønstre i søgning), Visual hierarchy og Serial position effect (mandater først og størst), Chunking (sammenlign i tre trin).
- **Houde & Hill:** prototypen tester primært *role* og *look and feel* – om brugeren forstår strukturen og finder frem. *Implementation* er fingeret (eksempeldata).
- **Empiri (interviews):** ønsker om mandater først, størst-til-mindst, samlet eksport og at dele op efter, hvad man kommer for. Brug citater kun efter aftale med KOMBIT (anonymisering).

### Forslag til tekst i metodeafsnittet (5.6 Prototypeudvikling)

> Prototypen er udviklet som en kodet, klikbar webprototype i HTML, CSS og JavaScript og hostet på GitHub Pages, så den kan testes af brugere på egne enheder. Wireframes og informationsarkitektur er udarbejdet i Figma og dokumenterer designbeslutningerne. Prototypen bruger eksempeldata og er et testredskab for informationsarkitekturen, ikke et færdigt produkt. Udviklingen er sket med AI-assistance (Claude) ud fra mine beslutninger om koncept, brugerflows, indhold og teori. Jeg har gennemgået og tilpasset resultatet.

## Ændringer i forhold til Figma-skærmene

- Valget i prototypen er **Kommunalvalg 2025 og 2021** i stedet for Folketingsvalg, fordi mandater gælder pr. kommune ved kommunalvalg (og det er det, Valg-løsningen blev taget i brug til i november 2025). Folketingsvalg er ikke med.
- Sammenligning kan have op til **tre** områder, og der er fire mål.
- Eksport findes i to formater: **Excel** (semikolon, decimalkomma, åbner direkte i dansk Excel) og **CSV (UTF-8)** (komma, decimalpunktum).

## Skift eksempeldata ud med rigtige tal

`js/data.js` er genereret. Strukturen er beskrevet i `tools/generate_data.py`. Du kan enten ændre scriptet og køre `python3 tools/generate_data.py`, eller erstatte `js/data.js` med data i samme format (`window.DATA = {...}`). Ved rigtige tal bør du fjerne "eksempeldata"-teksterne (søg efter "eksempeldata" i `js/app.js` og `index.html`).

## Begrænsninger

- Vejledningstekster, opdateringer og seneste sammenligninger er opdigtede til prototypen.
- Søgning på parti og kandidat er ikke bygget (ender i blindgyde). Det er en bevidst afgrænsning.
- Kun en delmængde af valgtyper er med (se accordion på forsiden).

## Filer

```
index.html            skal + hovednavigation
css/style.css         design (farver som CSS-variabler øverst)
js/app.js             alle skærme, routing, søgeforslag, diagrammer, eksport
js/data.js            eksempeldata (genereret)
js/test-mode.js       testpanel (kun med ?test=1)
tools/generate_data.py  genererer eksempeldata
.nojekyll             så GitHub Pages serverer filerne uændret
```
