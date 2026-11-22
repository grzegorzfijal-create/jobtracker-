# Codzienny pipeline dopasowania ofert — Joanna (Asia)

Ten dokument to instrukcja dla agenta Claude uruchamianego na żądanie (na razie
**bez automatyzacji** — patrz "Uwagi"). Wykonuj kroki po kolei. Jeśli coś jest
niejasne lub brakuje danych, zrób najlepszą możliwą ocenę i zanotuj niepewność w
uzasadnieniu — nie przerywaj pipeline'u.

## 0. Kontekst

- Profil kandydatki i kryteria dopasowania: `asia/profile.md` w tym repo.
  Przeczytaj go PRZED oceną ofert. Zawiera definicję **trzech torów kariery**
  (CORE, AI, MODA — z podziałem 3a/3b) i segmentacji w ramach każdego z nich.
- Bazowe CV kandydatki: `asia/data/cv_base.md` — jedyne dopuszczalne źródło
  treści przy generowaniu dostosowanych CV. Zawiera jawną notatkę: **nie dopisuj
  kompetencji projektowych/designerskich** mimo toru MODA — dopóki Joanna sama
  ich tam nie doda.
- Ledger już widzianych ofert: `asia/data/seen_jobs.json`.
- Wygenerowany dashboard z ostatniego uruchomienia: `asia/dashboard/index.html`.
- URL opublikowanego Artifactu: `asia/data/artifact_url.txt`.

## 1. Zbierz surowe oferty z Gmaila

**Konfiguracja skrzynki — NAPRAWIONA 2026-11-22, łańcuch w pełni automatyczny.**
Stary łańcuch (`LinkedIn → AdresTechniczny88@wp.pl → ręczne przekazanie →
kobidowola@gmail.com → ręczne przekazanie → alias`) przestał działać ok.
2 miesiące wcześniej, bo oba ręczne ogniwa wymagały od Asi powtarzania kroku,
czego przestała robić. WP i Onet (oba wypróbowane jako alternatywy) blokują
automatyczne przekierowanie poczty za darmowym kontem — wymagają płatnego planu
("Poczta bez reklam" / "Onet Poczta Plus"). Rozwiązanie: **ominięcie obu
darmowych webmaili w ogóle**, przez zmianę głównego adresu powiadomień w samym
LinkedIn.

Nowy, w pełni automatyczny i darmowy łańcuch:

```
LinkedIn (adres główny: kobidowola@gmail.com)
   → automatyczne przekazywanie Gmaila (natywna, darmowa funkcja)
   → grzegorz.fijal+asia@gmail.com
```

Konfiguracja (2026-11-22):
- W LinkedIn → Ustawienia → Logowanie i zabezpieczenia → Adresy e-mail:
  `kobidowola@gmail.com` jest teraz adresem **głównym (primary)**.
  `joanna_tobiasz@onet.eu` zostaje jako drugi/zapasowy adres. Stary
  `AdresTechniczny88@wp.pl` został usunięty z listy (nie jest już używany).
- Na koncie Gmail `kobidowola@gmail.com` (osobista skrzynka Asi) w
  Ustawienia → Przekazywanie i POP/IMAP włączone jest automatyczne
  przekazywanie całej przychodzącej poczty na `grzegorz.fijal+asia@gmail.com`,
  z zachowaniem kopii w skrzynce `kobidowola` (Asia nadal widzi alerty u
  siebie).
- To przekazywanie jest **natywną funkcją Gmaila** (Gmail→Gmail), więc jest
  w pełni darmowe i nie wymaga żadnego płatnego planu — w przeciwieństwie do
  WP/Onet.

**Ważne:** stare maile z `AdresTechniczny88@wp.pl` (duży zaległy backlog, w
tym m.in. oferta "Projektant/Projektantka odzieży w marce Mohito at LPP S.A."
— trafiona pod MODA-3a) **nie zostaną automatycznie przesłane** — przekazanie
dotyczy wyłącznie nowej poczty od 2026-11-22. Jeśli Asia chce odzyskać coś z
tego backlogu, musi przejrzeć skrzynkę WP ręcznie i przekazać wybrane maile
osobno (jednorazowo).

