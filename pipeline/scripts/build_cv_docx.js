// Generates a tailored one-page-ish CV docx from a JSON config.
// Usage: node build_cv_docx.js <input.json> <output.docx>
//
// The JSON must only reorder/select content that already exists in
// data/cv_base.md — this script does not invent anything, it just lays out
// whatever the caller passes in.

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType,
} = require("docx");

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error("Usage: node build_cv_docx.js <input.json> <output.docx>");
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const INK = "1E2A2F";
const SOFT = "55625F";
const ACCENT = "B45A12";
const LINE = "DCDED5";

const heading = (text) =>
  new Paragraph({
    spacing: { before: 260, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE } },
    children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: 20, color: ACCENT, characterSpacing: 20 }),
    ],
  });

const bullet = (text) =>
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, color: INK })],
  });

const roleLine = (title, dates) =>
  new Paragraph({
    spacing: { after: 20 },
    children: [
      new TextRun({ text: title, bold: true, size: 21, color: INK }),
      new TextRun({ text: `   ${dates}`, size: 19, color: SOFT, italics: true }),
    ],
  });

const children = [];

// Header
children.push(
  new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: cfg.candidate, bold: true, size: 40, color: INK, characterSpacing: 10 })],
  }),
  new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: `${cfg.contact.address}  ·  ${cfg.contact.phone}  ·  ${cfg.contact.email}  ·  ${cfg.contact.linkedin}`,
        size: 18, color: SOFT,
      }),
    ],
  }),
);

if (cfg.targetRoleNote) {
  children.push(
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: cfg.targetRoleNote, size: 18, color: ACCENT, italics: true })],
    }),
  );
}

// About
children.push(heading("O mnie"));
children.push(
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: cfg.about, size: 20, color: INK })],
  }),
);

// Skills
children.push(heading("Kluczowe kompetencje"));
for (const s of cfg.skills) children.push(bullet(s));

// Experience
children.push(heading("Doświadczenie zawodowe"));
for (const job of cfg.experience) {
  children.push(
    new Paragraph({
      spacing: { before: 140, after: 20 },
      children: [new TextRun({ text: job.company, bold: true, size: 22, color: INK })],
    }),
  );
  for (const role of job.roles) children.push(roleLine(role.title, role.dates));
  for (const b of job.bullets) children.push(bullet(b));
}

// Education
children.push(heading("Wykształcenie"));
for (const e of cfg.education) children.push(bullet(e));

// Additional
children.push(heading("Dodatkowe umiejętności i języki"));
for (const a of cfg.additional) children.push(bullet(a));

// References
if (cfg.references && cfg.references.length) {
  children.push(heading("Referencje"));
  for (const r of cfg.references) children.push(bullet(r));
}

const doc = new Document({
  sections: [
    {
      properties: { page: { margin: { top: 900, bottom: 900, left: 900, right: 900 } } },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outputPath, buf);
  console.log(`Wrote ${outputPath} (${buf.length} bytes)`);
});
