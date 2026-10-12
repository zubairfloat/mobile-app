begin;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
grant select, insert, update on public.carts to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;

drop policy if exists "Read own carts" on public.carts;
create policy "Read own carts" on public.carts for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Manage own active cart items" on public.cart_items;
create policy "Manage own active cart items" on public.cart_items
for all to authenticated
using (
  exists (
    select 1 from public.carts as parent_cart
    where parent_cart.id = cart_items.cart_id
      and parent_cart.user_id = (select auth.uid())
      and parent_cart.status = 'active'
  )
)
with check (
  exists (
    select 1 from public.carts as parent_cart
    where parent_cart.id = cart_items.cart_id
      and parent_cart.user_id = (select auth.uid())
      and parent_cart.status = 'active'
  )
);
commit;

