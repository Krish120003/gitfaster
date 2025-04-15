"use client";
import React from "react";

import { signIn, signOut, useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignIn() {
  return (
    <button
      className="p-4 border-r w-fit bg-transparent rounded-none hover:bg-foreground hover:text-background cursor-pointer flex items-center gap-2 hover:gap-4 transition-all"
      onClick={() => {
        signIn("github");
      }}
    >
      Sign In <ArrowRight className="h-4 w-4" />
    </button>
  );
}

export function SignOut({ className }: { className?: string }) {
  const { data: session } = useSession();
  return (
    <button
      className={cn(
        "p-4 border-r w-fit bg-transparent rounded-none hover:bg-foreground hover:text-background cursor-pointer flex items-center gap-2 hover:gap-4 transition-all",
        className
      )}
      onClick={() => {
        signOut();
      }}
    >
      Sign Out?
    </button>
  );
}
