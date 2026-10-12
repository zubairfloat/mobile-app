# Supabase cart

Project: `vxxnuzkyqgmmqfoxebem`.

The applied migration `enable_owned_cart_operations` enables ownership-based RLS on carts and cart items and provides `public.mutate_cart(action, target_product, amount)`. The function runs with the caller's permissions and supports `add`, `update`, `remove`, and `clear`. It locks the user's active cart to serialize concurrent writes and validates positive quantities and available stock.

The existing unique constraints enforce one cart per user/status and one item per cart/product. The browser reads the active cart and joins current product data. Guests must sign in; localStorage carts are no longer used. The current schema has no color/variant column, so items are identified by product.

Checkout remains a demo: it clears the active cart after submission and does not create an order or process payment.

The store provider now calls this RPC and reloads the active cart after each successful mutation. Cart controls show loading/error states and disable concurrent changes. Buy Now waits for the saved cart before navigating. Live verification during this integration was blocked by database connection timeouts; confirm the function above is installed if cart writes fail.
