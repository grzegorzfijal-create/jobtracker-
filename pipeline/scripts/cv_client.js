/*
 * Generator CV po stronie klienta — DOCX i PDF budowane w przeglądarce
 * z obiektu `cv` (ten sam kształt co pipeline/cv_data/*.json).
 *
 * Powód istnienia: dashboard jest stroną statyczną. Wcześniej pipeline
 * generował DOCX+PDF z góry dla KAŻDEJ oferty i wklejał je jako base64
 * (~124 kB na ofertę). Przy kilkunastu ofertach dawało to ponad 2 MB, w tym
 * pliki dla ofert, których użytkownik nigdy nie otworzy. Teraz w stronie
 * siedzi tylko opis dopasowania (kilka kB) i JEDEN zsubsetowany font, a
 * plik powstaje dopiero po kliknięciu "Pobierz".
 *
 * Działa i w Node (testy), i w przeglądarce — używa wyłącznie standardowego
 * JS i Uint8Array. Font przekazywany jest jako { R: bytes, B: bytes, meta }.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CVGEN = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* narzędzia bajtowe                                                    */
  /* ------------------------------------------------------------------ */

  function utf8(str) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
    return new Uint8Array(Buffer.from(str, "utf8"));
  }

  function latin1(str) {
    const out = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
    return out;
  }

  function concat(chunks) {
    let n = 0;
    for (const c of chunks) n += c.length;
    const out = new Uint8Array(n);
    let o = 0;
    for (const c of chunks) {
      out.set(c, o);
      o += c.length;
    }
    return out;
  }

  const CRC_TABLE = (function () {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = -1;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  }

  function u16(v) {
    return new Uint8Array([v & 0xff, (v >>> 8) & 0xff]);
  }
  function u32(v) {
    return new Uint8Array([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]);
  }

  /* ------------------------------------------------------------------ */
  /* ZIP (tylko metoda "store" — plik i tak powstaje lokalnie)            */
  /* ------------------------------------------------------------------ */

  function zip(files) {
    const locals = [];
    const central = [];
    let offset = 0;

    for (const f of files) {
      const name = utf8(f.name);
      const data = f.bytes;
      const crc = crc32(data);
      const local = concat([
        latin1("PK\x03\x04"),
        u16(20), u16(0x0800), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length),
        u16(name.length), u16(0),
        name, data,
      ]);
      locals.push(local);
      central.push(concat([
        latin1("PK\x01\x02"),
        u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length),
        u16(name.length), u16(0), u16(0), u16(0), u16(0),
        u32(0), u32(offset),
        name,
      ]));
      offset += local.length;
    }

    const cd = concat(central);
    return concat([
      concat(locals),
      cd,
      concat([
        latin1("PK\x05\x06"),
        u16(0), u16(0), u16(files.length), u16(files.length),
        u32(cd.length), u32(offset), u16(0),
      ]),
    ]);
  }

  /* ------------------------------------------------------------------ */
  /* DOCX                                                                 */
  /* ------------------------------------------------------------------ */

  function xmlEsc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }

  function para(text, opts) {
    const o = opts || {};
    const runProps =
      "<w:rPr>" +
      (o.bold ? "<w:b/>" : "") +
      (o.italic ? "<w:i/>" : "") +
      (o.caps ? "<w:caps/>" : "") +
      '<w:color w:val="' + (o.color || "1E2A2F") + '"/>' +
      '<w:sz w:val="' + (o.size || 19) + '"/>' +
      '<w:szCs w:val="' + (o.size || 19) + '"/>' +
      "</w:rPr>";
    const pPr =
      "<w:pPr>" +
      (o.bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : "") +
      '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after == null ? 60 : o.after) + '" w:line="264" w:lineRule="auto"/>' +
      (o.border ? '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="B45A12"/></w:pBdr>' : "") +
      (o.indent ? '<w:ind w:left="' + o.indent + '"/>' : "") +
      "</w:pPr>";
    return (
      "<w:p>" + pPr + "<w:r>" + runProps +
      String(text == null ? "" : text)
        .split("\n")
        .map(function (line, i) {
          return (i ? "<w:br/>" : "") + "<w:t xml:space='preserve'>" + xmlEsc(line) + "</w:t>";
        })
        .join("") +
      "</w:r></w:p>"
    );
  }

  function buildDocx(cv) {
    const P = [];
    P.push(para(cv.candidate, { bold: true, size: 40, after: 20 }));
    P.push(para(
      [cv.contact.address, cv.contact.phone, cv.contact.email, cv.contact.linkedin]
        .filter(Boolean).join("  ·  "),
      { size: 17, color: "55625F", after: cv.targetRoleNote ? 20 : 140 }
    ));
    if (cv.targetRoleNote) {
      P.push(para(cv.targetRoleNote, { italic: true, size: 17, color: "7A3D0C", after: 140 }));
    }

    function section(title) {
      P.push(para(title, {
        bold: true, caps: true, size: 18, color: "7A3D0C",
        before: 180, after: 60, border: true,
      }));
    }

    section("O mnie");
    P.push(para(cv.about, { after: 80 }));

    section("Kluczowe kompetencje");
    cv.skills.forEach(function (s) { P.push(para("•  " + s, { after: 30, indent: 200 })); });

    section("Doświadczenie zawodowe");
    cv.experience.forEach(function (job) {
      P.push(para(job.company, { bold: true, size: 21, before: 120, after: 20 }));
      job.roles.forEach(function (r) {
        P.push(para(r.title + " — " + r.dates, { size: 17, color: "55625F", after: 30 }));
      });
      job.bullets.forEach(function (b) { P.push(para("•  " + b, { after: 30, indent: 200 })); });
    });

    section("Wykształcenie");
    cv.education.forEach(function (e) { P.push(para("•  " + e, { after: 30, indent: 200 })); });

    section("Dodatkowe umiejętności i języki");
    cv.additional.forEach(function (a) { P.push(para("•  " + a, { after: 30, indent: 200 })); });

    if (cv.references && cv.references.length) {
      section("Referencje");
      cv.references.forEach(function (r) { P.push(para("•  " + r, { after: 30, indent: 200 })); });
    }

    const document =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      "<w:body>" + P.join("") +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="708" w:footer="708" w:gutter="0"/>' +
      "</w:sectPr></w:body></w:document>";

    const styles =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      "<w:docDefaults><w:rPrDefault><w:rPr>" +
      '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>' +
      '<w:sz w:val="19"/><w:szCs w:val="19"/>' +
      "</w:rPr></w:rPrDefault></w:docDefaults>" +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
      "</w:styles>";

    const contentTypes =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      "</Types>";

    const rels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      "</Relationships>";

    const docRels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      "</Relationships>";

    return zip([
      { name: "[Content_Types].xml", bytes: utf8(contentTypes) },
      { name: "_rels/.rels", bytes: utf8(rels) },
      { name: "word/document.xml", bytes: utf8(document) },
      { name: "word/_rels/document.xml.rels", bytes: utf8(docRels) },
      { name: "word/styles.xml", bytes: utf8(styles) },
    ]);
  }

  /* ------------------------------------------------------------------ */
  /* PDF — Type0 / Identity-H z osadzonym zsubsetowanym TrueType          */
  /* ------------------------------------------------------------------ */

  const PAGE_W = 595.28, PAGE_H = 841.89, MARGIN = 46, BOTTOM = 46;

  function makeFontCtx(font) {
    // font: { R: Uint8Array, B: Uint8Array, meta: {R:{map,...}, B:{...}} }
    function widthOf(weight, ch, size) {
      const e = font.meta[weight].map[ch.codePointAt(0)];
      return ((e ? e[1] : 500) / 1000) * size;
    }
    function measure(weight, text, size) {
      let w = 0;
      for (const ch of String(text)) w += widthOf(weight, ch, size);
      return w;
    }
    function gidHex(weight, text) {
      let out = "";
      for (const ch of String(text)) {
        const e = font.meta[weight].map[ch.codePointAt(0)];
        const gid = e ? e[0] : 0;
        out += gid.toString(16).padStart(4, "0");
      }
      return out;
    }
    function wrap(weight, text, size, maxW) {
      const words = String(text).split(/\s+/).filter(Boolean);
      const lines = [];
      let cur = "";
      for (const word of words) {
        const test = cur ? cur + " " + word : word;
        if (measure(weight, test, size) <= maxW || !cur) cur = test;
        else { lines.push(cur); cur = word; }
      }
      if (cur) lines.push(cur);
      return lines.length ? lines : [""];
    }
    return { widthOf: widthOf, measure: measure, gidHex: gidHex, wrap: wrap };
  }

  function buildPdf(cv, font) {
    const F = makeFontCtx(font);
    const contentW = PAGE_W - 2 * MARGIN;
    const pages = [];
    let ops = [];
    let y = PAGE_H - MARGIN;

    function newPage() {
      pages.push(ops);
      ops = [];
      y = PAGE_H - MARGIN;
    }
    function need(h) {
      if (y - h < BOTTOM) newPage();
    }
    function text(weight, str, size, color, x) {
      ops.push(
        "BT /F" + (weight === "B" ? "B" : "R") + " " + size + " Tf " +
        color + " rg " +
        (x == null ? MARGIN : x).toFixed(2) + " " + y.toFixed(2) + " Td " +
        "<" + F.gidHex(weight, str) + "> Tj ET"
      );
    }
    function block(weight, str, size, color, lead, indent, gap) {
      const x = MARGIN + (indent || 0);
      const lines = F.wrap(weight, str, size, contentW - (indent || 0));
      for (const line of lines) {
        need(lead);
        y -= lead;
        text(weight, line, size, color, x);
      }
      if (gap) y -= gap;
    }
    function rule() {
      // linia POD linią bazową nagłówka — na +3 przecinałaby litery jak przekreślenie
      const ry = (y - 4).toFixed(2);
      ops.push("0.706 0.353 0.071 RG 0.7 w " + MARGIN + " " + ry +
               " m " + (PAGE_W - MARGIN) + " " + ry + " l S");
    }
    function section(title) {
      need(30);
      y -= 20;
      block("B", title.toUpperCase(), 8.5, "0.478 0.239 0.047", 11, 0, 0);
      rule();
      y -= 5;
    }

    const INK = "0.118 0.165 0.184";
    const SOFT = "0.333 0.384 0.373";
    const ACC = "0.478 0.239 0.047";

    block("B", cv.candidate, 20, INK, 23, 0, 1);
    block("R", [cv.contact.address, cv.contact.phone, cv.contact.email, cv.contact.linkedin]
      .filter(Boolean).join("  ·  "), 8.5, SOFT, 11, 0, 2);
    if (cv.targetRoleNote) block("R", cv.targetRoleNote, 8.5, ACC, 11, 0, 2);

    section("O mnie");
    block("R", cv.about, 9, INK, 12, 0, 2);

    section("Kluczowe kompetencje");
    cv.skills.forEach(function (s) {
      need(12); y -= 12; text("R", "•", 9, ACC, MARGIN);
      y += 12;
      block("R", s, 9, INK, 12, 12, 1);
    });

    section("Doświadczenie zawodowe");
    cv.experience.forEach(function (job) {
      need(26);
      y -= 6;
      block("B", job.company, 11, INK, 14, 0, 0);
      job.roles.forEach(function (r) {
        block("R", r.title + " — " + r.dates, 8.5, SOFT, 11, 0, 0);
      });
      y -= 2;
      job.bullets.forEach(function (b) {
        need(12); y -= 12; text("R", "•", 9, ACC, MARGIN);
        y += 12;
        block("R", b, 9, INK, 12, 12, 1);
      });
    });

    function listSection(title, items) {
      if (!items || !items.length) return;
      section(title);
      items.forEach(function (it) {
        need(12); y -= 12; text("R", "•", 9, ACC, MARGIN);
        y += 12;
        block("R", it, 9, INK, 12, 12, 1);
      });
    }
    listSection("Wykształcenie", cv.education);
    listSection("Dodatkowe umiejętności i języki", cv.additional);
    listSection("Referencje", cv.references);

    pages.push(ops);

    /* --- składanie pliku PDF --- */
    const objs = [];
    function add(body) {
      objs.push(body);
      return objs.length; // numer obiektu (1-based)
    }

    const nPages = pages.length;
    const catalogNo = 1, pagesNo = 2;
    objs.push(null, null); // rezerwacja 1 i 2

    const fontObjs = {};
    ["R", "B"].forEach(function (w) {
      const bytes = font[w];
      const meta = font.meta[w];
      const fileNo = add({ stream: bytes, dict: "/Length1 " + bytes.length });
      const descNo = add(
        "<< /Type /FontDescriptor /FontName /LibSans" + w +
        " /Flags 32 /FontBBox [-543 -303 1300 979] /ItalicAngle 0 /Ascent " + meta.ascent +
        " /Descent " + meta.descent + " /CapHeight 716 /StemV 80 /FontFile2 " + fileNo + " 0 R >>"
      );
      const widths = [];
      const entries = Object.keys(meta.map).map(function (cp) { return meta.map[cp]; })
        .sort(function (a, b) { return a[0] - b[0]; });
      entries.forEach(function (e) { widths.push(e[0] + " [" + e[1] + "]"); });
      const cidNo = add(
        "<< /Type /Font /Subtype /CIDFontType2 /BaseFont /LibSans" + w +
        " /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>" +
        " /FontDescriptor " + descNo + " 0 R /DW 500 /W [" + widths.join(" ") + "]" +
        " /CIDToGIDMap /Identity >>"
      );
      // ToUnicode — bez tego tekst w PDF jest nie do wyszukania ani do
      // odczytania przez ATS-y; renderuje się poprawnie, ale kopiuje jako śmieci.
      const bf = [];
      Object.keys(meta.map).forEach(function (cp) {
        const gid = meta.map[cp][0];
        const code = parseInt(cp, 10);
        let uni;
        if (code > 0xffff) {
          const v = code - 0x10000;
          uni = (0xd800 + (v >> 10)).toString(16).padStart(4, "0") +
                (0xdc00 + (v & 0x3ff)).toString(16).padStart(4, "0");
        } else {
          uni = code.toString(16).padStart(4, "0");
        }
        bf.push("<" + gid.toString(16).padStart(4, "0") + "> <" + uni + ">");
      });
      const cmapChunks = [];
      for (let i = 0; i < bf.length; i += 100) {
        const part = bf.slice(i, i + 100);
        cmapChunks.push(part.length + " beginbfchar\n" + part.join("\n") + "\nendbfchar");
      }
      const cmap =
        "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n" +
        "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n" +
        "/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n" +
        "1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n" +
        cmapChunks.join("\n") +
        "\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend";
      const toUniNo = add({ stream: utf8(cmap), dict: "" });
      fontObjs[w] = add(
        "<< /Type /Font /Subtype /Type0 /BaseFont /LibSans" + w +
        " /Encoding /Identity-H /DescendantFonts [" + cidNo + " 0 R]" +
        " /ToUnicode " + toUniNo + " 0 R >>"
      );
    });

    const pageNos = [];
    pages.forEach(function (pageOps) {
      const content = utf8(pageOps.join("\n"));
      const contentNo = add({ stream: content, dict: "" });
      pageNos.push(add(
        "<< /Type /Page /Parent " + pagesNo + " 0 R /MediaBox [0 0 " +
        PAGE_W + " " + PAGE_H + "] /Resources << /Font << /FR " + fontObjs.R +
        " 0 R /FB " + fontObjs.B + " 0 R >> >> /Contents " + contentNo + " 0 R >>"
      ));
    });

    objs[0] = "<< /Type /Catalog /Pages " + pagesNo + " 0 R >>";
    objs[1] = "<< /Type /Pages /Kids [" +
      pageNos.map(function (n) { return n + " 0 R"; }).join(" ") +
      "] /Count " + nPages + " >>";

    const chunks = [latin1("%PDF-1.7\n%\xE2\xE3\xCF\xD3\n")];
    let pos = chunks[0].length;
    const offsets = [];
    objs.forEach(function (o, i) {
      offsets.push(pos);
      let piece;
      if (o && o.stream) {
        const head = latin1((i + 1) + " 0 obj\n<< " + o.dict + " /Length " + o.stream.length + " >>\nstream\n");
        const tail = latin1("\nendstream\nendobj\n");
        piece = concat([head, o.stream, tail]);
      } else {
        piece = latin1((i + 1) + " 0 obj\n" + o + "\nendobj\n");
      }
      chunks.push(piece);
      pos += piece.length;
    });

    let xref = "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n";
    offsets.forEach(function (off) {
      xref += String(off).padStart(10, "0") + " 00000 n \n";
    });
    xref += "trailer\n<< /Size " + (objs.length + 1) + " /Root " + catalogNo + " 0 R >>\nstartxref\n" + pos + "\n%%EOF\n";
    chunks.push(latin1(xref));

    return concat(chunks);
  }

  function slug(s) {
    return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/ł/g, "l").replace(/Ł/g, "L")
      .replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
  }

  return { buildDocx: buildDocx, buildPdf: buildPdf, slug: slug, _zip: zip };
});
