import { Link } from "@tanstack/react-router";

/**
 * Shown on private routes (admin, invoices, quotes, portals, signing) until
 * real authentication exists. Renders no data at all.
 */
export function NotAvailable() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 text-center text-foreground">
      <div className="max-w-md">
        <h1 className="font-heading text-2xl font-bold">Not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page isn&apos;t publicly accessible.</p>
        <Link to="/" className="mt-6 inline-block text-sm text-primary underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
