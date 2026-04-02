import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tari — Modern Messaging',
};

export default function LandingPage() {
  return (
    <section className="container flex flex-col items-center justify-center gap-8 pb-12 pt-24 md:pt-36">
      <div className="flex flex-col items-center gap-4">
        <span className="rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
          Real-time messaging for teams
        </span>
        <h1 className="max-w-3xl text-center text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Messaging, reimagined.
        </h1>
        <p className="max-w-[42rem] text-center text-lg text-muted-foreground sm:text-xl">
          Fast, reliable, and beautifully simple. Connect with anyone, anywhere
          — in real time.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/register"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Get started free
        </Link>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Log in
        </Link>
      </div>
    </section>
  );
}
