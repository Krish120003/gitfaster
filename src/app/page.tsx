import { HydrateClient } from "@/trpc/server";
import AuthButtons from "./_components/auth-buttons";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="p-4">Welcome to Gitfaster!</main>

      <AuthButtons />
    </HydrateClient>
  );
}
