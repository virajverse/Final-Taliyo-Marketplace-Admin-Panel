-- Notifications Module Setup (idempotent)
-- Run in Supabase SQL Editor or via CLI

create extension if not exists pgcrypto;

-- ========== NOTIFICATIONS ==========
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text,
  message text,
  body text,
  recipients uuid[] default '{}',
  type text,
  channels text[] default '{email}',
  status text,
  created_by uuid,
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipients_count int,
  read_count int,
  click_count int,
  created_at timestamptz not null default now()
);

alter table if exists public.notifications enable row level security;

drop policy if exists notifications_select_auth on public.notifications;
create policy notifications_select_auth on public.notifications for select using (auth.uid() is not null);

drop policy if exists notifications_insert_auth on public.notifications;
create policy notifications_insert_auth on public.notifications for insert with check (auth.uid() is not null);

drop policy if exists notifications_update_auth on public.notifications;
create policy notifications_update_auth on public.notifications for update using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists notifications_delete_auth on public.notifications;
create policy notifications_delete_auth on public.notifications for delete using (auth.uid() is not null);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.notifications to authenticated;

-- Ensure columns exist if table pre-existed
alter table public.notifications
  add column if not exists message text,
  add column if not exists body text,
  add column if not exists recipients uuid[] default '{}',
  add column if not exists type text,
  add column if not exists channels text[] default '{email}',
  add column if not exists status text,
  add column if not exists created_by uuid,
  add column if not exists scheduled_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists recipients_count int,
  add column if not exists read_count int,
  add column if not exists click_count int,
  add column if not exists created_at timestamptz not null default now();


-- ========== CAMPAIGNS ==========
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text,
  subject text,
  message text,
  recipients jsonb default '[]',
  type text,
  channels text[] default '{email}',
  status text,
  recipients_count int,
  open_rate numeric,
  click_rate numeric,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table if exists public.campaigns enable row level security;

drop policy if exists campaigns_select_auth on public.campaigns;
create policy campaigns_select_auth on public.campaigns for select using (auth.uid() is not null);

drop policy if exists campaigns_insert_auth on public.campaigns;
create policy campaigns_insert_auth on public.campaigns for insert with check (auth.uid() is not null);

drop policy if exists campaigns_update_auth on public.campaigns;
create policy campaigns_update_auth on public.campaigns for update using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists campaigns_delete_auth on public.campaigns;
create policy campaigns_delete_auth on public.campaigns for delete using (auth.uid() is not null);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.campaigns to authenticated;

-- Ensure columns exist if table pre-existed
alter table public.campaigns
  add column if not exists subject text,
  add column if not exists message text,
  add column if not exists recipients jsonb default '[]',
  add column if not exists type text,
  add column if not exists channels text[] default '{email}',
  add column if not exists recipients_count int,
  add column if not exists open_rate numeric,
  add column if not exists click_rate numeric,
  add column if not exists scheduled_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists created_at timestamptz not null default now();


-- ========== EMAIL LOGS ==========
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  from_email text not null,
  to_emails text[] default '{}',
  cc_emails text[] default '{}',
  bcc_emails text[] default '{}',
  subject text not null,
  text_content text,
  html_content text,
  message_id text,
  sent_by uuid,
  sent_at timestamptz not null default now()
);

alter table if exists public.email_logs enable row level security;

drop policy if exists email_logs_select_auth on public.email_logs;
create policy email_logs_select_auth on public.email_logs for select using (auth.uid() is not null);

drop policy if exists email_logs_insert_auth on public.email_logs;
create policy email_logs_insert_auth on public.email_logs for insert with check (auth.uid() is not null);

grant usage on schema public to authenticated;
grant select, insert on table public.email_logs to authenticated;


-- ========== PUSH SUBSCRIPTIONS (optional) ==========
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid,
  p256dh text,
  auth text,
  created_at timestamptz not null default now()
);

alter table if exists public.push_subscriptions enable row level security;

drop policy if exists push_select_auth on public.push_subscriptions;
create policy push_select_auth on public.push_subscriptions for select using (auth.uid() is not null);

drop policy if exists push_insert_auth on public.push_subscriptions;
create policy push_insert_auth on public.push_subscriptions for insert with check (auth.uid() is not null);

drop policy if exists push_update_self on public.push_subscriptions;
create policy push_update_self on public.push_subscriptions for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists push_delete_self on public.push_subscriptions;
create policy push_delete_self on public.push_subscriptions for delete using (user_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;
