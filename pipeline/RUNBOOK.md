# Codzienny pipeline dopasowania ofert pracy

Ten dokument to instrukcja dla agenta Claude uruchamianego codziennie (przez
scheduled trigger). Wykonuj kroki po kolei. Jeśli coś jest niejasne lub
brakuje danych, zrób najlepszą możliwą ocenę i zanotuj niepewność w
uzasadnieniu — nie przerywaj pipeline'u.

## 0. Kontekst

- Profil kandydata i kryteria dopasowania: `profile.md` w tym repo. Przeczytaj
  go PRZED oceną ofert — kryteria mogą się zmieniać.
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
flagę (🟢/🟡/⚪) zgodnie z opisanym tam formatem.

## 5. Wygeneruj dashboard

Zbuduj `dashboard/index.html` — statyczna strona HTML (bez zależności
zewnętrznych, działa lokalnie i jako Artifact):
- Nagłówek z datą wygenerowania i liczbą nowych ofert przeanalizowanych /
  zakwalifikowanych
- Lista ofert 🟢 top match i 🟡 warto rozważyć, posortowana malejąco po fit
  score, z: tytułem, firmą, lokalizacją, widełkami (lub "brak danych"), fit
  score, uzasadnieniem, linkiem do oferty
- Sekcja archiwum: zwinięta lista wcześniejszych dni (opcjonalnie, jeśli już
  istnieje historia)

Zachowaj też styl/motyw jasny+ciemny (`prefers-color-scheme`), responsywny
layout — to strona, którą użytkownik będzie oglądał na telefonie.

Przy pisaniu HTML/Artifactu skorzystaj ze skilla `artifact-design` (dashboard
to nowy typ treści w tej sesji, więc wczytaj go przed pisaniem znaczników).

## 6. Zaktualizuj ledger

Dopisz nowe oferty do `data/seen_jobs.json` z polami: `id`, `first_seen`
(ISO timestamp), `title`, `company`, `fit_score`, `flag`, `sent: true` (dla
🟢/🟡 trafiających na dashboard) lub `sent: false` (dla ⚪ pominiętych —
nadal zapisz, żeby nie oceniać ich ponownie jutro).

## 7. Opublikuj i wyślij

- Opublikuj/zaktualizuj dashboard jako Artifact (użyj `Artifact` tool,
  `file_path` = `dashboard/index.html`). Jeśli `data/artifact_url.txt` już
  zawiera URL, zaktualizuj TEN SAM artifact (parametr `url`) zamiast tworzyć
  nowy. Jeśli to pierwsze uruchomienie, opublikuj nowy i zapisz zwrócony URL
  do `data/artifact_url.txt`.
- Jeśli są nowe oferty 🟢/🟡, wyślij użytkownikowi powiadomienie push
  (`PushNotification` tool, jeśli dostępne) z krótkim podsumowaniem (liczba
  nowych trafień, najlepszy match) i linkiem do dashboardu.
- Jeśli NIE ma żadnych nowych ofert spełniających próg, nie wysyłaj
  powiadomienia (unikaj spamowania) — ewentualnie zaktualizuj dashboard z
  informacją "brak nowych trafień dzisiaj", ale bez push notification.

## 8. Commit i push

Zacommituj zmiany (`profile.md` NIE powinien się zmienić, chyba że
użytkownik go edytował ręcznie — wtedy zostaw jego zmiany) w
`data/seen_jobs.json`, `dashboard/index.html`, `data/artifact_url.txt`, z
komunikatem w stylu `Daily job matches — YYYY-MM-DD (N nowych ofert)`. Push
na branch `main`.

## Uwagi

- Nigdy nie wysyłaj adresu e-mail użytkownika do zewnętrznych usług.
- Nie loguj się na LinkedIn ani nie przeglądaj automatycznie stron
  ofertowych — to repo celowo opiera się wyłącznie na mailowych alertach,
  żeby nie ryzykować blokady konta LinkedIn ani łamania regulaminów.
- Jeśli wyszukiwanie w Gmailu nie zwróci żadnych maili z alertami, sprawdź w
  podsumowaniu, czy użytkownik na pewno ma aktywne alerty ustawione na
  pracuj.pl i LinkedIn — to jednorazowa rzecz do zweryfikowania, nie błąd
  pipeline'u.