Nadawca widoczny w nagłówku Gmaila na nowych mailach to teraz
`kobidowola@gmail.com` (tak jak poprzednio) — oryginalny
`jobalerts-noreply@linkedin.com` nadal pojawia się tylko w zacytowanej treści,
nie w nagłówku `From`. Jedyne poprawne zapytanie do wyszukiwania pozostaje bez
zmian:

```
to:grzegorz.fijal+asia@gmail.com
```

Zawsze pełna treść przez `get_message`/`get_thread` z `PLAIN_TEXT`, nigdy nie
ufaj samemu tematowi maila — patrz sekcja 6 dokumentu
`JOB_FINDER_by_GF_architecture_summary.md`.

W Gmailu istnieje etykieta **„Asia - oferty"** (utworzona 2026-09-28) do
ręcznego porządkowania — filtr Gmaila stosujący ją automatycznie na bazie
`to:grzegorz.fijal+asia@gmail.com` konfiguruje użytkownik ręcznie w
Ustawieniach Gmaila (brak narzędzia do tworzenia trwałych filtrów w tej
sesji). Pipeline i tak wyszukuje bezpośrednio przez zapytanie wyżej,
niezależnie od tego, czy etykieta jest ustawiona.

Adresy alertów, które warto założyć na koncie Joanny (na bazie listy stanowisk
uzgodnionej z użytkownikiem — patrz też `profile.md`):
- LinkedIn Job Alerts: po jednym alercie na kilka reprezentatywnych tytułów z
  każdego toru (nie trzeba zakładać alertu na każdy z ~30 tytułów — LinkedIn i
  tak grupuje pokrewne w sekcji "Nowe oferty z innych alertów")
- pracuj.pl: dopasowania po słowach kluczowych z każdego toru

## 2. Wyodrębnij pojedyncze oferty z maili

Jak w głównym RUNBOOK — jeden mail może zawierać wiele ofert z różnych sekcji.

## 3. Deduplikacja

Wczytaj `asia/data/seen_jobs.json`. Pomiń oferty, których `id` już tam jest.

## 4. Oceń dopasowanie i przypisz tor

Dla każdej nowej oferty:
1. Ustal **tor** (CORE / AI / MODA-3a / MODA-3b) na bazie tytułu i opisu —
   patrz listy stanowisk w `profile.md`. Jedna oferta = dokładnie jeden tor
   (jeśli pasuje do kilku list, wybierz tor najbardziej trafny po realnym
   zakresie obowiązków, nie tylko tytule).
2. Zastosuj kryteria danego toru z `profile.md` → fit score 0–100, uzasadnienie,
   segment 🎯/👀/⚪.

## 5. Wygeneruj dashboard

Dashboard `asia/dashboard/index.html` ma **trzy sekcje odpowiadające torom**
(CORE, AI, MODA), każda z własnym wierszem statystyk i własnym sortowaniem
malejąco po fit score w ramach segmentu. W torze MODA rozróżniaj wizualnie 3a
(mostek) od 3b (marzenie) — np. osobny tag/etykieta na karcie.

Reszta zasad jak w głównym RUNBOOK: dokładna data+godzina aktualizacji przy
KAŻDYM uruchomieniu, bez banneru "brak nowych ofert", klikalne linki, kilkuzdaniowe
uzasadnienie na kartę, zwinięte archiwum ⚪ z linkiem i powodem dla każdej pozycji.

### 5a. Przyciski oceny 👍/👎 (feedback od Joanny) — NIE USUWAJ przy regeneracji

