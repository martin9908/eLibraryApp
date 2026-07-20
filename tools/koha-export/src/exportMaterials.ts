// exportMaterials.ts
// Export public.books into a Koha-importable MARCXML collection (one <record>
// per book, one 952 field per copy). Import via Koha's "Stage MARC records for
// import" tool.
//
// Run:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run export:materials
// Output: tools/koha-export/materials.marcxml
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { supabase } from "./supabase.js";

// ── Adjustable constants ─────────────────────────────────────────────────────
// Koha branchcode used when a book has no library_id. Must exist in Koha
// (Administration > Libraries) before import.
const DEFAULT_BRANCH = "MAIN";

// Map Aklatan+ book_type -> Koha item type code (used for 942$c bib-level and
// 952$y item-level). These item types MUST exist in Koha (Administration > Item
// types) before import.
const ITEMTYPE_MAP: Record<string, string> = {
  ebook: "EBOOK",
  physical: "BK",
};
const DEFAULT_ITEMTYPE = "BK";

// Optional: map Aklatan+ library_id -> Koha branchcode. If a library_id is not
// listed here it is passed through unchanged (falling back to DEFAULT_BRANCH
// when null). Adjust to match the branchcodes you create in Koha.
const BRANCH_MAP: Record<string, string> = {
  // "aklatan-library-id": "KOHABRANCH",
};

// Standard MARC leader default for a monograph bibliographic record.
const LEADER = "00000nam a2200000 a 4500";

type Book = {
  id: string;
  title: string;
  author: string;
  type: string;
  category: string;
  total_copies: number;
  library_id: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

// Escape text for use inside XML element content / attribute values.
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function itemtypeFor(type: string): string {
  return ITEMTYPE_MAP[type] ?? DEFAULT_ITEMTYPE;
}

function branchFor(libraryId: string | null): string {
  if (!libraryId) return DEFAULT_BRANCH;
  return BRANCH_MAP[libraryId] ?? libraryId;
}

function subfield(code: string, value: string): string {
  return `      <subfield code="${xmlEscape(code)}">${xmlEscape(value)}</subfield>`;
}

function datafield(
  tag: string,
  ind1: string,
  ind2: string,
  subfields: string[]
): string {
  return [
    `    <datafield tag="${tag}" ind1="${ind1}" ind2="${ind2}">`,
    ...subfields,
    `    </datafield>`,
  ].join("\n");
}

function recordXml(book: Book): string {
  const itemtype = itemtypeFor(book.type);
  const branch = branchFor(book.library_id);
  const fields: string[] = [];

  // 245 — title. ind1=1 (added entry), ind2=0 (no nonfiling chars).
  fields.push(datafield("245", "1", "0", [subfield("a", book.title)]));

  // 100 — main entry / author. ind1=1 (surname first form assumed).
  if (book.author && book.author.trim()) {
    fields.push(datafield("100", "1", " ", [subfield("a", book.author)]));
  }

  // 650 — topical subject (Aklatan+ category). ind2=4 (source not specified).
  if (book.category && book.category.trim()) {
    fields.push(datafield("650", " ", "4", [subfield("a", book.category)]));
  }

  // 942 — Koha bib-level defaults ($c item type).
  fields.push(datafield("942", " ", " ", [subfield("c", itemtype)]));

  // 952 — one Koha holdings/item field per copy.
  const copies = Math.max(0, Number(book.total_copies) || 0);
  for (let n = 1; n <= copies; n += 1) {
    fields.push(
      datafield("952", " ", " ", [
        subfield("a", branch), // homebranch
        subfield("b", branch), // holdingbranch
        subfield("y", itemtype), // itemtype
        subfield("p", `${book.id}-${n}`), // barcode
        // $o (call number) intentionally omitted — no source field available.
      ])
    );
  }

  return [
    "  <record>",
    `    <leader>${LEADER}</leader>`,
    ...fields,
    "  </record>",
  ].join("\n");
}

async function main(): Promise<void> {
  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, author, type, category, total_copies, library_id");
  if (error) throw error;

  const list = (books ?? []) as Book[];
  let totalCopies = 0;
  for (const b of list) totalCopies += Math.max(0, Number(b.total_copies) || 0);

  const body = list.map(recordXml).join("\n");
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<collection xmlns="http://www.loc.gov/MARC21/slim">',
    body,
    "</collection>",
    "",
  ].join("\n");

  const outPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "materials.marcxml"
  );
  writeFileSync(outPath, xml, "utf8");

  console.log(
    `Wrote ${list.length} bib record(s) / ${totalCopies} item copies to ${outPath}`
  );
}

main().catch((err) => {
  console.error("Materials export failed:", err);
  process.exit(1);
});
