# Ankieta preferencji — SurveyMonkey

Ankieta dla Joanny budująca precyzyjniejszy fit score (widełki, lokalizacja,
priorytety CORE/AI, portfolio i segmenty mody, wykluczenia, pilność, a także
głębsze pytania o zainteresowania/styl pracy: co daje energię, zarządzanie
ludźmi vs. IC, wielkość firmy, podróże, własna definicja "pracy marzeń",
wymarzone firmy, kierunek rozwoju, priorytety przy wyborze oferty,
strategiczna vs. operacyjna rola) i kończy się otwartym polem "czego
zabrakło" na wypadek, gdyby lista pytań czegoś nie objęła.

Pierwsza strona ankiety to intro wyjaśniające cel: że odpowiedzi są
potrzebne, żeby pipeline mógł skutecznie selekcjonować i dostarczać jej
trafne oferty pracy (zamiast oceniać po ogólnych założeniach).

- **Link do wypełnienia (wyślij Joannie):** https://www.surveymonkey.com/r/FGXXZ58
- `survey_id`: `423745717`
- `intro_page_id` (strona z celem ankiety, bez pytań): `79622977`
- `page_id` (strona z pytaniami 1–29): `79466035`
- `collector_id` (weblink): `441147839`
- Liczba pytań: 29 (ostatnie — "czego zabrakło" — otwarte, do przejrzenia ręcznie)

## Jak odczytać odpowiedzi

Po wypełnieniu przez Joannę, odpowiedzi są trwale zapisane po stronie
SurveyMonkey (nie w tym repo) i odczytywalne przez narzędzia MCP:
- `mcp__SurveyMonkey__get_response_count(survey_id=423745717)` — ile osób
  odpowiedziało
- `mcp__SurveyMonkey__get_response_summary(survey_id=423745717)` — gotowe
  zestawienie z liczbami/procentami dla pytań zamkniętych
- `mcp__SurveyMonkey__get_responses(survey_id=423745717)` — surowe
  odpowiedzi, w tym pełny tekst pytań otwartych (portfolio modowe, "praca
  marzeń" własnymi słowami, wykluczenia firm, itd.)

Po przeczytaniu odpowiedzi zaktualizuj `asia/profile.md` (widełki, priorytety
torów, wykluczenia) i `asia/data/cv_base.md` (telefon/e-mail, jeśli podane).

**Status: wypełniona.** Odpowiedź z 2026-10-15 (1 respondent) przeczytana
2026-10-22 i wbudowana w `profile.md`/`cv_base.md` — patrz commit
`298bfc1` ("Incorporate Joanna's survey answers..."). Kluczowe: ukończony
kurs projektowania odzieży + hobby stylizacja (odblokowuje tor MODA-3b),
widełki elastyczne w dół do 10k dla mody, Kraków/Gdańsk akceptowalne,
wykluczenie AstraZeneca, lista firm priorytetowych (LPP, L'Oréal i inne).

---

# Ankieta feedbacku po pierwszym dashboardzie — SurveyMonkey

Druga, krótsza ankieta (10 pytań) — nie o preferencjach zawodowych, tylko o
samym narzędziu: czy oferty na dashboardzie są trafne, czy segmentacja
🎯/👀 ma sens, czy wygląd/czytelność odpowiada, czy przycisk podglądu CV
działa dobrze i czego mu brakuje (np. Word/PDF), jak często chce dostawać
nowe oferty, ogólna ocena 1–10, i otwarte pole na dalsze uwagi. Pierwsza
strona wyjaśnia cel: zbieramy to, żeby dalej dopracowywać narzędzie.

- **Link do wypełnienia (wyślij Joannie razem z linkiem do dashboardu):**
  https://www.surveymonkey.com/r/DMLC2XB
- `survey_id`: `423871506`
- `intro_page_id`: `79798961`
- `page_id` (strona z 10 pytaniami): `79798959`
- `collector_id` (weblink): `441220458`

Odczyt odpowiedzi: te same wzorce co wyżej, tylko z `survey_id=423871506`
(`get_response_count`, `get_response_summary`, `get_responses`).
