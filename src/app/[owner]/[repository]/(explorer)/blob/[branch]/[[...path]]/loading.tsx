import { File } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import FilenameFromParams from "./_components/filename";
const skeletonWidths = [
  "30%",
  "45%",
  "28%",
  "40%",
  "35%",
  "37%",
  "32%",
  "42%",
  "29%",
  "50%",
  "33%",
  "41%",
  "36%",
  "27%",
  "39%",
];
const skeletons = skeletonWidths.map((width, i) => (
  <Skeleton key={i} className="h-4" style={{ width }} />
));
export default function Loading() {
  return (
    <div className="rounded-lg border border-border bg-background flex flex-col">
      {/* Header section similar to FolderView */}
      <div className="flex border-b border-border justify-between">
        <div className="p-3 text-muted-foreground font-medium flex gap-2 items-center">
          <File className="h-5 w-5 text-muted-foreground" />
          <FilenameFromParams />
        </div>
        <div className="p-3 text-right text-muted-foreground"></div>
      </div>

      {/* Content section with pre tags */}
      <div className="p-4 overflow-auto ">
        <div className="flex flex-col gap-2">{skeletons}</div>
      </div>
    </div>
  );
}
