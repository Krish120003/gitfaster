"use client";
import React from "react";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (session) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <p className="text-sm">Signed in as {session.user?.name}</p>
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <p className="text-sm">Not signed in</p>
      <Button onClick={() => signIn()}>Sign In</Button>
    </div>
  );
}
