"use client";

import { useState, useCallback } from "react";
import AsyncSelect from "react-select/async";
import type { GroupBase, OptionsOrGroups } from "react-select";
import debounce from "lodash.debounce";
import { api } from "@/trpc/react";
import type { Repository } from "@/server/api/routers/user";

interface RepositoryOption {
  value: string;
  label: string;
  repository: Repository;
}

export function RepositorySearch({
  onSelect,
}: {
  onSelect: (repo: Repository) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const searchRepositories = api.user.searchRepositories.useMutation();

  // Create a standalone loadOptions function
  const loadOptionsBase = async (
    inputValue: string
  ): Promise<RepositoryOption[]> => {
    if (!inputValue) {
      return [];
    }

    try {
      const results = await searchRepositories.mutateAsync({
        query: inputValue,
      });

      return results.map((repo) => ({
        value: `${repo.owner.login}/${repo.name}`,
        label: `${repo.owner.login}/${repo.name}`,
        repository: repo,
      }));
    } catch (error) {
      console.error("Error searching repositories:", error);
      return [];
    }
  };

  // Using the appropriate type for react-select/async
  const loadOptions = (
    inputValue: string,
    callback: (options: RepositoryOption[]) => void
  ) => {
    loadOptionsBase(inputValue).then(callback);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    return newValue;
  };

  const handleChange = (selected: any) => {
    if (selected && selected.repository) {
      onSelect(selected.repository);
    }
  };

  return (
    <div className="w-full">
      <AsyncSelect
        cacheOptions
        defaultOptions
        loadOptions={debounce(loadOptions, 300) as any}
        onInputChange={handleInputChange}
        onChange={handleChange}
        placeholder="Search repositories..."
        noOptionsMessage={() =>
          inputValue.length > 0
            ? "No repositories found"
            : "Type to search repositories"
        }
        className="repo-select"
        classNamePrefix="repo-select"
        isLoading={searchRepositories.isPending}
      />
    </div>
  );
}
