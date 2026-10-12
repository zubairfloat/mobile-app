-- Apply after order-database.sql. Existing orders are not changed.
alter table public.orders add column if not exists stripe_session_id text unique;
alter table public.orders add column if not exists stripe_payment_intent_id text unique;
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

-- Only the trusted payment server may settle an order.
create or replace function public.settle_stripe_order(order_id uuid, customer_id uuid, session_id text, amount_cents bigint, currency_code text, was_paid boolean, intent_id text)
returns void language plpgsql security invoker set search_path = '' as $$
declare saved public.orders; item record;
begin
  select * into saved from public.orders where id = order_id for update;
  if not found or saved.user_id is distinct from customer_id or currency_code is distinct from 'usd'
    or amount_cents is distinct from round(saved.total_amount * 100)::bigint
    or session_id is null
    or (saved.stripe_session_id is not null and saved.stripe_session_id <> session_id) then
    raise exception 'Payment does not match order';
  end if;
  if saved.payment_status = 'paid' then return; end if;
  if saved.status = 'cancelled' then
    if was_paid then raise exception 'Cannot pay a released order'; end if;
    return;
  end if;
  if saved.status <> 'pending' then raise exception 'Order is not awaiting payment'; end if;
  if was_paid then
    update public.orders set payment_status = 'paid', status = 'confirmed', stripe_session_id = session_id,
      stripe_payment_intent_id = intent_id where id = order_id;
  else
    for item in select product_id, quantity from public.order_items where order_items.order_id = settle_stripe_order.order_id order by product_id loop
      update public.products set stock_quantity = stock_quantity + item.quantity, updated_at = now() where id = item.product_id;
    end loop;
    update public.orders set status = 'cancelled', payment_status = 'expired', stripe_session_id = session_id where id = order_id;
  end if;
end;
$$;
revoke all on function public.settle_stripe_order(uuid,uuid,text,bigint,text,boolean,text) from public, anon, authenticated;
grant execute on function public.settle_stripe_order(uuid,uuid,text,bigint,text,boolean,text) to service_role;
grant select, update on public.orders, public.products to service_role;
grant select on public.order_items to service_role;
