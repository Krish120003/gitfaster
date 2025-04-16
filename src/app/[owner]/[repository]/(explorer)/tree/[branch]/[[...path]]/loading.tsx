import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Folder } from "lucide-react";

export default function Loading() {
  return (
    <div className="">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* Empty header to match the actual view */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Folder
                    className="h-5 w-5 text-muted-foreground"
                    stroke="none"
                    fill="currentColor"
                  />
                  <Skeleton className="h-4 w-32" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
