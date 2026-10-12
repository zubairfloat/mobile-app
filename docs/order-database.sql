-- Order checkout uses the existing orders/order_items tables.
alter table public.orders add column if not exists contact_email text;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists shipping_address jsonb;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
revoke all on public.orders, public.order_items from anon;

revoke insert, update, delete
on public.orders, public.order_items
from authenticated;

grant select
on public.orders, public.order_items
to authenticated;

create policy "Read own orders"
on public.orders
for select
to authenticated
using (
  user_id = (select auth.uid())
);

create policy "Read own order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);

create index if not exists orders_user_created_idx
on public.orders(user_id, created_at desc);

create index if not exists order_items_order_idx
on public.order_items(order_id);

create schema if not exists private;
grant usage on schema private to authenticated;

-- Privileged writes are confined here so customers cannot supply prices, mark
-- orders paid, or edit inventory through direct table writes.
create or replace function private.place_order(request_id uuid, checkout jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  customer uuid := auth.uid();
  active_id uuid;
  subtotal_value numeric := 0;
  shipping_value numeric;
  item record;
  field text;
begin
  if customer is null then raise exception 'Please sign in to place an order.'; end if;
  if request_id is null then raise exception 'Missing checkout request.'; end if;
  select id into active_id from public.carts where user_id = customer and status = 'active' for update;
  -- Retry after a lost response returns the same order, even after cart clearing.
  if exists (select 1 from public.orders where id = request_id and user_id = customer) then return request_id; end if;
  if active_id is null then raise exception 'Your cart is empty.'; end if;
  foreach field in array array['email','phone','first','address','city','country','zip','payment_method'] loop
    if coalesce(length(btrim(checkout ->> field)), 0) = 0 or length(checkout ->> field) > 500 then
      raise exception 'Please complete all required checkout fields (maximum 500 characters).';
    end if;
  end loop;
  foreach field in array array['last','address2','state'] loop
    if length(checkout ->> field) > 500 then raise exception 'Address fields must be at most 500 characters.'; end if;
  end loop;
  if checkout ->> 'email' !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'Enter a valid email address.'; end if;
  if checkout ->> 'payment_method' not in ('Card', 'Apple Pay', 'PayPal') then raise exception 'Select a valid payment method.'; end if;
  -- Lock cart lines and products in stable order to prevent overselling.
  perform 1 from public.cart_items where cart_id = active_id order by product_id for update;
  if not found then raise exception 'Your cart is empty.'; end if;
  for item in
    select p.id, p.price, p.is_active, p.stock_quantity, ci.quantity
    from public.cart_items ci join public.products p on p.id = ci.product_id
    where ci.cart_id = active_id order by p.id for update of p
  loop
    if item.is_active is distinct from true or item.quantity > item.stock_quantity then
      raise exception 'An item is unavailable or exceeds available stock. Please review your cart.';
    end if;
    subtotal_value := subtotal_value + item.price * item.quantity;
  end loop;
  shipping_value := case when subtotal_value >= 75 then 0 else 8 end;
  insert into public.orders(id, user_id, order_number, status, payment_status, subtotal, delivery_fee, total_amount, contact_email, payment_method, shipping_address)
  values (request_id, customer, 'PLS-' || upper(replace(request_id::text, '-', '')), 'pending', 'pending', subtotal_value, shipping_value, subtotal_value + shipping_value,
    btrim(checkout ->> 'email'), checkout ->> 'payment_method',
    jsonb_build_object('full_name', btrim(concat_ws(' ', btrim(checkout ->> 'first'), nullif(btrim(checkout ->> 'last'), ''))),
      'phone', btrim(checkout ->> 'phone'), 'address_line_1', btrim(checkout ->> 'address'), 'address_line_2', btrim(checkout ->> 'address2'),
      'city', btrim(checkout ->> 'city'), 'state', btrim(checkout ->> 'state'), 'postal_code', btrim(checkout ->> 'zip'), 'country', btrim(checkout ->> 'country')));
  insert into public.order_items(order_id, product_id, product_name, product_price, quantity, line_total)
    select request_id, p.id, p.name, p.price, ci.quantity, p.price * ci.quantity
    from public.cart_items ci join public.products p on p.id = ci.product_id where ci.cart_id = active_id;
  update public.products p set stock_quantity = p.stock_quantity - ci.quantity, updated_at = now()
    from public.cart_items ci where ci.cart_id = active_id and ci.product_id = p.id;
  delete from public.cart_items where cart_id = active_id;
  update public.carts set updated_at = now() where id = active_id;
  return request_id;
end;
$$;
revoke all on function private.place_order(uuid,jsonb) from public, anon;
grant execute on function private.place_order(uuid,jsonb) to authenticated;
create or replace function public.place_order(request_id uuid, checkout jsonb)
returns uuid language sql security invoker set search_path = '' as $$
  select private.place_order(request_id, checkout);
$$;
revoke all on function public.place_order(uuid,jsonb) from public, anon;
grant execute on function public.place_order(uuid,jsonb) to authenticated;
