"use client";
import React from "react";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function AuthButtons() {
  const session = useSession();

  return (
    <div>
      <Button onClick={() => signIn()}>Sign In</Button>
      <Button onClick={() => signOut()}>Sign Out</Button>

      {session && session.data ? (
        <div>
          <p>Welcome, {session.data.user?.name}</p>
        </div>
      ) : null}
    </div>
  );
}
