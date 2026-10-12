-- Run against the configured database as postgres. All fixtures are rolled back.
begin;
do $$
declare
  customer uuid := gen_random_uuid();
  other_customer uuid := gen_random_uuid();
  product uuid := gen_random_uuid();
begin
  insert into auth.users(id, raw_user_meta_data) values(customer, '{}'::jsonb), (other_customer, '{}'::jsonb);
  insert into public.products(id, name, slug, price, stock_quantity, is_active)
  values(product, 'Checkout test', 'checkout-test-' || product, 20, 5, true);
  perform set_config('request.jwt.claim.sub', customer::text, true);
  perform set_config('test.customer', customer::text, true);
  perform set_config('test.other_customer', other_customer::text, true);
  perform set_config('test.product', product::text, true);
end $$;
set local role authenticated;
do $$
declare
  product uuid := current_setting('test.product')::uuid;
  request_id uuid := gen_random_uuid();
  failed_id uuid := gen_random_uuid();
  checkout jsonb := '{"email":"checkout@example.com","phone":"123456789","first":"Test","last":"Customer","address":"123 Test Street","city":"Karachi","country":"Pakistan","zip":"74000","payment_method":"Card"}';
  result uuid;
  saved public.orders;
  active_id uuid;
  blocked boolean := false;
begin
  active_id := public.mutate_cart('add', product, 2);
  -- Client-supplied prices and payment status must be ignored.
  result := public.place_order(request_id, checkout || '{"total_amount":0,"payment_status":"paid"}'::jsonb);
  select * into saved from public.orders where id = result;
  if saved.id is distinct from request_id or saved.subtotal <> 40 or saved.delivery_fee <> 8 or saved.total_amount <> 48 or saved.payment_status <> 'pending' or saved.status <> 'pending' then raise exception 'FAIL: order totals/status'; end if;
  if saved.shipping_address ->> 'city' <> 'Karachi' or saved.contact_email <> 'checkout@example.com' then raise exception 'FAIL: checkout snapshot'; end if;
  if (select count(*) from public.order_items where order_id = request_id and quantity = 2 and line_total = 40) <> 1 then raise exception 'FAIL: items'; end if;
  if exists(select 1 from public.cart_items where cart_id = active_id) then raise exception 'FAIL: cart not cleared'; end if;
  if (select stock_quantity from public.products where id = product) <> 3 then raise exception 'FAIL: stock'; end if;
  if public.place_order(request_id, checkout) <> request_id or (select stock_quantity from public.products where id = product) <> 3 then raise exception 'FAIL: retry duplicated order'; end if;
  begin
    perform public.place_order(failed_id, checkout);
  exception when raise_exception then
    if sqlerrm <> 'Your cart is empty.' then raise; end if;
    blocked := true;
  end;
  if not blocked then raise exception 'FAIL: empty cart accepted'; end if;
  perform public.mutate_cart('add', product, 1);
  update public.cart_items set quantity = 4 where cart_id = active_id and product_id = product;
  blocked := false;
  begin
    perform public.place_order(failed_id, checkout);
  exception when raise_exception then
    if sqlerrm not like 'An item is unavailable%' then raise; end if;
    blocked := true;
  end;
  if not blocked or exists(select 1 from public.orders where id = failed_id) or (select quantity from public.cart_items where cart_id = active_id and product_id = product) <> 4 then raise exception 'FAIL: failed checkout not atomic'; end if;
  perform public.mutate_cart('update', product, 1);
  blocked := false;
  begin
    perform public.place_order(failed_id, checkout || '{"email":"invalid"}'::jsonb);
  exception when raise_exception then
    if sqlerrm <> 'Enter a valid email address.' then raise; end if;
    blocked := true;
  end;
  if not blocked then raise exception 'FAIL: invalid email accepted'; end if;
  perform set_config('test.order', request_id::text, true);
  -- Changing user must hide both the order and its line items.
  perform set_config('request.jwt.claim.sub', current_setting('test.other_customer'), true);
  if exists(select 1 from public.orders where id = request_id) or exists(select 1 from public.order_items where order_id = request_id) then raise exception 'FAIL: another customer can read order'; end if;
  if has_table_privilege('authenticated', 'public.orders', 'INSERT') or has_table_privilege('authenticated', 'public.orders', 'UPDATE') then raise exception 'FAIL: direct writes allowed'; end if;
  if has_function_privilege('anon', 'public.place_order(uuid,jsonb)', 'EXECUTE') then raise exception 'FAIL: anonymous checkout allowed'; end if;
end $$;
reset role;
rollback;
