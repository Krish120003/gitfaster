"use client";

import { useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import type { SingleValue, ActionMeta } from "react-select";
import { api } from "@/trpc/react";
import type { Repository } from "@/server/api/routers/user";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/hooks/use-debounce";
interface RepositoryOption {
  value: string;
  label: string;
  repository: Repository;
}

export function RepositorySearch() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [allRepositories, setAllRepositories] = useState<Repository[] | null>(
    null
  );

  const searchRepositories = api.user.searchRepositories.useMutation();

  const {
    data: repoData,
    isLoading,
    error,
  } = api.user.getAllRepositories.useQuery();

  useEffect(() => {
    if (repoData) {
      setAllRepositories(repoData);
    }

    if (error) {
      console.error("Error fetching all repositories:", error);
    }
  }, [repoData, error]);

  // Filter repositories on client side
  const filterRepositories = (input: string): RepositoryOption[] => {
    if (!input || !allRepositories) return [];

    const lowercasedInput = input.toLowerCase();

    return allRepositories
      .filter(
        (repo) =>
          repo.name.toLowerCase().includes(lowercasedInput) ||
          (repo.description &&
            repo.description.toLowerCase().includes(lowercasedInput))
      )
      .map((repo) => ({
        value: `${repo.owner.login}/${repo.name}`,
        label: `${repo.owner.login}/${repo.name}`,
        repository: repo,
      }))
      .slice(0, 20); // Limit to 20 results
  };

  // Load options function for AsyncSelect
  const loadOptions = (
    inputValue: string,
    callback: (options: RepositoryOption[]) => void
  ) => {
    // If all repositories are loaded, use client-side filtering
    if (allRepositories) {
      const filteredOptions = filterRepositories(inputValue);
      callback(filteredOptions);
      return;
    }

    // Otherwise, use API-based search
    if (!inputValue) {
      callback([]);
      return;
    }

    searchRepositories
      .mutateAsync({ query: inputValue })
      .then((results) => {
        const options = results.map((repo) => ({
          value: `${repo.owner.login}/${repo.name}`,
          label: `${repo.owner.login}/${repo.name}`,
          repository: repo,
        }));
        callback(options);
      })
      .catch((error) => {
        console.error("Error searching repositories:", error);
        callback([]);
      });
  };

  const debouncedLoadOptions = debounce(loadOptions, 300);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    return newValue;
  };

  const handleChange = (
    selected: SingleValue<RepositoryOption>,
    actionMeta: ActionMeta<RepositoryOption>
  ) => {
    if (selected) {
      router.push(
        `/${selected.repository.owner.login}/${selected.repository.name}`
      );
    }
  };

  return (
    <div className="w-full">
      <AsyncSelect
        cacheOptions
        defaultOptions
        loadOptions={debouncedLoadOptions}
        onInputChange={handleInputChange}
        onChange={handleChange}
        placeholder={"Search repositories..."}
        noOptionsMessage={() =>
          inputValue.length > 0
            ? "No repositories found"
            : "Type to search repositories"
        }
        className="repo-select"
        classNamePrefix="repo-select"
        isLoading={
          searchRepositories.isPending || (isLoading && inputValue.length > 0)
        }
      />
      {allRepositories && (
        <div className="text-xs text-muted-foreground mt-1">
          {allRepositories.length} repositories loaded for instant search
        </div>
      )}
    </div>
  );
}
