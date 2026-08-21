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

Użyj narzędzi Gmail (search_threads / get_message) użytkownika
(grzegorz.fijal@gmail.com — używaj tylko do identyfikacji/wyszukiwania, nie
wysyłaj go nigdzie indziej).

Wyszukaj wiadomości z ostatnich ok. 26 godzin (żeby złapać nakładkę, jeśli
poprzedni run się spóźnił). **Skrzynka nie ma jednego źródła ofert — ma
kilka.** Odpytaj wszystkie poniższe kategorie, nie tylko LinkedIn.

### 1a. Potwierdzone, cykliczne źródła alertów

| Źródło | Zapytanie Gmail | Charakterystyka |
|---|---|---|
| LinkedIn Job Alerts | `from:jobalerts-noreply@linkedin.com` | kilka maili dziennie, po 1–30 ofert; główne źródło |
| Michael Page Poland | `from:noreply@mail.michaelpage.pl` | ~2–4 maile/mies., temat „Nowe miejsca pracy dla: Marketing, Agency & Digital : Warsaw”, zwykle 1–3 oferty |
| pracuj.pl | `from:pracuj.pl` | **działa od 21.08.2026** — nadawca `rekomendacje@wysylka.pracuj.pl`, na adres `grzegorz.fijal+pracuj@gmail.com`. Kilka maili dziennie, po 1–15 ofert. Patrz sekcja 1e |

Uwaga na `webfeedback@mail.michaelpage.pl` — to newsletter marketingowy
(raporty Talent Trends itp.), **nie** alert o ofertach. Pomiń.

### 1b. Bezpośrednie odezwy rekruterów (nowa kategoria — traktuj jak ofertę)

Rekruterzy in-house i agencyjni piszą do użytkownika bezpośrednio, z konkretną
rolą w temacie. To pełnoprawne oferty i mają trafiać na dashboard tak samo jak
alerty. Przykłady z historii skrzynki: `izabela.wieclaw@lipcofoods.com`
(„Rekrutacja Brand Manager - Brainer”, LipCo Foods/SuperDrob — realna oferta
FMCG-napojowa), rekruterzy przez `mail.erecruiter.pl`.

Zapytanie przeglądowe:
`newer_than:2d (subject:(rekrutacja OR "oferta pracy" OR "propozycja
współpracy" OR "stanowisko") OR from:erecruiter.pl) -from:linkedin.com`

**Odróżnij ofertę od szumu ATS-owego.** To NIE są nowe oferty i nie wolno ich
wpisywać do ledgera ani na dashboard:
- potwierdzenia złożonej aplikacji („Dziękujemy za złożenie aplikacji…”,
  `mail@stage.erecruiter.pl`, `careers@cchellenic.com`, `noreply.careers@nestle.com`),
- zaproszenia/przypomnienia/zmiany terminu spotkań w toczących się procesach
  (`rekrutacja+<id>@mail.erecruiter.pl` — te wątki dotyczą rekrutacji, w
  których użytkownik JUŻ bierze udział, np. Maspex Marketing Manager, LFI
  Brand Manager),
- odmowy, komunikaty RODO (`system@konto.erecruiter.pl`, Greenhouse),
- newslettery uczelni/branżowe (SWPS, MamStartup).

Kryterium: mail proponuje rolę, o którą użytkownik się jeszcze NIE ubiegał →
oferta. Mail dotyczy istniejącej aplikacji → pomiń.

### 1e. pracuj.pl — jak został odblokowany i o czym pamiętać

**Rozwiązane 21.08.2026.** Historia problemu i lekcja na przyszłość:

- Do 20.08.2026 pracuj.pl **nie przysłał ani jednej oferty** — w skrzynce było
  201 maili z tej domeny, wyłącznie statusy aplikacji (2022), kod weryfikacyjny
  (2024), wiadomość od pracodawcy i ankiety. Ostatni mail jakiegokolwiek typu:
  18.03.2026.
- Maile z domeny **docierały normalnie do INBOX** (nie do spamu), więc to nigdy
  nie był problem z dostarczalnością ani z filtrem Gmaila.
- Serwis **generował rekomendacje, ale dostarczał je wyłącznie jako
  powiadomienia w dzwonku**, mimo włączonych zgód mailowych. Jedno takie
  powiadomienie wisiało nieruszone ~3 tygodnie.
