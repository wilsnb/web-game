import { PrimaryLink } from "@/components/Buttons";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center bg-canvas px-lg py-section text-center">
      <div className="max-w-content">
        <h1 className="text-display-lg font-semibold tracking-tight text-ink">
          Quiz not found
        </h1>
        <p className="mt-md text-body-apple text-ink-muted-80">
          We couldn&apos;t find that category. It may have moved.
        </p>
        <div className="mt-xl flex justify-center">
          <PrimaryLink href="/">Back to categories</PrimaryLink>
        </div>
      </div>
    </section>
  );
}
