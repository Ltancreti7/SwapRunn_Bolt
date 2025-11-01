import { useState } from "react";
import { Filter, MapPin, DollarSign, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface JobFiltersProps {
  onFiltersChange: (filters: JobFilters) => void;
  totalJobsCount: number;
  filteredJobsCount: number;
}

export interface JobFilters {
  maxDistance: number;
  minPay: number;
  maxPay: number;
  dealerPreference: string;
  jobType: string;
  sortBy: string;
}

const DEFAULT_FILTERS: JobFilters = {
  maxDistance: 50,
  minPay: 0,
  maxPay: 100,
  dealerPreference: "any",
  jobType: "any",
  sortBy: "newest",
};

export function JobFilters({
  onFiltersChange,
  totalJobsCount,
  filteredJobsCount,
}: JobFiltersProps) {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (newFilters: Partial<JobFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  const hasActiveFilters =
    JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filteredJobsCount} of {totalJobsCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Distance Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                Max Distance: {filters.maxDistance} miles
              </span>
            </div>
            <Slider
              value={[filters.maxDistance]}
              onValueChange={([value]) => updateFilters({ maxDistance: value })}
              max={100}
              min={5}
              step={5}
              className="w-full"
            />
          </div>

          {/* Pay Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                Pay Range: ${filters.minPay} - ${filters.maxPay}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Min Pay</label>
                <Slider
                  value={[filters.minPay]}
                  onValueChange={([value]) => updateFilters({ minPay: value })}
                  max={filters.maxPay}
                  min={0}
                  step={5}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Max Pay</label>
                <Slider
                  value={[filters.maxPay]}
                  onValueChange={([value]) => updateFilters({ maxPay: value })}
                  max={200}
                  min={filters.minPay}
                  step={5}
                />
              </div>
            </div>
          </div>

          {/* Dealer Preference */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Dealer Preference</span>
            </div>
            <Select
              value={filters.dealerPreference}
              onValueChange={(value) =>
                updateFilters({ dealerPreference: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dealer preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Dealer</SelectItem>
                <SelectItem value="preferred">
                  Preferred Dealers Only
                </SelectItem>
                <SelectItem value="new">New Dealers</SelectItem>
                <SelectItem value="high-rated">High Rated Dealers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Type Filter */}
          <div className="space-y-3">
            <span className="font-medium">Job Type</span>
            <Select
              value={filters.jobType}
              onValueChange={(value) => updateFilters({ jobType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Type</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="space-y-3">
            <span className="font-medium">Sort By</span>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => updateFilters({ sortBy: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort jobs by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="closest">Closest Distance</SelectItem>
                <SelectItem value="highest-pay">Highest Pay</SelectItem>
                <SelectItem value="urgent">Most Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
