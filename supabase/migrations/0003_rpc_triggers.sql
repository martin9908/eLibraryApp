-- Aklatan+ — RPCs, triggers, and scheduled jobs.
-- Port of functions/src/* (Firebase Cloud Functions) to Postgres + Edge Functions.
--
-- What lives where after the migration:
--   * Atomic, single-transaction mutations that need no external HTTP
--     (borrow / return, profile bootstrap) → SECURITY DEFINER SQL RPCs here.
--   * Anything that needs an admin API call, Storage signing, or an Expo push
--     (role/status/scope, eBook signed URLs, notifications) → Edge Functions
--     (supabase/functions/*), which use the service-role key.
--   * The old Firebase schedulers/triggers (sendDueDateReminders,
--     onBookAvailabilityChange, onUserCreate) are reproduced below as a
--     pg_cron job, an AFTER UPDATE trigger, and an AFTER INSERT trigger.

-- ── Extensions ───────────────────────────────────────────────────────────────
-- pg_net  : fire HTTP from SQL (trigger/cron → Edge Function).
-- pg_cron : the daily due-date-reminder schedule (replaces functions.scheduler).
create extension if not exists pg_net  with schema extensions;
create extension if not exists pg_cron;

-- ── Storage: private 'ebooks' bucket ─────────────────────────────────────────
-- Gated eBook bytes live here. No RLS policies are granted to anon/authenticated,
-- so the only read path is a signed URL minted by the get-ebook-url Edge Function
-- (service-role) after it verifies an active loan. Replaces the Firebase Storage
-- bucket used by getEbookUrl.
insert into storage.buckets (id, name, public)
values ('ebooks', 'ebooks', false)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Edge Function invoker
-- ─────────────────────────────────────────────────────────────────────────────
-- Both the availability trigger and the pg_cron reminder job need to reach an
-- Edge Function over HTTP (Expo push must go through Deno's fetch). We read the
-- project URL + service-role key from database settings so no secret is baked
-- into this migration.
--
-- Operator setup (run once per environment, e.g. via `supabase secrets`/psql):
--   alter database postgres set app.settings.supabase_url        = 'https://<ref>.supabase.co';
--   alter database postgres set app.settings.service_role_key     = '<service-role-key>';
-- (Locally, point supabase_url at http://host.docker.internal:54321.)
create or replace function public.invoke_edge_function(
    p_function_name text,
    p_payload       jsonb default '{}'::jsonb
) returns bigint
    language plpgsql
    security definer
    set search_path = public, extensions
as $$
declare
    v_base_url text := current_setting('app.settings.supabase_url', true);
    v_key      text := current_setting('app.settings.service_role_key', true);
    v_request_id bigint;
begin
    if v_base_url is null or v_key is null then
        -- Don't abort the caller's transaction if wiring isn't configured yet;
        -- log a warning so the deferred push can be diagnosed.
        raise warning 'invoke_edge_function(%): app.settings.supabase_url / service_role_key not set; skipping HTTP call', p_function_name;
        return null;
    end if;

    select net.http_post(
        url     := v_base_url || '/functions/v1/' || p_function_name,
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || v_key
        ),
        body    := p_payload
    ) into v_request_id;

    return v_request_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: borrow_book
-- ─────────────────────────────────────────────────────────────────────────────
-- Atomic loan open. Replaces the client-side "decrement + insert" pair with a
-- single transaction so two patrons can't over-borrow the last copy.
-- Borrower is always auth.uid() — the client can't borrow on someone's behalf.
create or replace function public.borrow_book(
    p_book_id  text,
    p_type     book_type,
    p_due_date timestamptz
) returns public.borrow_records
    language plpgsql
    security definer
    set search_path = public
as $$
declare
    v_uid    uuid := auth.uid();
    v_avail  int;
    v_record public.borrow_records;
begin
    if v_uid is null then
        raise exception 'Sign in required.' using errcode = '28000';
    end if;

    -- Lock the book row so the availability check + decrement are atomic.
    select available_copies into v_avail
    from public.books
    where id = p_book_id
    for update;

    if not found then
        raise exception 'Book not found.' using errcode = 'P0002';
    end if;
    if v_avail <= 0 then
        raise exception 'No copies available to borrow.' using errcode = 'P0001';
    end if;

    update public.books
    set available_copies = available_copies - 1
    where id = p_book_id;

    insert into public.borrow_records (id, user_id, book_id, type, borrowed_at, due_date, returned)
    values (gen_random_uuid()::text, v_uid, p_book_id, p_type, now(), p_due_date, false)
    returning * into v_record;

    return v_record;
end;
$$;

grant execute on function public.borrow_book(text, book_type, timestamptz) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: return_book
-- ─────────────────────────────────────────────────────────────────────────────
-- Close a loan. The owner may return their own loan; staff (admin/librarian)
-- may return anyone's (loan correction). Increments availability, capped at
-- total_copies so a mis-fired double-return can't inflate stock.
create or replace function public.return_book(
    p_record_id text
) returns public.borrow_records
    language plpgsql
    security definer
    set search_path = public
as $$
declare
    v_uid     uuid := auth.uid();
    v_is_staff boolean := public.is_admin() or public.is_librarian();
    v_record  public.borrow_records;
begin
    if v_uid is null then
        raise exception 'Sign in required.' using errcode = '28000';
    end if;

    select * into v_record
    from public.borrow_records
    where id = p_record_id
    for update;

    if not found then
        raise exception 'Loan record not found.' using errcode = 'P0002';
    end if;
    if v_record.user_id <> v_uid and not v_is_staff then
        raise exception 'You can only return your own loans.' using errcode = '42501';
    end if;
    if v_record.returned then
        raise exception 'This loan has already been returned.' using errcode = 'P0001';
    end if;

    update public.borrow_records
    set returned = true, returned_at = now()
    where id = p_record_id
    returning * into v_record;

    -- Give the copy back, capped at total_copies.
    update public.books
    set available_copies = least(available_copies + 1, total_copies)
    where id = v_record.book_id;

    return v_record;
end;
$$;

grant execute on function public.return_book(text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: bootstrap a profile for every new auth user (replaces onUserCreate)
-- ─────────────────────────────────────────────────────────────────────────────
-- New accounts default to patron/active (FR-002). The authoritative role also
-- lives in the JWT app_metadata claim; that claim is set by the assign-role /
-- set-account-status Edge Functions. Fresh sign-ups have no role claim yet and
-- so are effectively inert until an admin grants one (or they act as a patron
-- via the profile row + is_active semantics).
create or replace function public.handle_new_auth_user()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
as $$
begin
    insert into public.users (id, role, status)
    values (new.id, 'patron', 'active')
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_auth_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: availability alert (replaces onBookAvailabilityChange)
-- ─────────────────────────────────────────────────────────────────────────────
-- Fires when available_copies transitions from 0 to > 0. Reproduces the
-- original logic: find distinct PAST borrowers (returned = true) of this title
-- — the users most likely interested — insert an 'availability' notification
-- row for each, then hand off to the notify-availability Edge Function which
-- sends the Expo push (HTTP to exp.host can't happen in SQL).
create or replace function public.handle_book_availability()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
as $$
begin
    if not (old.available_copies = 0 and new.available_copies > 0) then
        return new;
    end if;

    -- In-app feed: one 'availability' notification per distinct past borrower.
    insert into public.notifications (id, user_id, category, title, body, read, created_at)
    select
        gen_random_uuid()::text,
        br.user_id,
        'availability',
        'Book now available!',
        '"' || new.title || '" is back in stock. Borrow it before it runs out.',
        false,
        now()
    from (
        select distinct user_id
        from public.borrow_records
        where book_id = new.id and returned = true
    ) br;

    -- Expo push (out-of-band, over HTTP): let the Edge Function fan out to the
    -- same past borrowers' push tokens. If wiring isn't configured the push is
    -- simply skipped (see invoke_edge_function) — the in-app rows above still land.
    perform public.invoke_edge_function(
        'notify-availability',
        jsonb_build_object('bookId', new.id)
    );

    return new;
end;
$$;

drop trigger if exists on_book_availability on public.books;
create trigger on_book_availability
    after update of available_copies on public.books
    for each row execute function public.handle_book_availability();

-- ─────────────────────────────────────────────────────────────────────────────
-- pg_cron: daily due-date reminders (replaces functions.scheduler '0 0 * * *')
-- ─────────────────────────────────────────────────────────────────────────────
-- 00:00 UTC == 08:00 Manila. Invokes the send-due-reminders Edge Function,
-- which queries loans due tomorrow and sends the Expo pushes + notification rows.
select cron.schedule(
    'send-due-reminders-daily',
    '0 0 * * *',
    $cron$ select public.invoke_edge_function('send-due-reminders', '{}'::jsonb); $cron$
);
