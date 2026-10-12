# Stripe Checkout

Checkout reads the signed-in customer's cart and prices from Supabase, saves a private snapshot, and redirects to Stripe's hosted card payment page. No Stripe product needs to be created manually: Checkout receives product names and prices from the catalog.

`.env.local` uses `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_APP_URL` (locally `http://localhost:3001`). Keep secrets server-only. Restart the dev server after changing environment variables.

The return page verifies payment with Stripe and calls `complete_paid_checkout`. This transaction saves the order and items, updates stock, and removes purchased quantities from the cart. Repeated callbacks return the same order. Unpaid and cancelled sessions do not create orders. A paid order is `confirmed`, or `awaiting_stock` if inventory ran out during payment.

The database setup in `docs/paid-checkout-database.sql` has been applied to project `odretzseiuosvtngbzez`. It also disables customer access to the old unpaid `place_order` function.

## Webhooks

The return page works with the existing secret key. To also confirm orders when the customer never returns, configure Stripe to send `checkout.session.completed` and `checkout.session.async_payment_succeeded` to `/api/stripe/webhook`. Set its signing secret in `STRIPE_WEBHOOK_SECRET`; this cannot be derived from the API key.

For local development with the Stripe CLI:

```sh
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Copy the signing secret printed by the CLI into `.env.local`, then restart Next.js. For deployment, set the public HTTPS app origin and register the public webhook URL in Stripe.

## Verify

With a Stripe test key, sign in, add a product, and click **Pay with Stripe**. Use `4242 4242 4242 4242`, a future expiry, and any three-digit CVC. Return to the store and verify the order shows payment `paid`. Refresh confirmation and check that stock and order counts do not change again. Cancel a payment and verify the cart remains intact.

`tests/paid-checkout.sql` runs database checks in a rolled-back transaction. Type checking: `npx tsc --noEmit`.

Reference: [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment), [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create).
