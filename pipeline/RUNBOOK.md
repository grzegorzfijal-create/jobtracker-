# Codzienny pipeline dopasowania ofert pracy

Ten dokument to instrukcja dla agenta Claude uruchamianego codziennie (przez
scheduled trigger). Wykonuj kroki po kolei. Jeśli coś jest niejasne lub
brakuje danych, zrób najlepszą możliwą ocenę i zanotuj niepewność w
uzasadnieniu — nie przerywaj pipeline'u.

## 0. Kontekst

- Profil kandydata i kryteria dopasowania: `profile.md` w tym repo. Przeczytaj
  go PRZED oceną ofert — kryteria mogą się zmieniać. Zawiera też definicję
  dwóch segmentów dashboardu (🎯 idealnie dopasowane / 👀 warto rozważyć).
- Bazowe CV kandydata: `data/cv_base.md` — jedyne dopuszczalne źródło treści
  przy generowaniu dostosowanych CV (patrz krok 5b). Nigdy nie dodawaj
  umiejętności/osiągnięć spoza tego pliku.
- Ledger już widzianych ofert: `data/seen_jobs.json` — lista obiektów z polami
  `id` (patrz niżej), `first_seen`, `title`, `company`, `sent` (bool).
- Wygenerowany dashboard z ostatniego uruchomienia: `dashboard/index.html`.
- URL opublikowanego Artifactu (jeśli już istnieje): `data/artifact_url.txt`.

## 1. Zbierz surowe oferty z Gmaila

Użyj narzędzi Gmail (mcp__Gmail__search_threads / get_message) użytkownika
(grzegorz.fijal@gmail.com — używaj tylko do identyfikacji/wyszukiwania, nie
wysyłaj go nigdzie indziej).

Wyszukaj wiadomości z ostatnich ok. 26 godzin (żeby złapać nakładkę, jeśli
poprzedni run się spóźnił) od nadawców alertów:
- pracuj.pl (np. `from:pracuj.pl` lub `from:noreply@pracuj.pl`)
- LinkedIn Job Alerts (np. `from:jobs-noreply@linkedin.com` lub
  `from:linkedin.com "job alert"` / `from:linkedin.com "nowe oferty"`)

Jeśli dokładny adres nadawcy jest nieznany, przeszukaj po słowach kluczowych
(`pracuj.pl oferty`, `linkedin oferty pracy`, `job alert`) i zawęź po domenie
nadawcy w wynikach.

## 2. Wyodrębnij pojedyncze oferty z maili

Każdy mail-alert może zawierać wiele ofert. Dla każdej wyodrębnij:
- tytuł stanowiska
- firma
- lokalizacja (jeśli podana)
- widełki (jeśli podane)
- link do oferty (kanoniczny URL — używaj go jako podstawy do `id`, np. hash
  linku lub sam link)
- krótki opis/fragment, jeśli mail go zawiera

Jeśli link prowadzi tylko do przekierowania trackingowego, zachowaj go mimo
to — służy do deduplikacji i jako link dla użytkownika.

## 3. Deduplikacja

Wczytaj `data/seen_jobs.json`. Pomiń oferty, których `id` już tam jest
(niezależnie od tego, czy zostały wcześniej wysłane, czy odrzucone — nie
oceniaj ich ponownie). Nowe oferty dopisz do ledgera na końcu (patrz krok 6).

## 4. Oceń dopasowanie

Dla każdej NOWEJ (niezdeduplikowanej) oferty zastosuj kryteria z `profile.md`
sekcja "Kryteria dopasowania ofert". Przypisz fit score 0–100, uzasadnienie i
segment (🎯/👀/⚪) zgodnie z sekcją "Format oceny" / "Segmentacja" w tym
pliku — **branża liczy się tak samo mocno jak tytuł stanowiska**: trafny
tytuł w nietrafnej branży (np. Brand Manager poza FMCG-napojami/pharma)
to zwykle 👀, nie 🎯.

## 5. Wygeneruj dashboard

Zbuduj `dashboard/index.html` — statyczna strona HTML (bez zależności
zewnętrznych, działa lokalnie i jako Artifact):
- Nagłówek z datą wygenerowania i liczbą nowych ofert przeanalizowanych /
  zakwalifikowanych
- **Dwie sekcje/segmenty**, każda posortowana malejąco po fit score:
  - 🎯 Idealnie dopasowane
  - 👀 Warto rozważyć
