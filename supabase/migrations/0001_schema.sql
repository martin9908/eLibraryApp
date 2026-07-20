-- Aklatan+ schema — relational port of the 7 Firestore collections.
-- Source shapes: packages/types/src/index.ts. Firebase -> Supabase migration.
--
-- ID strategy:
--   * users.id is the Supabase auth.users UUID (1:1 profile row).
--   * All other tables keep TEXT ids so existing Firestore document ids
--     (and derived values like ebook_storage_path / barcodes) survive the
--     data migration (Step 8) unchanged.

-- ── Enums (mirror the union types) ───────────────────────────────────────────
create type book_type            as enum ('ebook', 'physical');
create type member_type          as enum ('Student', 'Teacher', 'Parent', 'Community');
create type user_role            as enum ('patron', 'librarian', 'admin');
create type account_status       as enum ('active', 'suspended');
create type notification_category as enum ('availability', 'dueReminder', 'returnConfirm', 'general');

-- ── libraries (branches) ─────────────────────────────────────────────────────
create table public.libraries (
    id       text primary key,
    name     text not null,
    region   text not null,
    hours    jsonb,          -- { open, close, days }
    contact  text
);

-- ── users (profile; id = auth.users.id) ──────────────────────────────────────
create table public.users (
    id                   uuid primary key references auth.users (id) on delete cascade,
    home_library_id      text references public.libraries (id) on delete set null,
    member_type          member_type,
    role                 user_role      not null default 'patron',
    status               account_status not null default 'active',
    assigned_library_ids text[]         not null default '{}',  -- librarian scope
    assigned_region      text,                                  -- librarian scope
    expo_push_token      text,
    updated_at           timestamptz    not null default now()
);

-- ── books (catalog / "Materials") ────────────────────────────────────────────
create table public.books (
    id                text primary key,
    title             text      not null,
    author            text      not null,
    type              book_type not null,
    category          text      not null,
    available_copies  int       not null default 0 check (available_copies >= 0),
    total_copies      int       not null default 0 check (total_copies >= 0),
    ebook_url         text,     -- legacy public/Drive URL (un-migrated titles)
    ebook_storage_path text,    -- Storage object path for gated titles
    cover_image       text,
    featured          boolean   not null default false,
    library_id        text references public.libraries (id) on delete set null,
    region            text,     -- denormalized for scope checks
    created_at        timestamptz not null default now(),
    check (available_copies <= total_copies)
);

-- ── borrow_records (loans) ───────────────────────────────────────────────────
create table public.borrow_records (
    id          text primary key,
    user_id     uuid      not null references public.users (id) on delete cascade,
    book_id     text      not null references public.books (id) on delete cascade,
    type        book_type not null,
    borrowed_at timestamptz not null default now(),
    due_date    timestamptz,
    returned_at timestamptz,
    returned    boolean   not null default false
);

-- ── notifications (in-app feed) ──────────────────────────────────────────────
create table public.notifications (
    id         text primary key,
    user_id    uuid not null references public.users (id) on delete cascade,
    category   notification_category not null,
    title      text not null,
    body       text,
    read       boolean not null default false,
    created_at timestamptz not null default now()
);

-- ── reading_progress (resume point) ──────────────────────────────────────────
create table public.reading_progress (
    id           text primary key,
    user_id      uuid not null references public.users (id) on delete cascade,
    book_id      text not null references public.books (id) on delete cascade,
    current_page int  not null default 0,
    total_pages  int  not null default 0,
    updated_at   timestamptz not null default now(),
    unique (user_id, book_id)
);

-- ── audit_log (Functions/service-role writes only) ───────────────────────────
create table public.audit_log (
    id          text primary key,
    actor_uid   uuid not null,
    actor_role  user_role not null,
    action      text not null,             -- e.g. 'role.assign', 'book.delete'
    target_type text not null check (target_type in ('user', 'book', 'library')),
    target_id   text not null,
    details     jsonb,
    created_at  timestamptz not null default now()
);

-- ── Indexes (mirror firestore.indexes.json access patterns) ──────────────────
create index books_library_idx          on public.books (library_id);
create index books_featured_type_idx    on public.books (featured, type);
create index users_role_idx             on public.users (role);
create index users_home_library_idx     on public.users (home_library_id);
create index borrow_user_returned_idx   on public.borrow_records (user_id, returned);
create index borrow_book_idx            on public.borrow_records (book_id);
create index borrow_due_idx             on public.borrow_records (due_date) where returned = false;
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index reading_progress_user_idx  on public.reading_progress (user_id);
create index audit_created_idx          on public.audit_log (created_at desc);
