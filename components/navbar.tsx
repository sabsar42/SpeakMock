import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  transparent?: boolean;
  onBookClick?: () => void;
}

export function Navbar({ transparent = false, onBookClick }: NavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        transparent ? "bg-transparent" : "border-b border-border bg-white"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className={cn(
            "text-lg font-bold",
            transparent ? "text-white drop-shadow-md" : "text-text-primary"
          )}
        >
          Speak
          <span className={transparent ? "text-dune-300" : "text-primary"}>
            Mock
          </span>
        </Link>
        {onBookClick ? (
          <Button size="sm" variant={transparent ? "accent" : "primary"} onClick={onBookClick}>
            Book a Session
          </Button>
        ) : (
          <Button asChild size="sm" variant={transparent ? "accent" : "primary"}>
            <Link href="/book">Book a Session</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