- Dla KAŻDEJ oferty w obu segmentach, bez wyjątku:
  - tytuł, firma, lokalizacja, widełki (lub "brak danych")
  - **fit score czytelnie opisany**, np. "58/100" z podpisem "Fit score" —
    nie sama goła liczba
  - **link do oferty** (klikalny, otwiera się w nowej karcie)
  - **kilkuzdaniowe podsumowanie/uzasadnienie** (co pasuje, co nie, co
    nieznane) — nie skracaj do jednego zdania
  - przycisk **"👁️ Podgląd i dostosowanie CV"** (patrz krok 5b) — otwiera
    NAJPIERW podgląd dostosowanego CV w modalu, a dopiero na dole podglądu
    użytkownik wybiera format do pobrania: **Word (.docx) lub PDF**. Nigdy
    nie pobieraj pliku bezpośrednio z klika na karcie oferty — podgląd jest
    obowiązkowym krokiem pośrednim.
- Sekcja archiwum (zwinięta): lista ofert ⚪ pominiętych tego dnia (fit score
  < 55). Każda pozycja, bez wyjątku, musi mieć **klikalny link do oferty**
  (tytuł jako link) obok krótkiego powodu pominięcia — nie tylko sam tekst.

Zachowaj też styl/motyw jasny+ciemny (`prefers-color-scheme`), responsywny
layout — to strona, którą użytkownik będzie oglądał na telefonie.

Przy pisaniu HTML/Artifactu skorzystaj ze skilla `artifact-design` (dashboard
to nowy typ treści w tej sesji, więc wczytaj go przed pisaniem znaczników).

## 5b. Przygotuj dostosowane CV dla każdej oferty na dashboardzie

