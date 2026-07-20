-- 0004 — hosted-compatible edge-function invoke.
--
-- On hosted Supabase the `postgres` role cannot `ALTER DATABASE ... SET`
-- (error 42501), so the app.settings.* approach in 0003 doesn't work in the
-- cloud. Store the URL + service-role key in Supabase Vault instead and read
-- them here. Run these ONCE in the SQL editor after this migration (Vault
-- writes do NOT need superuser):
--
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>',        'service_role_key');
--
-- To rotate later:
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'service_role_key'),
--     '<new-key>');

create extension if not exists supabase_vault with schema vault;

create or replace function public.invoke_edge_function(
    p_function_name text,
    p_payload       jsonb default '{}'::jsonb
) returns bigint
    language plpgsql
    security definer
    set search_path = public, extensions, vault
as $$
declare
    v_base_url text;
    v_key      text;
    v_request_id bigint;
begin
    select decrypted_secret into v_base_url
        from vault.decrypted_secrets where name = 'project_url';
    select decrypted_secret into v_key
        from vault.decrypted_secrets where name = 'service_role_key';

    if v_base_url is null or v_key is null then
        -- Don't abort the caller's transaction if wiring isn't configured yet.
        raise warning 'invoke_edge_function(%): Vault secrets project_url / service_role_key not set; skipping HTTP call', p_function_name;
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
