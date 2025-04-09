import { api } from "@/trpc/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { owner, repository } = await params;

  const data = await api.github.getRepositoryOverview({
    owner,
    repository,
  });

  return (
    <div className="p-4 mx-auto md:max-w-7xl w-full">
      <div className="w-full grid grid-cols-4 gap-8">
        {/* File Browser and README */}
        <div className="col-span-3 flex flex-col gap-4">
          <section>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </section>
        </div>

        {/* Description / Metadata */}
        <div className="col-span-1">
          <section className="">
            <h2 className="font-bold">About</h2>
            <p>{data.description}</p>
            {/* topics go here, as badges (should be a component) */}
          </section>
        </div>
      </div>
    </div>
  );
}
