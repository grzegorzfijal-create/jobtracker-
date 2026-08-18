// Builds the JSON payload embedded in dashboard/index.html for the
// "Dostosuj CV" buttons: for one job, produces a docx (base64) + a plain
// markdown fallback (for viewers where the docx extension isn't enabled).
//
// Usage: node build_cv_payload.js <cv_config.json> <docx_path> <job_id> <slug>
// Prints one JSON object: { [job_id]: { docxFilename, docxBase64, mdFilename, mdText } }

const fs = require("fs");
const [, , cfgPath, docxPath, jobId, slug] = process.argv;
if (!cfgPath || !docxPath || !jobId || !slug) {
  console.error("Usage: node build_cv_payload.js <cv_config.json> <docx_path> <job_id> <slug>");
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const docxBase64 = fs.readFileSync(docxPath).toString("base64");

const lines = [];
lines.push(`# ${cfg.candidate}`);
lines.push(`${cfg.contact.address} · ${cfg.contact.phone} · ${cfg.contact.email} · ${cfg.contact.linkedin}`);
if (cfg.targetRoleNote) lines.push(`\n_${cfg.targetRoleNote}_`);
lines.push(`\n## O mnie\n${cfg.about}`);
lines.push(`\n## Kluczowe kompetencje`);
for (const s of cfg.skills) lines.push(`- ${s}`);
lines.push(`\n## Doświadczenie zawodowe`);
for (const job of cfg.experience) {
  lines.push(`\n**${job.company}**`);
  for (const role of job.roles) lines.push(`${role.title} — ${role.dates}`);
  for (const b of job.bullets) lines.push(`- ${b}`);
}
lines.push(`\n## Wykształcenie`);
for (const e of cfg.education) lines.push(`- ${e}`);
lines.push(`\n## Dodatkowe umiejętności i języki`);
for (const a of cfg.additional) lines.push(`- ${a}`);
if (cfg.references && cfg.references.length) {
  lines.push(`\n## Referencje`);
  for (const r of cfg.references) lines.push(`- ${r}`);
}
const mdText = lines.join("\n");

const payload = {
  [jobId]: {
    docxFilename: `cv_${slug}.docx`,
    docxBase64,
    mdFilename: `cv_${slug}.md`,
    mdText,
  },
};

process.stdout.write(JSON.stringify(payload));
