import { HydrateClient } from "@/trpc/server";
import { RepositoryInput } from "@/components/repository-input";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-6 text-center">
          <h1 className="text-3xl font-bold">Welcome to Gitfaster!</h1>
          <RepositoryInput />
        </div>
      </main>
    </HydrateClient>
  );
}
