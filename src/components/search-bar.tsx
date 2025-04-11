import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (value: string) => void;
}

export function SearchBar({
  placeholder = "Search...",
  defaultValue = "",
  onSearch,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearch?.(newValue);
  };

  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="w-[200px] pl-8"
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}
