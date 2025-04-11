import { Button } from "@/components/ui/button";

interface StateFilterProps {
  value: "open" | "closed" | "all";
  onChange: (value: "open" | "closed" | "all") => void;
}

export function StateFilter({ value, onChange }: StateFilterProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant={value === "open" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("open")}
      >
        Open
      </Button>
      <Button
        variant={value === "closed" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("closed")}
      >
        Closed
      </Button>
      <Button
        variant={value === "all" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("all")}
      >
        All
      </Button>
    </div>
  );
}
