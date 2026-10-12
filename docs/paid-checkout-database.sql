-- Apply to the existing order schema before enabling Stripe checkout.
alter table public.orders add column if not exists stripe_session_id text unique;
alter table public.orders add column if not exists stripe_payment_intent_id text unique;
-- Customers now create orders only through verified payment settlement.
revoke execute on function public.place_order(uuid,jsonb) from authenticated;
revoke execute on function private.place_order(uuid,jsonb) from authenticated;

-- Immutable checkout snapshots are server-only. No stock is reserved before payment.
create table if not exists public.checkout_drafts (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  contact_email text not null,
  shipping_address jsonb not null,
  items jsonb not null,
  subtotal numeric not null,
  delivery_fee numeric not null,
  total_amount numeric not null,
  created_at timestamptz not null default now()
);
alter table public.checkout_drafts enable row level security;
revoke all on public.checkout_drafts from anon, authenticated;
grant select, insert, update on public.checkout_drafts to service_role;

create or replace function public.complete_paid_checkout(checkout_id uuid, customer_id uuid, session_id text, amount_cents bigint, currency_code text, intent_id text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  draft public.checkout_drafts;
  saved public.orders;
  active_cart uuid;
  item jsonb;
  available integer;
  enough_stock boolean := true;
begin
  -- Same lock order as cart mutations: cart first, then product rows.
  select id into active_cart from public.carts where user_id = customer_id and status = 'active' for update;
  select * into draft from public.checkout_drafts where id = checkout_id for update;
  if not found or draft.user_id is distinct from customer_id or currency_code is distinct from 'usd'
    or amount_cents is distinct from round(draft.total_amount * 100)::bigint or session_id is null then
    raise exception 'Payment does not match checkout';
  end if;
  select * into saved from public.orders where id = checkout_id;
  if found then
    if saved.stripe_session_id is distinct from session_id or saved.user_id is distinct from customer_id then
      raise exception 'Checkout already belongs to another payment';
    end if;
    return saved.id;
  end if;
  for item in select value from jsonb_array_elements(draft.items) order by value->>'product_id' loop
    select stock_quantity into available from public.products where id = (item->>'product_id')::uuid for update;
    if not found or available < (item->>'quantity')::integer then enough_stock := false; end if;
  end loop;
  insert into public.orders(id,user_id,order_number,status,payment_status,subtotal,delivery_fee,total_amount,contact_email,payment_method,shipping_address,stripe_session_id,stripe_payment_intent_id)
  values(draft.id,customer_id,'PLS-' || upper(replace(draft.id::text,'-','')),
    case when enough_stock then 'confirmed' else 'awaiting_stock' end,'paid',draft.subtotal,draft.delivery_fee,draft.total_amount,draft.contact_email,'Stripe',draft.shipping_address,session_id,intent_id);
  for item in select value from jsonb_array_elements(draft.items) order by value->>'product_id' loop
    insert into public.order_items(order_id,product_id,product_name,product_price,quantity,line_total)
    values(draft.id,(item->>'product_id')::uuid,item->>'product_name',(item->>'product_price')::numeric,(item->>'quantity')::integer,(item->>'line_total')::numeric);
    if enough_stock then
      update public.products set stock_quantity = stock_quantity - (item->>'quantity')::integer, updated_at = now()
      where id = (item->>'product_id')::uuid;
    end if;
    -- Keep products added after checkout and any extra quantities.
    delete from public.cart_items where cart_id = active_cart and product_id = (item->>'product_id')::uuid and quantity <= (item->>'quantity')::integer;
    update public.cart_items set quantity = quantity - (item->>'quantity')::integer, updated_at = now()
    where cart_id = active_cart and product_id = (item->>'product_id')::uuid;
  end loop;
  update public.carts set updated_at = now() where id = active_cart;
  return draft.id;
end;
$$;
revoke all on function public.complete_paid_checkout(uuid,uuid,text,bigint,text,text) from public,anon,authenticated;
grant execute on function public.complete_paid_checkout(uuid,uuid,text,bigint,text,text) to service_role;
grant select,insert on public.orders,public.order_items to service_role;
grant select,update on public.products,public.carts to service_role;
grant select,update,delete on public.cart_items to service_role;
