import ExplorerView from "@/app/[owner]/[repository]/(explorer)/_components/explorer-view";

export default function Page() {
  // This page simply renders the client component,
  // which handles data fetching and rendering based on the URL.
  return <ExplorerView />;
}
