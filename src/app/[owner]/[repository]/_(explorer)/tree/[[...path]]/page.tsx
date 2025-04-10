import FolderView from "@/app/[owner]/[repository]/_components/repository-file-list";

interface PageProps {}

export default async function Page({}: PageProps) {
  return (
    <div>
      <FolderView />
    </div>
  );
}
