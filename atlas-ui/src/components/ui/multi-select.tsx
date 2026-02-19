import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface MultiSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface MultiSelectProps {
    /** Available options to select from */
    options: MultiSelectOption[];
    /** Currently selected values */
    value: string[];
    /** Callback when selection changes */
    onChange: (value: string[]) => void;
    /** Placeholder text when nothing selected */
    placeholder?: string;
    /** Search input placeholder */
    searchPlaceholder?: string;
    /** Maximum height of the options list in pixels */
    maxHeight?: number;
    /** Whether the component is disabled */
    disabled?: boolean;
    /** Custom class name for the trigger button */
    className?: string;
    /** Show "Select All" / "Deselect All" buttons */
    showBulkActions?: boolean;
    /** Custom label for selected count (e.g., "items", "relations") */
    countLabel?: string;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function MultiSelect({
    options,
    value,
    onChange,
    placeholder = "Select items...",
    searchPlaceholder = "Search...",
    maxHeight = 300,
    disabled = false,
    className,
    showBulkActions = true,
    countLabel = "selected",
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
        if (!search.trim()) return options;
        const searchLower = search.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchLower)
        );
    }, [options, search]);

    // Toggle a single option
    const toggleOption = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    // Select all (filtered) options
    const selectAll = () => {
        const filteredValues = filteredOptions
            .filter(opt => !opt.disabled)
            .map(opt => opt.value);
        const newValue = [...new Set([...value, ...filteredValues])];
        onChange(newValue);
    };

    // Deselect all (filtered) options
    const deselectAll = () => {
        const filteredValues = new Set(filteredOptions.map(opt => opt.value));
        onChange(value.filter(v => !filteredValues.has(v)));
    };

    // Clear search when popover closes
    React.useEffect(() => {
        if (!open) setSearch("");
    }, [open]);

    // Display text for trigger
    const displayText = React.useMemo(() => {
        if (value.length === 0) return placeholder;
        if (value.length === options.length) return `All ${countLabel}`;
        return `${value.length} ${countLabel}`;
    }, [value, options.length, placeholder, countLabel]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "justify-between font-normal",
                        !value.length && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">{displayText}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                {/* Search Input */}
                <div className="flex items-center border-b px-3 py-2">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="ml-2 shrink-0 opacity-50 hover:opacity-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Bulk Actions */}
                {showBulkActions && (
                    <div className="flex items-center gap-2 border-b px-3 py-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={selectAll}
                            className="h-7 text-xs"
                        >
                            Select All
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={deselectAll}
                            className="h-7 text-xs"
                        >
                            Deselect All
                        </Button>
                    </div>
                )}

                {/* Options List */}
                <div
                    className="overflow-y-auto"
                    style={{ maxHeight: `${maxHeight}px` }}
                >
                    {filteredOptions.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No results found.
                        </div>
                    ) : (
                        <div className="p-1">
                            {filteredOptions.map((option) => {
                                const isSelected = value.includes(option.value);
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => toggleOption(option.value)}
                                        disabled={option.disabled}
                                        className={cn(
                                            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                                            option.disabled && "cursor-not-allowed opacity-50"
                                        )}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            className="pointer-events-none"
                                        />
                                        <span className="truncate">{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer with count */}
                <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                    {value.length} of {options.length} {countLabel}
                </div>
            </PopoverContent>
        </Popover>
    );
}
