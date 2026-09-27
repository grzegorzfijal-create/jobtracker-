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

**STATUS: zablokowane do czasu podania adresu e-mail Joanny i skonfigurowania
dostępu Gmail dla tej sesji/konta.** Gdy dostęp będzie gotowy: użyj tych samych
zasad co w głównym `jobtracker-/pipeline/RUNBOOK.md` (wyszukiwanie po nadawcy
`jobalerts-noreply@linkedin.com` / `jobs-noreply@linkedin.com` /
`rekomendacje@wysylka.pracuj.pl` itp., zawsze pełna treść przez `get_message`/
`get_thread` z `PLAIN_TEXT`, nigdy nie ufaj samemu tematowi maila — patrz sekcja
6 dokumentu `JOB_FINDER_by_GF_architecture_summary.md`).

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

## 5b. Przygotuj CV z góry dla każdej oferty na dashboardzie

Jak w głównym pipeline — ale pamiętaj o notatce w `cv_base.md`: dla ofert z toru
MODA-3b (czyste role projektowe) dostosowanie CV **nie może** wymyślać
umiejętności projektowych. Zamiast tego jawnie zaznacz w `targetRoleNote`/
uzasadnieniu, że CV przedstawia transferowalne kompetencje operacyjne/
zarządcze, nie portfolio projektowe.

## 6. Zaktualizuj ledger

Jak w głównym RUNBOOK, plus pole `track` (`core`/`ai`/`moda-3a`/`moda-3b`) przy
każdym wpisie.

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
