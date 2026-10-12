import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  stripeClient,
  completePayment,
  hasCheckoutSnapshot,
} from "@/lib/stripe";

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: id } = await searchParams;
  if (!id || !/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(id)) redirect("/checkout");
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user)
    redirect(
      `/login?next=${encodeURIComponent(`/checkout/success?session_id=${id}`)}`,
    );
  let order: string | undefined;
  let paid = false;
  try {
    const session = await stripeClient().checkout.sessions.retrieve(id);
    if (session.client_reference_id !== user.id)
      throw new Error("Wrong customer");
    paid = session.payment_status === "paid";
    if (paid && !hasCheckoutSnapshot(session)) {
      return (
        <div className="section container">
          <h1 className="text-3xl font-black">
            Payment received — order needs review
          </h1>
          <p className="mt-4">
            This payment came from an older checkout that did not save an order
            reference. Retrying cannot recreate the missing order details.
            Please contact the store with the payment reference below. Do not
            pay again for this purchase.
          </p>
          <p className="mt-4 font-mono break-all">{session.id}</p>
          <Link className="btn btn-secondary mt-6" href="/orders">
            Your orders
          </Link>
        </div>
      );
    }
    order = await completePayment(session);
  } catch (error) {
    console.error("Payment return failed", {
      sessionId: id,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return (
      <div className="section container">
        <h1 className="text-3xl font-black">
          {paid
            ? "Payment received — confirmation pending"
            : "Payment could not be confirmed"}
        </h1>
        <p className="mt-4">
          {paid
            ? "Please retry confirmation. You will not be charged again."
            : "Check your payment status before trying again."}
        </p>
        <a
          className="btn btn-primary mt-6"
          href={`/checkout/success?session_id=${encodeURIComponent(id)}`}
        >
          Retry confirmation
        </a>
        <Link className="btn btn-secondary ml-4" href="/orders">
          Your orders
        </Link>
      </div>
    );
  }
  redirect(`/order-confirmation?order=${order}`);
}
