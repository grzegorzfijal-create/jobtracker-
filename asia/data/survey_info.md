# Ankieta preferencji — SurveyMonkey

Ankieta dla Joanny budująca precyzyjniejszy fit score (widełki, lokalizacja,
priorytety CORE/AI, portfolio i segmenty mody, wykluczenia, pilność, a także
głębsze pytania o zainteresowania/styl pracy: co daje energię, zarządzanie
ludźmi vs. IC, wielkość firmy, podróże, własna definicja "pracy marzeń",
wymarzone firmy, kierunek rozwoju, priorytety przy wyborze oferty,
strategiczna vs. operacyjna rola).

- **Link do wypełnienia (wyślij Joannie):** https://www.surveymonkey.com/r/FGXXZ58
- `survey_id`: `423745717`
- `page_id` (domyślna strona, wszystkie 28 pytań): `79466035`
- `collector_id` (weblink): `441147839`
- Liczba pytań: 28

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
