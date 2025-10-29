"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface CollapsibleFiltersProps {
  platforms?: FilterOption[];
  categories?: FilterOption[];
  statuses?: FilterOption[];
  onFilterChange?: (filters: {
    platforms: string[];
    categories: string[];
    statuses: string[];
    search: string;
    sortBy: string;
  }) => void;
  className?: string;
}

export function CollapsibleFilters({
  platforms = [],
  categories = [],
  statuses = [],
  onFilterChange,
  className,
}: CollapsibleFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{
    platforms: boolean;
    categories: boolean;
    statuses: boolean;
  }>({
    platforms: false,
    categories: false,
    statuses: false,
  });
  
  const [filters, setFilters] = useState({
    platforms: [] as string[],
    categories: [] as string[],
    statuses: [] as string[],
    search: "",
    sortBy: "volume",
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleFilter = (
    type: keyof typeof filters,
    value: string
  ) => {
    setFilters(prev => {
      const currentValues = prev[type] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      const newFilters = {
        ...prev,
        [type]: newValues,
      };
      
      onFilterChange?.(newFilters);
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      platforms: [] as string[],
      categories: [] as string[],
      statuses: [] as string[],
      search: "",
      sortBy: "volume",
    };
    setFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  };

  const activeFilterCount = 
    filters.platforms.length + 
    filters.categories.length + 
    filters.statuses.length + 
    (filters.search ? 1 : 0);

  return (
    <div className={cn("lg:hidden", className)}>
      {/* Mobile Filter Toggle */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Collapsible Filter Panel */}
      {isOpen && (
        <div className="border-b bg-card">
          <div className="p-4 space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Markets</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={filters.search}
                  onChange={(e) => {
                    const newFilters = { ...filters, search: e.target.value };
                    setFilters(newFilters);
                    onFilterChange?.(newFilters);
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                />
              </div>
            </div>

            {/* Platforms */}
            {platforms.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <Button
                    variant="ghost"
                    className="justify-between p-0 h-auto"
                    onClick={() => toggleSection("platforms")}
                  >
                    <CardTitle className="text-sm">Platforms</CardTitle>
                    {expandedSections.platforms ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                {expandedSections.platforms && (
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {platforms.map((platform) => (
                        <Button
                          key={platform.id}
                          variant={filters.platforms.includes(platform.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleFilter("platforms", platform.id)}
                          className="text-xs"
                        >
                          {platform.label}
                          {platform.count && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {platform.count}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <Button
                    variant="ghost"
                    className="justify-between p-0 h-auto"
                    onClick={() => toggleSection("categories")}
                  >
                    <CardTitle className="text-sm">Categories</CardTitle>
                    {expandedSections.categories ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                {expandedSections.categories && (
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant={filters.categories.includes(category.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleFilter("categories", category.id)}
                          className="text-xs"
                        >
                          {category.label}
                          {category.count && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {category.count}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Status */}
            {statuses.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <Button
                    variant="ghost"
                    className="justify-between p-0 h-auto"
                    onClick={() => toggleSection("statuses")}
                  >
                    <CardTitle className="text-sm">Status</CardTitle>
                    {expandedSections.statuses ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                {expandedSections.statuses && (
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {statuses.map((status) => (
                        <Button
                          key={status.id}
                          variant={filters.statuses.includes(status.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleFilter("statuses", status.id)}
                          className="text-xs"
                        >
                          {status.label}
                          {status.count && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {status.count}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Sort Options */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sort By</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "volume", label: "Volume", icon: DollarSign },
                    { id: "trending", label: "Trending", icon: TrendingUp },
                    { id: "newest", label: "Newest", icon: Calendar },
                    { id: "ending", label: "Ending Soon", icon: Calendar },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.id}
                        variant={filters.sortBy === option.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newFilters = { ...filters, sortBy: option.id };
                          setFilters(newFilters);
                          onFilterChange?.(newFilters);
                        }}
                        className="text-xs justify-start"
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
