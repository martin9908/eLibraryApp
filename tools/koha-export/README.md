# koha-export

Standalone exporters that turn the Aklatan+ Supabase catalog into files the
[Koha ILS](https://koha-community.org/) can import:

- **Patrons** → `patrons.koha.csv` (Koha patron-import CSV, `borrowers` columns)
- **Materials (books)** → `materials.marcxml` (MARCXML for "Stage MARC records for import")

This package reads Supabase directly with the **service-role key** (bypasses RLS),
so run it only in a trusted environment. It does not touch the app.

## Env vars

| Var | Description |
| --- | --- |
| `SUPABASE_URL` | Your Supabase project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (Project Settings → API). **Secret** — never commit. |

## How to run

```bash
cd tools/koha-export
npm install

export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ...service-role..."

npm run export:patrons     # -> patrons.koha.csv
npm run export:materials   # -> materials.marcxml
```

Both scripts log how many rows were written; the patron export also lists any
rows it skipped (e.g. a user with no display name / surname).

## Mapping reference

### Patron CSV columns (exact Koha field names)

| Koha column | Source |
| --- | --- |
| `cardnumber` | `users.id` |
| `surname` | last token of the auth display name |
| `firstname` | remaining tokens of the display name |
| `email` | `auth.users.email` |
| `categorycode` | `users.member_type` via CATEGORY_MAP (null → `PT`) |
| `branchcode` | `users.home_library_id` (blank if null) |
| `dateenrolled` | blank (unknown) |
| `debarred` | today's date when `users.status = 'suspended'`, else blank |

CSV is RFC-4180 quoted (fields containing commas/quotes/newlines are quoted and
embedded quotes doubled).

Category map (edit `CATEGORY_MAP` in `src/exportPatrons.ts`):
`Student→STUDENT`, `Teacher→TEACHER`, `Parent→PARENT`, `Community→COMMUNITY`,
null → `PT`.

### Materials MARC fields

| MARC | Source |
| --- | --- |
| leader | `00000nam a2200000 a 4500` |
| `245 $a` | `books.title` |
| `100 $a` (ind1=1) | `books.author` |
| `650 $a` (ind2=4) | `books.category` |
| `942 $c` | Koha item type (bib level): `ebook→EBOOK`, `physical→BK` |
| `952` (one per copy, `total_copies` copies) | `$a`/`$b` branch, `$y` item type, `$p` barcode `{book.id}-{n}` |

Item type / branch maps (edit constants at the top of `src/exportMaterials.ts`):
- `ITEMTYPE_MAP`: `ebook→EBOOK`, `physical→BK` (default `BK`).
- `BRANCH_MAP`: optional `library_id → Koha branchcode`; unlisted ids pass through
  unchanged. `DEFAULT_BRANCH` (`MAIN`) is used when `library_id` is null.
- `952 $o` (call number) is omitted — no source field exists in the schema.

## Koha pre-import checklist

Create these in Koha **before** importing, or the imports fail on unknown codes:

1. **Item types** (Administration → Item types): create `BK` and `EBOOK`
   (must match `ITEMTYPE_MAP` / `942 $c` / `952 $y`).
2. **Patron categories** (Administration → Patron categories): create
   `STUDENT`, `TEACHER`, `PARENT`, `COMMUNITY`, and the fallback `PT`
   (must match `CATEGORY_MAP`).
3. **Libraries / branches** (Administration → Libraries): create every
   branchcode you emit — `DEFAULT_BRANCH` (`MAIN`), any `BRANCH_MAP` targets,
   and any `home_library_id` / `library_id` values passed through unchanged.

## Importing into Koha

### Patrons (one step)

Tools → Patrons (Patron import) → upload `patrons.koha.csv` → confirm the header
matches → import.

### Bibs + items (two steps)

1. **Stage** — Tools → Stage MARC records for import → upload
   `materials.marcxml` (format: MARCXML). Set record matching if you want to
   dedupe, then stage.
2. **Manage staged → Import** — Tools → Manage staged MARC records → open the
   batch → Import this batch into the catalog. The embedded `952` fields create
   the item/holdings records.
