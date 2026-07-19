-- Auto-expiration des cadeaux Premium.
--
-- Un cadeau admin (organizations.settings.premium_gift_*) passait l'org en
-- premium sans jamais expirer : le plan restait actif jusqu'à révocation
-- manuelle. Un job pg_cron rétrograde désormais les organisations dont la
-- fenêtre du cadeau est passée, et garde la ligne `subscriptions` en phase pour
-- que le dashboard admin reflète la réalité.

create extension if not exists pg_cron;

create or replace function public.expire_premium_gifts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with expired as (
    update organizations o
    set subscription_plan = 'free',
        settings = (
          coalesce(o.settings, '{}'::jsonb)
            - 'premium_gift'
            - 'premium_gift_starts_at'
            - 'premium_gift_expires_at'
            - 'premium_gift_days'
            - 'premium_gifted_at'
        ) || jsonb_build_object(
          'premium_gift_last_expired_at', o.settings->>'premium_gift_expires_at'
        )
    where (o.settings->>'premium_gift')::boolean is true
      and o.subscription_plan = 'premium'
      and (o.settings->>'premium_gift_expires_at') is not null
      and (o.settings->>'premium_gift_expires_at')::timestamptz < now()
    returning o.id, o.settings->>'premium_gift_expires_at' as expired_at
  ),
  synced as (
    update subscriptions s
    set plan_key = 'free',
        status = 'active',
        current_period_end = null,
        updated_at = now()
    from expired e
    where s.organization_id = e.id
    returning s.organization_id
  )
  insert into subscription_events (organization_id, event_type, payload)
  select id, 'premium_gift_expired', jsonb_build_object('expires_at', expired_at)
  from expired;
end;
$$;

-- Appelée uniquement par pg_cron (rôle postgres) : ne doit pas être un endpoint
-- public via l'API Data.
revoke execute on function public.expire_premium_gifts() from public, anon, authenticated;

-- cron.schedule est idempotent par nom de job (upsert).
select cron.schedule(
  'expire-premium-gifts',
  '*/15 * * * *',
  'select public.expire_premium_gifts()'
);
