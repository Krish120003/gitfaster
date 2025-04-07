import { HydrateClient } from "@/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main>Welcome to Gitfaster!</main>
    </HydrateClient>
  );
}
