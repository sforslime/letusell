"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils/cn";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export function SearchBar({ className, placeholder = "Search vendors or dishes..." }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function navigate(query: string) {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    // Homepage → dedicated search results page; /vendors → filter in place
    const targetPath = pathname === "/" ? "/search" : pathname;
    startTransition(() => {
      router.push(query ? `${targetPath}?${params.toString()}` : targetPath);
    });
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate(value.trim());
  }

  function handleClear() {
    setValue("");
    navigate("");
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search
        className={cn(
          "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400",
          isPending && "animate-pulse"
        )}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
