// Builds a standalone, print-ready HTML document from a CV config JSON —
// used as the source Playwright renders to PDF (see build_cv_pdf.js).
// Usage: node build_cv_print_html.js <cv_config.json> <output.html>

const fs = require("fs");
const [, , cfgPath, outPath] = process.argv;
if (!cfgPath || !outPath) {
  console.error("Usage: node build_cv_print_html.js <cv_config.json> <output.html>");
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const skills = cfg.skills.map((s) => `<li>${esc(s)}</li>`).join("");
const education = cfg.education.map((e) => `<li>${esc(e)}</li>`).join("");
const additional = cfg.additional.map((a) => `<li>${esc(a)}</li>`).join("");
const references = (cfg.references || []).map((r) => `<li>${esc(r)}</li>`).join("");

const experience = cfg.experience
  .map((job) => {
    const roles = job.roles
      .map((r) => `<div class="role"><span class="role-title">${esc(r.title)}</span><span class="role-dates">${esc(r.dates)}</span></div>`)
      .join("");
    const bullets = job.bullets.map((b) => `<li>${esc(b)}</li>`).join("");
    return `<div class="job"><h3>${esc(job.company)}</h3>${roles}<ul>${bullets}</ul></div>`;
  })
  .join("");

const html = `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>${esc(cfg.candidate)} — CV</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: #1e2a2f; font-size: 10.5pt; line-height: 1.45; margin: 0; }
  h1 { font-size: 22pt; letter-spacing: 0.03em; margin: 0 0 4px; }
  .contact { color: #55625f; font-size: 9pt; margin: 0 0 4px; }
  .note { color: #b45a12; font-size: 9pt; font-style: italic; margin: 0 0 14px; }
  h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.05em; color: #b45a12; border-bottom: 1px solid #dcded5; padding-bottom: 3px; margin: 16px 0 8px; }
  ul { margin: 4px 0 0; padding-left: 16px; }
  li { margin-bottom: 3px; }
  .job { margin-bottom: 10px; }
  .job h3 { font-size: 10.5pt; margin: 10px 0 2px; }
  .role { font-size: 9.5pt; color: #333; margin-bottom: 2px; }
  .role-title { font-weight: 600; }
  .role-dates { color: #55625f; margin-left: 8px; font-style: italic; }
  p.about { margin: 4px 0 0; }
</style>
</head>
<body>
  <h1>${esc(cfg.candidate)}</h1>
  <p class="contact">${esc(cfg.contact.address)} · ${esc(cfg.contact.phone)} · ${esc(cfg.contact.email)} · ${esc(cfg.contact.linkedin)}</p>
  ${cfg.targetRoleNote ? `<p class="note">${esc(cfg.targetRoleNote)}</p>` : ""}

  <h2>O mnie</h2>
  <p class="about">${esc(cfg.about)}</p>

  <h2>Kluczowe kompetencje</h2>
  <ul>${skills}</ul>

  <h2>Doświadczenie zawodowe</h2>
  ${experience}

  <h2>Wykształcenie</h2>
  <ul>${education}</ul>

  <h2>Dodatkowe umiejętności i języki</h2>
  <ul>${additional}</ul>

  ${references ? `<h2>Referencje</h2><ul>${references}</ul>` : ""}
</body>
</html>`;

fs.writeFileSync(outPath, html);
console.log(`Wrote ${outPath}`);
