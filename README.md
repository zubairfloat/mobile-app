# next-ecom

# next-ecom

# next-ecom

## Google sign-in

Login and signup include **Continue with Google**, using Supabase OAuth and the `/auth/callback` session exchange route. Successful sign-in redirects to `/account`.

1. In Supabase Authentication → Sign In / Providers → Google, enable Google and enter your Google OAuth Web client ID and secret. Keep the secret in Supabase, never in `NEXT_PUBLIC_` environment variables.
2. In Google Auth Platform, add the Supabase callback URL shown in that provider screen to the OAuth client's authorized redirect URIs.
3. In Supabase Authentication → URL Configuration, set your Site URL and allow `http://localhost:3000/auth/callback` and your production `/auth/callback` URL.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
5. Test Continue with Google on `/login`, successful return to `/account`, cancellation, and logout.

Reference: [Supabase Google sign-in documentation](https://supabase.com/docs/guides/auth/social-login/auth-google).

## Live catalog

The homepage, category filters, and product detail pages read `public.products` and `public.categories` using `lib/catalog.ts`. Only active products are displayed. Categories use an associated product image, with a local placeholder when unavailable. Ratings and color options are hidden because the database does not contain those fields. Prices retain the existing dollar display.
# mobile-app