Każda karta oferty na dashboardzie ma (od 22 października 2026) blok oceny:
dwa przyciski `.fb-btn[data-dir="up"/"down"]` wewnątrz `.card-actions` (ten sam
`data-job-id` co przycisk CV, `onclick="setVerdict(this)"`) oraz pole na krótką
notatkę `.fb-note` z inputem `oninput="setNote(this)"` tuż pod `.card-actions`,
wewnątrz tego samego `.card`. Przy KAŻDEJ regeneracji dashboardu (nowa runda
pipeline'u) odtwórz dokładnie ten sam znacznik na nowych kartach — wzorzec do
skopiowania jest w istniejącym pliku, szukaj `class="fb-row"` i `class="fb-note"`.

Mechanizm działa **lokalnie w przeglądarce Joanny** (localStorage, klucz
`the-edit-verdicts-v1`) — jej oceny NIE są zapisane w samym pliku HTML/Artifakcie,
więc nadpisanie dashboardu nową wersją nie kasuje jej ocen na jej urządzeniu (nie
trzeba ich "zachowywać" przy regeneracji, w przeciwieństwie do ✅/❌ w głównym
projekcie). Na dole strony jest sekcja "Twoje oceny ofert" z przyciskiem
"Kopiuj moje oceny" — Joanna wysyła ten tekst Grzegorzowi, a on przekazuje go
dalej do agenta, który na tej podstawie aktualizuje `profile.md`/`seen_jobs.json`
(np. dopisuje pole `feedback: "up"/"down"` + notatkę przy odpowiednim wpisie w
ledgerze i koryguje kryteria/priorytety na przyszłość).

## 5b. Przygotuj CV z góry dla każdej oferty na dashboardzie

Jak w głównym pipeline — ale pamiętaj o notatce w `cv_base.md`: dla ofert z toru
MODA-3b (czyste role projektowe) dostosowanie CV **nie może** wymyślać
umiejętności projektowych. Zamiast tego jawnie zaznacz w `targetRoleNote`/
uzasadnieniu, że CV przedstawia transferowalne kompetencje operacyjne/
zarządcze, nie portfolio projektowe.

## 6. Zaktualizuj ledger

Jak w głównym RUNBOOK, plus pole `track` (`core`/`ai`/`moda-3a`/`moda-3b`) przy
każdym wpisie.

## 6b. Aktualność ofert (termin przyjmowania CV)

Pipeline **nie ma dostępu do rzeczywistego terminu składania aplikacji** —
maile-alerty LinkedIn go nie podają, a odwiedzanie strony oferty wprost jest
zabronione (patrz "Uwagi": ryzyko blokady konta). Zamiast zgadywać, stosuj
prostą, jawną politykę:

- Każdy wpis w `data/seen_jobs.json` ma pole `first_seen` (ISO timestamp z
  momentu, kiedy oferta pierwszy raz pojawiła się w mailu). Dashboard pokazuje
  tę datę na karcie jako „zauważona: DD miesiąc RRRR”.
- Oferta, której `first_seen` jest starsze niż **30 dni** względem bieżącego
  uruchomienia, **nie trafia na dashboard** (traktuj ją jako prawdopodobnie
  nieaktualną — LinkedIn/pracuj.pl zwykle zamykają nabór dużo szybciej). Nadal
  zostaje w ledgerze (nie usuwaj wpisu), tylko nie jest renderowana w żadnej
  sekcji (ani 🎯/👀, ani archiwum ⚪) — to nie jest "pominięcie po ocenie", tylko
  wygaśnięcie.
- Jeśli w kolejnym uruchomieniu ta sama oferta (ten sam `id`) pojawi się
  ponownie w nowym mailu-alercie, to jest sygnał, że nadal jest aktywna —
  zaktualizuj `first_seen` na nowszą datę i wpuść ją z powrotem na dashboard
  (tak jakby to była "odnowiona" oferta).
- To przybliżenie, nie pewność — dashboard NIE twierdzi wprost "ta oferta
  nadal przyjmuje CV", tylko pokazuje datę zauważenia, żeby Joanna sama mogła
  ocenić ryzyko, że nabór już się zamknął.

## 7. Opublikuj i wyślij

Jak w głównym RUNBOOK — najpierw odczytaj obecną opublikowaną wersję Artifactu
(zachowaj stan 👍/👎), potem publikuj scalony wynik pod tym samym URL z
`asia/data/artifact_url.txt`. **Uwaga**: na życzenie użytkownika — **zero
powiadomień push** dla tej instancji. Dashboard/Artifact jest jedynym kanałem;
nigdy nie wywołuj `PushNotification` dla tego pipeline'u.

## 8. Commit i push

Commituj w obrębie folderu `asia/` (ten sam branch `main` co główny
`jobtracker-`, ale osobna podprzestrzeń plików — nie dotykaj plików Grzegorza
poza `asia/`).

## Uwagi

- Nigdy nie wysyłaj adresu e-mail Joanny do zewnętrznych usług.
- Nie loguj się na LinkedIn ani nie przeglądaj automatycznie stron ofertowych —
  identycznie jak w głównym projekcie, ta sama motywacja (ryzyko blokady konta).
- **Automat wyłączony** — nie triggeruj pipeline'u samodzielnie, tylko na
  wyraźną prośbę.
- **Zero powiadomień push** — patrz sekcja 7.