- **Co zadziałało:** zmiana adresu konta na alias plusowy
  `grzegorz.fijal+pracuj@gmail.com` (Konto → Zmień e-mail → link aktywacyjny).
  Pierwsze maile z ofertami przyszły **w ciągu kilkunastu godzin**. Wniosek:
  stary adres był najpewniej na liście wstrzymanych po stronie ich dostawcy
  maili masowych — kanał transakcyjny (kody, weryfikacje) działał cały czas,
  masowy nie.
- Jeśli pracuj.pl kiedyś znowu zamilknie na kilka dni mimo włączonych zgód,
  **najpierw sprawdź ten sam trop** (alias plusowy / zmiana adresu), zanim
  zaczniesz diagnozować cokolwiek innego.

**Format maili.** Nadawca `rekomendacje@wysylka.pracuj.pl`, kilka wysyłek
dziennie o różnych profilach („Polecamy na dziś" z kilkunastoma ofertami,
„Rekrutacja jeszcze trwa", „last minute", pojedyncze oferty). **Mocno się
nakładają** — ta sama oferta wraca w 2–3 mailach tego samego dnia, więc
deduplikuj po `id` oferty, nie po mailu.

Linki są kanoniczne i zawierają id:
`https://pracuj.pl/praca/<slug>,oferta,<id>?sendid=...` — obetnij query string
i użyj `pracuj:<id>` jako `id` w ledgerze. Widełki, jeśli są, stoją w osobnej
linijce nad nazwą firmy — **wyciągaj je zawsze**, bo próg 25 000 zł brutto
z `profile.md` realnie odsiewa dużą część tych ofert.

**Uwaga na poziom stanowiska.** Rekomendacje pracuj.pl sypią głównie rolami
„Specjalista", „Koordynator", „Młodszy" — to twardy dealbreaker z `profile.md`
i zwykle 60–80% każdej wysyłki. Nie podbijaj ich score'a tylko dlatego, że
branża pasuje.

Szum z tej samej domeny, **zawsze do pominięcia**:
`noreply@aplikacje.pracuj.pl` i `account-noreply@aplikacje.pracuj.pl` (statusy
aplikacji, powitania), `no-reply@wysylka.pracuj.pl` (ankiety),
`noreply@konto.pracuj.pl` (kody, sprawy konta), `pomoc@pracuj.zendesk.com`
(zgłoszenia do supportu).

**pracuj.pl jest nieosiągalny z tego środowiska** — polityka sieciowa odrzuca
CONNECT z 403 (tak samo jak gowork.pl). Nie próbuj pobierać ofert bezpośrednio
ze strony; wszystko, czego potrzebujesz, jest w treści maila.

### 1c. Zwiad na nowe źródła (raz na uruchomienie, tanio)

Portale pracy (Jooble, Indeed, Glassdoor, NoFluffJobs, JustJoin, RocketJobs,
praca.pl, OLX Praca, Hays, Antal, Randstad, Grafton, Manpower, Adecco,
Devire, Goldman Recruitment, HRK, Bigram) zostały sprawdzone 20.08.2026 —
**żaden nie przysyła alertów o ofertach** (są tylko regulaminy i polityki
prywatności). Nie odpytuj ich pojedynczo co dzień. Zamiast tego raz na
uruchomienie puść jedno szerokie zapytanie kontrolne:

`newer_than:2d ("oferty pracy" OR "job alert" OR "nowe oferty" OR "miejsca
pracy") -from:linkedin.com -from:michaelpage.pl`

Jeśli wypadnie z niego nowy, powtarzalny nadawca-alert — dopisz go do tabeli
w 1a w tym pliku (to część uruchomienia, nie osobne zadanie).

### 1d. KRYTYCZNE — nie oceniaj maila po temacie ani po `snippet`

