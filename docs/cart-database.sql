alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
grant select, insert, update on public.carts to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
create policy "Read own carts" on public.carts for select to authenticated using (user_id = (select auth.uid()));
create policy "Create own active cart" on public.carts for insert to authenticated with check (user_id = (select auth.uid()) and status = 'active');
create policy "Update own active cart" on public.carts for update to authenticated using (user_id = (select auth.uid()) and status = 'active') with check (user_id = (select auth.uid()) and status = 'active');
create policy "Manage own active cart items" on public.cart_items for all to authenticated
using (cart_id in (select id from public.carts where user_id = (select auth.uid()) and status = 'active')) with check (cart_id in (select id from public.carts where user_id = (select auth.uid()) and status = 'active'));

create or replace function public.mutate_cart(action text, target_product uuid default null, amount integer default 1)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare active_id uuid; available integer; current_quantity integer; next_quantity integer;
begin
  if auth.uid() is null then raise exception 'Please sign in to use your cart.'; end if;
  if action not in ('add','update','remove','clear') or action is null then raise exception 'Invalid cart action.'; end if;
  if action in ('add','update') and (amount is null or amount < 1) then raise exception 'Quantity must be a positive integer.'; end if;
  insert into public.carts(user_id,status) values(auth.uid(),'active') on conflict (user_id,status) do nothing;
  select id into active_id from public.carts where user_id=auth.uid() and status='active' for update;
  if action = 'clear' then
    delete from public.cart_items where cart_id=active_id;
  elsif action = 'remove' then
    delete from public.cart_items where cart_id=active_id and product_id=target_product;
  else
    select stock_quantity into available from public.products where id=target_product and is_active=true;
    if not found then raise exception 'This product is no longer available.'; end if;
    select quantity into current_quantity from public.cart_items where cart_id=active_id and product_id=target_product;
    if action='update' and current_quantity is null then raise exception 'This item is no longer in your cart.'; end if;
    next_quantity := case when action='add' then coalesce(current_quantity,0)+amount else amount end;
    if next_quantity > available then raise exception 'Requested quantity exceeds available stock (%).', available; end if;
    insert into public.cart_items(cart_id,product_id,quantity) values(active_id,target_product,next_quantity)
    on conflict(cart_id,product_id) do update set quantity=excluded.quantity,updated_at=now();
  end if;
  update public.carts set updated_at=now() where id=active_id;
  return active_id;
end;
$$;
revoke all on function public.mutate_cart(text,uuid,integer) from public, anon;
grant execute on function public.mutate_cart(text,uuid,integer) to authenticated;
