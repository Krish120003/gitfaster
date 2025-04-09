import { HydrateClient } from "@/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="p-4">Welcome to Gitfaster!</main>
    </HydrateClient>
  );
}