Maile LinkedIn z tematem „Twój alert o ofertach pracy: X został utworzony”
WYGLĄDAJĄ jak samo potwierdzenie założenia alertu, a `snippet` (skrót
widoczny w liście wyników wyszukiwania) jest generyczny („Zobacz najnowsze
dopasowania…") i NIE mówi nic o zawartości. W praktyce te maile **regularnie
zawierają kilka(-naście) realnych ofert pracy w treści**, tuż pod linijką
potwierdzenia — dokładnie w tym samym formacie co „zwykłe" maile z
dopasowaniami. Dlatego dla KAŻDEGO maila z każdego źródła (niezależnie od
tematu) ZAWSZE pobierz pełną treść przez `get_message` z
`messageFormat: PLAIN_TEXT` i sprawdź, czy w środku są wpisy
firma/stanowisko/link. Ten błąd (pomijanie całych maili na podstawie
tematu/snippetu) już raz spowodował utratę realnych, dobrze pasujących ofert
(np. Senior Director Marketing w Coca-Coli) — nie powtarzaj go.

Dotyczy to też maili Michael Page: temat jest zawsze identyczny
(„Nowe miejsca pracy dla: Marketing, Agency & Digital : Warsaw"), więc po
temacie NIE da się odróżnić maila z 1 ofertą od maila z 3 — zawsze otwieraj
treść.

## 1.5. Odczytaj oceny użytkownika z dashboardu (przed oceną nowych ofert)

Każda karta na dashboardzie ma sekcję feedbacku w regionie
`<div class="fb" artifact-sync>`. Kliknięcia użytkownika (👍/👎 i powody)
zapisują się w opublikowanym Artifakcie i **wracają do Ciebie** — to jedyny
kanał, którym użytkownik uczy pipeline swoich preferencji.

**Odczyt:** `WebFetch` na URL z `data/artifact_url.txt`. Dla każdej karty:
- głos: `.fb-v[aria-pressed="true"]` → `data-v` = `up` albo `down`
- powody: `.fb-why[data-for="<głos>"] .fb-r[aria-pressed="true"]` → `data-r`
  (`branza`, `poziom`, `rola`, `widelki`, `lokalizacja`, `firma`)

Powody powtarzają się w obu wierszach (👍 i 👎), więc **zawsze czytaj je
z wiersza pasującego do głosu** — inaczej pomylisz „branża pasuje" z „nie ta
branża".

**Zapis:** dopisz nowe oceny do `data/feedback_log.json` (`id`, `vote`,
`reasons[]`, `title`, `company`, `fit_score`, `ts`). Nie nadpisuj historii —
wartość tego pliku rośnie z czasem.

**Zastosowanie — to jest sedno.** Pojedyncza ocena to szum; **wzorzec to
sygnał**. Po dopisaniu nowych ocen przejrzyj cały log i szukaj powtórzeń:

- 2+ razy 👎 z powodem `branza` w tej samej branży → ta branża wypada
  z akceptowalnych. Zaktualizuj sekcję „Branża" w `profile.md` i **napisz
  użytkownikowi, co zmieniłeś** — to jego kryteria, nie Twoje.
- 2+ razy 👎 `poziom` przy podobnym seniority → dociągnij próg w dół lub
  w górę w sekcji „Dealbreakery".
- 2+ razy 👎 `widelki` przy ofertach powyżej progu → próg jest za niski.
- 👍 `branza` w branży dziś opisanej jako „rozważyć" → awansuj ją.
- 👎 przy ofercie z wysokim fit score → Twoje wagi są złe dla tego wymiaru;
  opisz to w uzasadnieniu przy następnej podobnej ofercie.

Powody mapują się 1:1 na wymiary fit score, więc log jest jednocześnie
materiałem na „suwaki" (wagi wymiarów), o które prosił użytkownik.

**Nie zmieniaj `profile.md` na podstawie jednej oceny** i nigdy nie zmieniaj
go po cichu — każda zmiana kryteriów ma trafić do podsumowania dla
użytkownika.

## 2. Wyodrębnij pojedyncze oferty z maili

Każdy mail-alert może zawierać wiele ofert. Dla każdej wyodrębnij:
- tytuł stanowiska
- firma
- lokalizacja (jeśli podana)
- widełki (jeśli podane)
- link do oferty (kanoniczny URL — używaj go jako podstawy do `id`, np. hash
  linku lub sam link)
- krótki opis/fragment, jeśli mail go zawiera

- **źródło** (`source`): `linkedin`, `michaelpage`, `pracuj`, `recruiter`

Schemat `id` zależy od źródła:
- LinkedIn: `linkedin:<id z /jobs/view/<id>/>`
- Michael Page: `michaelpage:<slug-tytułu>` (link to URL trackingowy
  `click.em.page.com`, który nie zawiera stabilnego id oferty — użyj
  slugu tytułu, np. `michaelpage:event-marketing-specialist`)
- pracuj.pl: `pracuj:<id oferty z URL-a>`
- bezpośrednia odezwa rekrutera: `recruiter:<firma>-<slug-tytułu>`

Jeśli link prowadzi tylko do przekierowania trackingowego, zachowaj go mimo
to — służy jako link dla użytkownika. Do deduplikacji użyj wtedy `id`
zbudowanego z tytułu, nie z linku (linki trackingowe zmieniają się przy
każdym mailu).

**Deduplikacja między źródłami i między postami:** ta sama oferta potrafi
przyjść z dwóch źródeł (LinkedIn + Michael Page) albo z LinkedIna dwa razy
pod różnymi id (pracodawca repostuje — np. „Marketing Manager - DENZA Brand",
BYD Polska pojawił się jako `4455284646` i `4456155474`). Dlatego oprócz
porównania `id` sprawdź też, czy w ledgerze nie ma już wpisu o **tym samym
tytule i tej samej firmie** — jeśli jest, pomiń ofertę.

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
- Nagłówek z **dokładną datą I godziną wygenerowania** (czas polski,
  format np. "19 sierpnia 2026, 07:06") — nie sama data. To pole ma się
  zmieniać przy KAŻDYM uruchomieniu (nawet jeśli 0 nowych ofert), żeby
  użytkownik widział, że pipeline faktycznie odpalił się o danej porze —
  oraz liczbą nowych ofert przeanalizowanych / zakwalifikowanych
- **Bez baneru/ostrzeżenia typu "Dziś brak nowych ofert" czy podobnego
  komunikatu tekstowego o stanie dnia.** Data/godzina aktualizacji + wiersz
  statystyk (Idealnie dopasowane / Warto rozważyć / Przeanalizowane) w
  zupełności wystarczają jako sygnał, że pipeline odpalił się i co znalazł —
  nie dodawaj żadnego dodatkowego tekstu-notki nad segmentami.
- **Dwie sekcje/segmenty**, każda posortowana malejąco po fit score:
  - 🎯 Idealnie dopasowane
  - 👀 Warto rozważyć
- Dla KAŻDEJ oferty w obu segmentach, bez wyjątku:
  - tytuł, firma, lokalizacja, widełki (lub "brak danych")
  - **fit score czytelnie opisany**, np. "58/100" z podpisem "Fit score" —
    nie sama goła liczba
  - **link do oferty** (klikalny, otwiera się w nowej karcie)
  - **znacznik źródła** w wierszu tagów (np. „🔗 LinkedIn", „🔗 Michael Page",
    „🔗 rekruter bezpośrednio") — użytkownik ma widzieć, z którego kanału
    przyszła oferta
  - **maksymalnie 3 punkty** w `<ul class="reason">` — nie proza. Każdy
    punkt wiąże konkret z oferty z konkretem z CV kandydata i ma się mieścić
    w jednej linijce (do ~65 znaków). Klasy nadają znacznik i kolor:
    `r-y` (✓ pasuje), `r-n` (✗ nie pasuje), `r-q` (? nieznane). Dobry punkt
    to „Napoje FMCG — dokładnie Twoja kategoria (OSHEE, XL Energy)", zły to
    „Firma działa w branży napojowej" — bez odniesienia do CV punkt nie
    odpowiada na pytanie, dlaczego ta oferta jest przed użytkownikiem.
    Kolejność: najpierw to, co pasuje, na końcu zastrzeżenie
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

## 5b. Przygotuj dopasowanie CV dla ofert na dashboardzie

**Nie generuj plików DOCX/PDF w pipelinie.** Do 21.08.2026 pipeline budował
oba pliki z góry dla KAŻDEJ oferty i wklejał je jako base64 (~124 kB na
ofertę). Przy 17 ofertach dashboard ważył 2,4 MB, w tym pliki dla ofert,
których użytkownik nigdy nie otworzy. Teraz strona nosi tylko **opis
dopasowania** (kilka kB na ofertę) i **jeden zsubsetowany font**, a plik
powstaje w przeglądarce dopiero po kliknięciu — dashboard schudł do ~280 kB.

Dla KAŻDEJ oferty trafiającej na dashboard (🎯 i 👀) przygotuj wyłącznie
**JSON dopasowania** — strukturę jak w `pipeline/cv_data/*.json`
(`candidate`, `contact`, `targetRoleNote`, `about`, `skills[]`,
`experience[]`, `education[]`, `additional[]`, `references[]`), zbudowaną
wyłącznie z treści `data/cv_base.md`, dobranej pod tę ofertę. Zapisz do
`pipeline/cv_data/<job-id-slug>.json` i wstaw do
`<script type="application/json" id="cv-data">` jako `{ "<job-id>": { "cv": {...} } }`.

Zasady dopasowania (twarde, nie do złamania):
- Jedyne źródło treści to `data/cv_base.md`. NIE wolno dopisywać nowych
  umiejętności, osiągnięć, narzędzi, lat doświadczenia ani niczego, czego tam
  nie ma — dopasowanie polega WYŁĄCZNIE na: zmianie kolejności punktów,
  wyborze które punkty wyeksponować, przeformułowaniu nagłówka „O mnie" pod
  kątem słownictwa z oferty, i doborze bulletów najbardziej relewantnych dla
  danej roli/branży. Fakty (firmy, daty, liczby, wyniki) zostają identyczne.
- **Zweryfikuj to programowo przed publikacją.** Znormalizuj `cv_base.md` i
  każdy bullet/skill/firmę/datę z JSON-a, po czym sprawdź, że każde słowo
  dłuższe niż 3 znaki występuje w bazie. W polu `about` dopuszczalne są
  wyłącznie słowa-łączniki (`built`, `combined`, `where`…) — jakiekolwiek
  nowe rzeczowniki branżowe to błąd do poprawienia, nie do zignorowania.

Generowanie plików: `pipeline/scripts/cv_client.js` (wstawiony do strony
inline) eksportuje `CVGEN.buildDocx(cv)` i `CVGEN.buildPdf(cv, font)`,
zwracające `Uint8Array`. Font to zsubsetowany Liberation Sans (Regular +
Bold) w blokach `#font-r`, `#font-b`, `#font-meta`, ładowany leniwie dopiero
przy pierwszym pobraniu PDF-a. Subsetting odtworzysz przez `fontTools`
(`pip install fonttools`) z `/usr/share/fonts/truetype/liberation/` —
~29 kB na krój przy ~130 znakach (ASCII + polskie + typografia).

Przycisk na karcie to **„🧬 Wygeneruj CV"** (`onclick="openCvPreview(this)"`).
Otwiera modal z podglądem renderowanym z pola `cv` — to sam DOM, bez plików,
więc jest natychmiastowy. Dopiero przyciski w stopce modala
(**„Pobierz Word (.docx)"** / **„Pobierz PDF"**) budują bajty i wołają
`claude.use("downloads")` → `downloads.save({filename, data})`. Zadeklaruj
`capabilities: {downloads: true}` przy publikacji (krok 7).

**PDF musi mieć mapę `ToUnicode`.** Bez niej tekst renderuje się poprawnie,
ale kopiuje się jako śmieci i jest nieczytelny dla systemów ATS — czyli CV
przechodzi przez człowieka, a wykłada się na filtrze. Po zmianach w
generatorze zweryfikuj to: wygeneruj PDF i sprawdź `pdftotext`, czy wracają
polskie znaki (`Grzegorz Fijał`, `Żabka`, `DOŚWIADCZENIE ZAWODOWE`).

Jeśli oferta nie ma wystarczająco informacji (brak JD w mailu, tylko
tytuł+firma), dopasuj mimo to na bazie tego, co wiadomo — i zaznacz
w uzasadnieniu na dashboardzie, że dopasowanie jest ogólne.

## 6. Zaktualizuj ledger

Dopisz nowe oferty do `data/seen_jobs.json` z polami: `id`, `first_seen`
(ISO timestamp), `title`, `company`, `source` (`linkedin` / `michaelpage` /
`pracuj` / `recruiter`), `fit_score`, `flag` (🎯/👀/⚪),
`sent: true` (dla 🎯/👀 trafiających na dashboard) lub `sent: false` (dla ⚪
pominiętych — nadal zapisz, żeby nie oceniać ich ponownie jutro).

## 7. Opublikuj i wyślij

- **UWAGA: publikacja nadpisuje HTML, więc może skasować oceny.** Zanim
  opublikujesz, przenieś odczytane w kroku 1.5 głosy do nowego HTML-a: dla
  ofert, które zostają na dashboardzie, ustaw w źródle
  `aria-pressed="true"` na odpowiednim `.fb-v` i na wybranych `.fb-r`, oraz
  zdejmij `hidden` z właściwego `.fb-why`. Bez tego użytkownik zobaczy swoje
  oceny wyczyszczone i przestanie ufać temu mechanizmowi. Oceny ofert, które
  wypadły z dashboardu, i tak zostają w `data/feedback_log.json`.
- Opublikuj/zaktualizuj dashboard jako Artifact (użyj `Artifact` tool,
  `file_path` = `dashboard/index.html`,
  `capabilities: {artifact: {}, downloads: true}` — `artifact` jest wymagane,
  żeby oceny 👍/👎 w ogóle się zapisywały, `downloads` —
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
