// exportPatrons.ts
// Export public.users (joined with auth.users email + display name) into a
// Koha patron-import CSV. Header row uses exact Koha `borrowers` column names.
//
// Run:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run export:patrons
// Output: tools/koha-export/patrons.koha.csv
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { supabase } from "./supabase.js";

// ── Adjustable maps ──────────────────────────────────────────────────────────
// Map Aklatan+ member_type -> Koha patron categorycode.
// These categorycodes MUST already exist in Koha (Administration > Patron
// categories) before import, or the import will fail.
const CATEGORY_MAP: Record<string, string> = {
  Student: "STUDENT",
  Teacher: "TEACHER",
  Parent: "PARENT",
  Community: "COMMUNITY",
};
// Fallback categorycode when member_type is null/unknown.
const DEFAULT_CATEGORYCODE = "PT";

// Koha borrowers columns we emit, in order. Header must match Koha field names.
const COLUMNS = [
  "cardnumber",
  "surname",
  "firstname",
  "email",
  "categorycode",
  "branchcode",
  "dateenrolled",
  "debarred",
] as const;

type PublicUser = {
  id: string;
  member_type: string | null;
  home_library_id: string | null;
  status: string;
};

type AuthInfo = { email: string; displayName: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

// Split a display name into { firstname, surname }.
// Rule: last whitespace token = surname; the rest = firstname. If only one
// token, it becomes the surname (Koha requires surname; firstname is optional).
function splitName(displayName: string): { firstname: string; surname: string } {
  const tokens = displayName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { firstname: "", surname: "" };
  if (tokens.length === 1) return { firstname: "", surname: tokens[0] };
  const surname = tokens[tokens.length - 1];
  const firstname = tokens.slice(0, -1).join(" ");
  return { firstname, surname };
}

// RFC-4180 CSV field quoting: quote if the field contains comma, quote, CR or LF;
// escape embedded double quotes by doubling them.
function csvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(fields: string[]): string {
  return fields.map(csvField).join(",");
}

// Today's date as YYYY-MM-DD (used for `debarred` on suspended accounts).
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Page through auth.users and build an id -> { email, displayName } map.
async function loadAuthUsers(): Promise<Map<string, AuthInfo>> {
  const map = new Map<string, AuthInfo>();
  const perPage = 1000;
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const u of users) {
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      const displayName =
        (typeof meta.display_name === "string" && meta.display_name) ||
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        "";
      map.set(u.id, { email: u.email ?? "", displayName });
    }
    if (users.length < perPage) break;
    page += 1;
  }
  return map;
}

async function main(): Promise<void> {
  const authMap = await loadAuthUsers();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, member_type, home_library_id, status");
  if (error) throw error;

  const rows: string[] = [csvRow([...COLUMNS])];
  const skipped: string[] = [];
  let written = 0;

  for (const u of (users ?? []) as PublicUser[]) {
    const auth = authMap.get(u.id);
    const displayName = auth?.displayName ?? "";
    const email = auth?.email ?? "";
    const { firstname, surname } = splitName(displayName);

    if (!surname) {
      skipped.push(
        `  - ${u.id} (no display name / surname available${email ? `, email=${email}` : ""})`
      );
      continue;
    }

    const categorycode = u.member_type
      ? CATEGORY_MAP[u.member_type] ?? DEFAULT_CATEGORYCODE
      : DEFAULT_CATEGORYCODE;

    const record: Record<(typeof COLUMNS)[number], string> = {
      cardnumber: u.id,
      surname,
      firstname,
      email,
      categorycode,
      branchcode: u.home_library_id ?? "",
      dateenrolled: "",
      debarred: u.status === "suspended" ? today() : "",
    };

    rows.push(csvRow(COLUMNS.map((c) => record[c])));
    written += 1;
  }

  const outPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "patrons.koha.csv"
  );
  // Leading BOM helps spreadsheet tools; Koha's CSV parser tolerates it.
  writeFileSync(outPath, rows.join("\r\n") + "\r\n", "utf8");

  console.log(`Wrote ${written} patron row(s) to ${outPath}`);
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} row(s) with no surname:`);
    console.log(skipped.join("\n"));
  }
}

main().catch((err) => {
  console.error("Patron export failed:", err);
  process.exit(1);
});