Dla KAŻDEJ oferty, która trafia na dashboard (oba segmenty, 🎯 i 👀),
przygotuj dostosowaną wersję CV **z góry** (podczas tego samego uruchomienia
pipeline'u), tak żeby przycisk "Podgląd i dostosowanie CV" w Artifakcie
działał od razu, bez czekania na kolejne uruchomienie (Artifact jest stroną
statyczną — nie ma w niej żywego backendu, więc generowanie "na klik" nie
jest możliwe).

Zasady dostosowania (twarde, nie do złamania):
- Jedyne źródło treści to `data/cv_base.md`. NIE wolno dopisywać nowych
  umiejętności, osiągnięć, narzędzi, lat doświadczenia ani niczego, czego tam
  nie ma — dostosowanie polega WYŁĄCZNIE na: zmianie kolejności punktów,
  wyborze/skróceniu które punkty wyeksponować, przeformułowaniu nagłówka "O
  mnie" pod kątem słownictwa z oferty, i doborze bulletów najbardziej
  relewantnych dla danej roli/branży. Fakty (firmy, daty, liczby, wyniki)
  zostają identyczne jak w `data/cv_base.md`.

Pipeline (użyj skryptów w `pipeline/scripts/`, `npm install` w tym katalogu
jeśli `node_modules/docx` brakuje):
1. Zbuduj JSON konfiguracyjny per oferta (struktura jak w
   `pipeline/cv_data/*.json` — `candidate`, `contact`, `targetRoleNote`,
   `about`, `skills[]`, `experience[]`, `education[]`, `additional[]`,
   `references[]`) wyłącznie z treści `data/cv_base.md`, dobranej pod ofertę.
   Zapisz do `pipeline/cv_data/<job-id-slug>.json`.
2. `node pipeline/scripts/build_cv_docx.js <config.json> <out.docx>` — DOCX
   (skill `docx` jako punkt odniesienia dla jakości, ale generacja idzie
   przez ten skrypt/docx-js).
3. `node pipeline/scripts/build_cv_print_html.js <config.json> <out.html>` →
   `node pipeline/scripts/build_cv_pdf.js <out.html> <out.pdf>` — PDF przez
   Playwright + preinstalowany Chromium (`/opt/pw-browsers/...`). NIE używaj
   LibreOffice/`soffice` do PDF — w tym środowisku sandboxowym jest
   niefunkcjonalne (`source file could not be loaded` nawet na trywialnym
   pliku); Playwright działa niezawodnie.
4. `node pipeline/scripts/build_cv_payload.js <config.json> <out.docx>
   <out.pdf> <job-id> <slug>` — zwraca JSON `{ [job-id]: { cv, docxFilename,
   docxBase64, pdfFilename, pdfBase64, mdFilename, mdText } }`. Pole `cv` to
   ten sam config z kroku 1 — dashboard renderuje z niego podgląd w modalu.
5. Scal payloady wszystkich ofert w jeden obiekt i osadź w
   `dashboard/index.html` w `<script type="application/json" id="cv-data">`.
   NIE wklejaj tego ręcznie do dużego stringa w edytorze (base64 potrafi się
   uciąć) — zamiast tego wstaw placeholder `__CV_DATA_JSON__` w miejscu tego
   scripta i podmień go programowo (np. `python3 -c "..."` czytające plik i
   zapisujące z powrotem), tak jak w istniejącym `dashboard/index.html`.
   Po podmianie ZAWSZE zweryfikuj round-trip: zdekoduj `docxBase64`/
   `pdfBase64` z finalnego pliku i porównaj bajt-w-bajt z oryginalnym
   `.docx`/`.pdf` na dysku.
6. Przycisk na karcie oferty (`onclick="openCvPreview(this)"`) otwiera modal
   z podglądem zbudowanym z pola `cv` (JS renderuje HTML z tokenów CSS
   dashboardu — nie osadzaj osobnego zduplikowanego layoutu). W stopce
   modala dwa przyciski: **"Pobierz Word (.docx)"** i **"Pobierz PDF"**,
   każdy wywołuje `claude.use("downloads")` → `downloads.save({filename,
   data})` po zdekodowaniu odpowiedniego base64 do `Uint8Array`. Zadeklaruj
   `capabilities: {downloads: true}` przy publikacji Artifactu (patrz krok
   7). Jeśli `save()` odrzuci z kodem `extension_not_enabled` (rozszerzenie
   może nie być włączone w danym widoku), fallback na plik `.md` (zwykły
   tekst) z pola `mdText`.
- Jeśli oferta nie ma wystarczająco informacji (brak treści/JD w mailu, tylko
  tytuł+firma), dostosuj mimo to na bazie tego, co wiadomo (tytuł, branża,
  firma) — zaznacz w uzasadnieniu na dashboardzie, że dostosowanie jest
  ogólne, bo mail nie zawierał pełnego opisu stanowiska.
- To krok kosztowny (jeden DOCX + jeden PDF na ofertę) — ale liczba ofert na
  dashboardzie jest z założenia mała (kilka dziennie), więc jest to
  akceptowalne.

## 6. Zaktualizuj ledger

Dopisz nowe oferty do `data/seen_jobs.json` z polami: `id`, `first_seen`
(ISO timestamp), `title`, `company`, `fit_score`, `flag` (🎯/👀/⚪),
`sent: true` (dla 🎯/👀 trafiających na dashboard) lub `sent: false` (dla ⚪
pominiętych — nadal zapisz, żeby nie oceniać ich ponownie jutro).

## 7. Opublikuj i wyślij

- Opublikuj/zaktualizuj dashboard jako Artifact (użyj `Artifact` tool,
  `file_path` = `dashboard/index.html`, `capabilities: {downloads: true}` —
  wymagane dla przycisków "Dostosuj CV", patrz krok 5b). Jeśli
  `data/artifact_url.txt` już zawiera URL, zaktualizuj TEN SAM artifact
  (parametr `url`) zamiast tworzyć nowy — PRZED tym zawsze najpierw
  `WebFetch` obecny URL, żeby nie nadpisać nieodczytanej wersji. Jeśli to
  pierwsze uruchomienie, opublikuj nowy i zapisz zwrócony URL do
  `data/artifact_url.txt`.
- Jeśli są nowe oferty 🎯/👀, wyślij użytkownikowi powiadomienie push
  (`PushNotification` tool, jeśli dostępne) z krótkim podsumowaniem (liczba
  nowych trafień, najlepszy match) i linkiem do dashboardu.
- Jeśli NIE ma żadnych nowych ofert spełniających próg, nie wysyłaj
  powiadomienia (unikaj spamowania) — ewentualnie zaktualizuj dashboard z
  informacją "brak nowych trafień dzisiaj", ale bez push notification.

## 8. Commit i push

Zacommituj zmiany (`profile.md` i `data/cv_base.md` NIE powinny się zmienić,
chyba że użytkownik je edytował ręcznie — wtedy zostaw jego zmiany) w
`data/seen_jobs.json`, `dashboard/index.html`, `data/artifact_url.txt`, z
komunikatem w stylu `Daily job matches — YYYY-MM-DD (N nowych ofert)`. Push
na branch `main`. Nie commituj wygenerowanych plików DOCX/PDF/HTML osobno do
repo (`.gitignore` już wyklucza `*.docx`) — żyją tylko jako base64 wewnątrz
`dashboard/index.html` (Artifact); JSON-y konfiguracyjne w
`pipeline/cv_data/*.json` owszem commituj (to źródło, nie build output).

## Uwagi

- Nigdy nie wysyłaj adresu e-mail użytkownika do zewnętrznych usług.
- Nie loguj się na LinkedIn ani nie przeglądaj automatycznie stron
  ofertowych — to repo celowo opiera się wyłącznie na mailowych alertach,
  żeby nie ryzykować blokady konta LinkedIn ani łamania regulaminów.
- Jeśli wyszukiwanie w Gmailu nie zwróci żadnych maili z alertami, sprawdź w
  podsumowaniu, czy użytkownik na pewno ma aktywne alerty ustawione na
  pracuj.pl i LinkedIn — to jednorazowa rzecz do zweryfikowania, nie błąd
  pipeline'u.
- CV: nigdy nie zmyślaj umiejętności/osiągnięć spoza `data/cv_base.md` — to
  twardy wymóg użytkownika, nie sugestia.
