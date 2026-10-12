"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="section container text-center" role="alert">
      <h1 className="text-3xl font-bold">Unable to load this page</h1>
      <p className="muted mt-3">Please try again in a moment.</p>
      <button className="btn btn-primary mt-6" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
