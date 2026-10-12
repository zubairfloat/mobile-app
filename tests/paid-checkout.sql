begin;
do $$
declare customer uuid := gen_random_uuid(); product uuid := gen_random_uuid(); cart uuid := gen_random_uuid(); draft uuid := gen_random_uuid();
begin
 insert into auth.users(id) values(customer);
 insert into public.products(id,name,slug,price,stock_quantity,is_active) values(product,'Paid checkout test',product::text,20,10,true);
 insert into public.carts(id,user_id,status) values(cart,customer,'active');
 insert into public.cart_items(cart_id,product_id,quantity) values(cart,product,3);
 insert into public.checkout_drafts(id,user_id,contact_email,shipping_address,items,subtotal,delivery_fee,total_amount)
 values(draft,customer,'test@example.com','{"full_name":"Test Customer","city":"Karachi"}',jsonb_build_array(jsonb_build_object('product_id',product,'product_name','Snapshot name','product_price',20,'quantity',2,'line_total',40)),40,8,48);
 perform set_config('test.customer',customer::text,true); perform set_config('test.product',product::text,true); perform set_config('test.draft',draft::text,true); perform set_config('test.cart',cart::text,true);
 if has_function_privilege('authenticated','public.complete_paid_checkout(uuid,uuid,text,bigint,text,text)','execute') then raise exception 'Customer can mark payments paid'; end if;
 if has_table_privilege('authenticated','public.checkout_drafts','SELECT') then raise exception 'Drafts exposed'; end if;
end $$;
set local role service_role;
do $$
declare draft uuid := current_setting('test.draft')::uuid; customer uuid := current_setting('test.customer')::uuid; blocked boolean := false;
begin
 begin perform public.complete_paid_checkout(draft,customer,'cs_fixture',1,'usd','pi_fixture'); exception when raise_exception then blocked := true; end;
 if not blocked then raise exception 'Wrong total accepted'; end if;
 perform public.complete_paid_checkout(draft,customer,'cs_fixture',4800,'usd','pi_fixture');
 perform public.complete_paid_checkout(draft,customer,'cs_fixture',4800,'usd','pi_fixture');
 if (select count(*) from public.orders where id=draft and payment_status='paid' and status='confirmed' and shipping_address->>'city'='Karachi') <> 1 then raise exception 'Paid order not saved'; end if;
 if (select quantity from public.cart_items where cart_id=current_setting('test.cart')::uuid) <> 1 then raise exception 'Extra quantity not preserved'; end if;
 if (select stock_quantity from public.products where id=current_setting('test.product')::uuid) <> 8 then raise exception 'Duplicate stock deduction'; end if;
 if (select count(*) from public.order_items where order_id=draft and product_name='Snapshot name') <> 1 then raise exception 'Snapshot not preserved'; end if;
end $$;
reset role;
-- A paid purchase is still recorded if stock was exhausted while on Stripe.
update public.products set stock_quantity=0 where id=current_setting('test.product')::uuid;
insert into public.checkout_drafts(id,user_id,contact_email,shipping_address,items,subtotal,delivery_fee,total_amount)
select gen_random_uuid(),user_id,contact_email,shipping_address,items,subtotal,delivery_fee,total_amount from public.checkout_drafts where id=current_setting('test.draft')::uuid;
set local role service_role;
do $$
declare draft uuid;
begin
 select id into draft from public.checkout_drafts where user_id=current_setting('test.customer')::uuid and id<>current_setting('test.draft')::uuid;
 perform public.complete_paid_checkout(draft,current_setting('test.customer')::uuid,'cs_stock_fixture',4800,'usd','pi_stock_fixture');
 if not exists(select 1 from public.orders where id=draft and status='awaiting_stock' and payment_status='paid') then raise exception 'Stock shortage lost paid order'; end if;
 if exists(select 1 from public.cart_items where cart_id=current_setting('test.cart')::uuid) then raise exception 'Purchased cart not cleared'; end if;
end $$;
reset role;
rollback;
