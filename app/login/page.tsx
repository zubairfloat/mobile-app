import { AuthForm } from "@/components/auth-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthForm
      mode="login"
      initialError={
        error === "google_signin_failed"
          ? "Google sign-in was cancelled or could not be completed. Please try again."
          : ""
      }
    />
  );
}
