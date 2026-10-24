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

**Konfiguracja skrzynki — zweryfikowana 2026-10-24, łańcuch INNY niż pierwotnie
ustalono.** Prawdziwa droga maila to **trzy ogniwa, DWA Z NICH RĘCZNE**:

```
LinkedIn/pracuj.pl → AdresTechniczny88@wp.pl
                     → (Asia ręcznie przekazuje z WP) → kobidowola@gmail.com
                     → (Asia ręcznie przekazuje stamtąd) → grzegorz.fijal+asia@gmail.com
```

`kobidowola@gmail.com` to **osobista skrzynka Asi** (potwierdzone przez
użytkownika). Rozpoznaj ten wzorzec po podwójnym prefiksie w temacie — „**Pd:**
Joanna: your job alert..." (wp.pl→kobidowola), potem „**Fwd: Pd:**..."
(kobidowola→alias) — to ślad ręcznego przekazywania w kliencie pocztowym, NIE
automatycznego przekierowania serwerowego (które nie dodaje prefiksów i
zachowuje oryginalny nagłówek nadawcy). Pipeline widzi wyłącznie to, co
wyląduje pod `to:grzegorz.fijal+asia@gmail.com` — nie ma wglądu w `wp.pl` ani
w `kobidowola@gmail.com`, więc nie da się stąd odróżnić "LinkedIn nic nie
wysłał" od "Asia nie przekazała ręcznie".

**Ryzyko tego ustawienia:** ponieważ dwa z trzech ogniw są ręczne, pipeline
**nie jest samonapędzający się** — jeśli Asia nie powtórzy ręcznego
przekazania, dashboard nigdy się nie odświeży, niezależnie od tego, ile
realnych alertów czeka w jej skrzynkach. Cisza od 28 września 2026 (pierwszy i
jedyny ręczny batch) jest w pełni zgodna z tym, że po prostu nie powtórzyła
kroku ręcznego, a nie że coś technicznie padło. **Zalecenie dla użytkownika**:
albo Asia robi to ręcznie cyklicznie (np. raz w tygodniu), albo ustawia
automatyczną regułę przekierowania w Gmailu na `kobidowola@gmail.com`
(Ustawienia → Filtry i zablokowane adresy → nowy filtr od `wp.pl` → Prześlij
dalej na `grzegorz.fijal+asia@gmail.com`), co zamieniłoby ten odcinek na
w pełni automatyczny.

**Do zweryfikowania przed każdym uruchomieniem:** czy `adrestechniczny88@
wp.pl` jest faktycznie adresem, na który LinkedIn/pracuj.pl wysyłają alerty
Joanny (ustawienia powiadomień na jej kontach LinkedIn/pracuj.pl) — samo
przekierowanie niczego nie generuje, tylko relayuje to, co tam wpłynie. Sprawdź
`to:grzegorz.fijal+asia@gmail.com` w Gmailu — jak pierwszy alert przyleci,
pipeline można odpalić.

**Dlaczego wyszukujemy WYŁĄCZNIE po odbiorcy, bez żadnego `from:`:** nadawca
widoczny w nagłówku Gmaila to zawsze `kobidowola@gmail.com` (ostatnie ręczne
ogniwo) — nigdy `adrestechniczny88@wp.pl` ani oryginalny
`jobalerts-noreply@linkedin.com` (te adresy pojawiają się wyłącznie w
zacytowanej treści przekazanej wiadomości, nie w nagłówku `From`, więc operator
`from:` ich nie widzi). Filtrowanie po `from:adrestechniczny88@wp.pl` LUB po
adresach LinkedIn/pracuj.pl **nie zwróci niczego, nawet gdy wszystko działa**
(zweryfikowane 2026-10-24: zero wyników nawet dla znanych, poprawnych wątków z
28 września). Jedyne poprawne zapytanie to:

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
