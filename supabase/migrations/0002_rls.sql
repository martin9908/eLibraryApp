-- Aklatan+ Row-Level Security — port of firestore.rules.
--
-- Authorization source of truth = the JWT custom claims (role/libs/region),
-- carried in app_metadata and set ONLY server-side (Edge Function via the
-- service-role key / admin API — the client can never change its own role).
-- The service_role bypasses RLS, so all privileged server writes (claim mirror,
-- notifications, audit log, staff loan corrections) go through Edge Functions.
--
-- Roles: admin ⊇ librarian ⊇ patron. A suspended account has no role claim, so
-- jwt_role() is NULL → is_active() false → writes denied.

-- ── Claim helpers (read the token, no table reads) ───────────────────────────
create or replace function public.jwt_role() returns user_role
    language sql stable as $$
    select nullif(auth.jwt() -> 'app_metadata' ->> 'role', '')::user_role
$$;

create or replace function public.is_active() returns boolean
    language sql stable as $$ select public.jwt_role() is not null $$;

create or replace function public.is_admin() returns boolean
    language sql stable as $$ select public.jwt_role() = 'admin' $$;

create or replace function public.is_librarian() returns boolean
    language sql stable as $$ select public.jwt_role() = 'librarian' $$;

-- Librarian scope travels in the token: app_metadata.libs (array) / .region.
create or replace function public.lib_in_scope(p_library_id text, p_region text)
    returns boolean language sql stable as $$
    select public.is_admin()
        or (public.is_librarian() and (
             p_library_id in (
                 select jsonb_array_elements_text(
                     coalesce(auth.jwt() -> 'app_metadata' -> 'libs', '[]'::jsonb))
             )
          or (p_region is not null
              and p_region = (auth.jwt() -> 'app_metadata' ->> 'region'))
        ))
$$;

-- ── Enable RLS on every table ────────────────────────────────────────────────
alter table public.libraries        enable row level security;
alter table public.users            enable row level security;
alter table public.books            enable row level security;
alter table public.borrow_records   enable row level security;
alter table public.notifications    enable row level security;
alter table public.reading_progress enable row level security;
alter table public.audit_log        enable row level security;

-- ── Grants (RLS still filters rows; column grants enforce field-level limits) ─
grant usage on schema public to anon, authenticated;

-- Catalog is publicly readable (matches firestore rule `allow read: if true`).
grant select on public.books      to anon, authenticated;
grant select on public.libraries  to authenticated;

grant select, insert, update, delete on public.books            to authenticated;
grant select, insert, update, delete on public.borrow_records   to authenticated;
grant select, insert, update, delete on public.reading_progress to authenticated;
grant select, insert                 on public.users            to authenticated;
grant select                         on public.notifications    to authenticated;
grant select                         on public.audit_log        to authenticated;

-- Column-level limits (RLS is row-level only; these cap which fields a client
-- may write, replacing the Firestore `affectedKeys().hasOnly(...)` guards).
grant update (home_library_id, member_type, expo_push_token, updated_at)
    on public.users to authenticated;               -- never role/status/scope
grant update (returned, returned_at)
    on public.borrow_records to authenticated;       -- only the return transition
grant update (read)
    on public.notifications to authenticated;        -- only mark-as-read

-- ── books: public read; writes gated by role + owning-library scope ──────────
create policy books_read   on public.books for select using (true);
create policy books_insert on public.books for insert
    with check (public.lib_in_scope(library_id, region));
create policy books_update on public.books for update
    using (public.lib_in_scope(library_id, region))
    with check (public.lib_in_scope(library_id, region));
create policy books_delete on public.books for delete
    using (public.lib_in_scope(library_id, region));

-- ── users: owner reads own; admin/librarian read any; owner self-create as
--    patron/active; owner updates only the granted columns above. ─────────────
create policy users_read   on public.users for select
    using (id = auth.uid() or public.is_admin() or public.is_librarian());
create policy users_insert on public.users for insert
    with check (id = auth.uid() and role = 'patron' and status = 'active');
create policy users_update on public.users for update
    using (id = auth.uid()) with check (id = auth.uid());
-- No delete policy → client deletes denied (matches `allow delete: if false`).

-- ── borrow_records: owner + staff read; patron opens own loan; owner may only
--    flip returned false→true; staff corrections via service-role. ────────────
create policy borrow_read   on public.borrow_records for select
    using (user_id = auth.uid() or public.is_admin() or public.is_librarian());
create policy borrow_insert on public.borrow_records for insert
    with check (user_id = auth.uid() and public.is_active() and returned = false);
create policy borrow_update on public.borrow_records for update
    using (user_id = auth.uid() and returned = false)
    with check (user_id = auth.uid() and returned = true);
create policy borrow_delete on public.borrow_records for delete
    using (public.is_admin());

-- ── notifications: owner/admin read; owner may only mark read; creation and
--    deletion are server-side (service-role). ───────────────────────────────
create policy notif_read   on public.notifications for select
    using (user_id = auth.uid() or public.is_admin());
create policy notif_update on public.notifications for update
    using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── reading_progress: owner-only, full CRUD ──────────────────────────────────
create policy progress_all on public.reading_progress for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── libraries: signed-in read; admin writes ──────────────────────────────────
create policy libraries_read  on public.libraries for select
    using (auth.role() = 'authenticated');
create policy libraries_write on public.libraries for all
    using (public.is_admin()) with check (public.is_admin());

-- ── audit_log: admin read; no client writes (service-role only) ──────────────
create policy audit_read on public.audit_log for select
    using (public.is_admin());
