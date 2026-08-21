# Wybierz Swoją Robotę by GF

Codzienne narzędzie, które selekcjonuje oferty pracy dla Grzegorza Fijała
(Brand/Marketing Manager, FMCG — najchętniej napoje) na podstawie wszystkich
maili z ofertami, jakie trafiają do jego skrzynki.

**Dashboard (na żywo):** https://claude.ai/code/artifact/79715365-4b31-405f-b1cb-7973626ac460

## Jak to działa

1. Ty ustawiasz szerokie alerty mailowe o nowych ofertach pracy (im szerzej,
   tym lepiej — selekcję robi pipeline, nie filtr portalu). Pipeline czyta
   dziś cztery kanały:
   - **LinkedIn Job Alerts** — główne źródło, kilka maili dziennie,
   - **pracuj.pl** — rekomendacje z `rekomendacje@wysylka.pracuj.pl`, kilka
     wysyłek dziennie po 1–15 ofert (mocno się nakładają — pipeline
     deduplikuje po id oferty),
   - **Michael Page Poland** — „Nowe miejsca pracy dla: Marketing, Agency &
     Digital : Warsaw", ~2–4 maile miesięcznie,
   - **bezpośrednie odezwy rekruterów** (in-house i agencyjne, m.in. przez
     erecruiter.pl) — konkretna rola zaproponowana Tobie mailem liczy się tak
     samo jak oferta z alertu; potwierdzenia aplikacji i ustalanie terminów
     spotkań w trwających procesach są odfiltrowane.

   **pracuj.pl** długo nie przysyłał niczego mimo włączonych zgód —
   odblokowała to dopiero zmiana adresu konta na alias `+pracuj`. Od
   21.08.2026 sypie kilka wysyłek dziennie z `rekomendacje@wysylka.pracuj.pl`.
   Szczegóły i lekcja na przyszłość: sekcja 1e w RUNBOOK-u.

   Lista źródeł jest odświeżana przy każdym uruchomieniu: pipeline puszcza
   jedno szerokie zapytanie kontrolne po nowych nadawcach-alertach i dopisuje
   znalezione do [`pipeline/RUNBOOK.md`](./pipeline/RUNBOOK.md).
2. Codziennie o zaplanowanej porze uruchamia się agent Claude, który:
   - czyta nowe maile z alertami z Twojej skrzynki Gmail,
   - wyciąga z nich pojedyncze oferty,
   - ocenia każdą względem kryteriów w [`profile.md`](./profile.md),
   - przygotowuje opis dopasowania CV (na bazie [`data/cv_base.md`](./data/cv_base.md)) dla każdej oferty widocznej na dashboardzie,
   - aktualizuje dashboard (ten sam link co wyżej) o nowe trafienia,
   - wysyła Ci powiadomienie push, jeśli są nowe dobre dopasowania.

Na dashboardzie każda oferta ma przycisk **"🧬 Wygeneruj CV"** — otwiera
podgląd CV dopasowanego do tej konkretnej oferty, a Ty wybierasz format do
pobrania (Word lub PDF). **Plik powstaje dopiero po kliknięciu, w Twojej
przeglądarce** — w stronie nie ma gotowych dokumentów dla ofert, których nie
otworzysz. Dzięki temu dashboard waży ~280 kB zamiast 2,4 MB, a koszt nie
rośnie z liczbą ofert. CV nigdy nie zawiera zmyślonych umiejętności — tylko
inny dobór i kolejność tego, co już jest w `data/cv_base.md`.

Pełna instrukcja dla agenta: [`pipeline/RUNBOOK.md`](./pipeline/RUNBOOK.md).

## Dlaczego nie scraping

LinkedIn aktywnie wykrywa i blokuje automatyczne przeglądanie/scraping, co
ryzykuje zawieszeniem prawdziwego konta. Pracuj.pl nie ma publicznego API.
Alerty mailowe są legalne, stabilne i nie wymagają utrzymania scraperów przy
każdej zmianie HTML-a portalu.

## Struktura repo

```
profile.md               — profil kandydata + kryteria dopasowania (edytuj wg potrzeb)
data/cv_base.md          — bazowe CV, jedyne źródło treści dla dostosowanych CV
pipeline/RUNBOOK.md      — instrukcja krok po kroku dla codziennego agenta
pipeline/scripts/        — cv_client.js: generator DOCX/PDF działający w przeglądarce
dashboard/index.html     — aktualny dashboard (nadpisywany co dzień)
data/seen_jobs.json      — ledger już ocenionych ofert (deduplikacja)
data/artifact_url.txt    — URL opublikowanego dashboardu (stały link)
```

## Zmiana kryteriów

Edytuj [`profile.md`](./profile.md) — sekcja "Kryteria dopasowania ofert".
Zmiany zostaną uwzględnione od następnego uruchomienia pipeline'u.
