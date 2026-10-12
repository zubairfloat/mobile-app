-- Applied to vxxnuzkyqgmmqfoxebem as enable_owned_addresses.
-- Reference copy; these policies already exist in the project.
alter table public.addresses enable row level security;
grant select, insert, update, delete on public.addresses to authenticated;
create policy "Manage own addresses" on public.addresses
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
