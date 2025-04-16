import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GitBranchIcon } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <header className="border-b">
        <div className="flex h-12 items-center justify-between">
          <div className="flex justify-center items-center gap-2 w-32 border-r h-full">
            <GitBranchIcon className="h-4 w-4 text-[#f0883e]" />
            <span className="text-sm font-medium">gitfaster</span>
          </div>

          <div className="flex items-center gap-4 w-32 border-l h-12 justify-center">
            <a
              href="https://krish.gg"
              target="_blank"
              className="text-xs font-mono text-muted-foreground hover:underline hover:text-foreground flex items-center gap-1"
            >
              By <span>krish.gg</span>
            </a>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3rem)] font-mono w-screen items-stretch">
        <aside className="w-32 border-r"></aside>
        <main className="flex-1 flex items-center justify-center w-full">
          <div className="space-y-4 text-center">
            <div className="flex justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="72"
                height="72"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8v3a1 1 0 0 0 1 1h3m0-4v8m10-8v3a1 1 0 0 0 1 1h3m0-4v8m-11-6v4a2 2 0 1 0 4 0m0-4a2 2 0 0 0-2-2M3 3l18 18"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              Page Not Found
            </h2>
            <p className="text-muted-foreground">
              Sorry, we couldn't find the resource you were looking for.
            </p>
            <Button asChild variant="default">
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </main>
        <aside className="w-32 border-l"></aside>
      </div>
    </>
  );
}
