import { Scatter } from "../ui/svgs";

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-12 z-10 relative">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary">
            <Scatter className="size-3 text-primary-foreground" />
          </div>
          <span className="font-semibold">Scatter</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2025 Scatter. Write once, distribute everywhere.
        </p>
      </div>
    </footer>
  );
}
