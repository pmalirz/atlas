import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, formatDistanceToNow } from 'date-fns';
import { icons, type LucideIcon, LayoutDashboard } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const INVALID_DATE_TEXT = 'Invalid date';
const MS_PER_DAY = 86400000;

/**
 * Safe parse a date
 */
export function safeParseDate(date: Date | string): Date | null {
    if (date instanceof Date) {
        return isValid(date) ? date : null;
    }
    const d = new Date(date);
    return isValid(d) ? d : null;
}

/**
 * Generic helper for formatting dates safely
 */
function formatSafe(date: Date | string, formatStr: string): string {
    const d = safeParseDate(date);
    if (!d) {
        return INVALID_DATE_TEXT;
    }
    return format(d, formatStr);
}

/**
 * Format a Date object to "yyyy-MM-dd HH:mm" format
 */
export function formatDateTime(date: Date | string): string {
    return formatSafe(date, 'yyyy-MM-dd HH:mm');
}

/**
 * Format a Date object to "yyyy-MM-dd" format (date only)
 */
export function formatDate(date: Date | string): string {
    return formatSafe(date, 'yyyy-MM-dd');
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
    const d = safeParseDate(date);
    if (!d) {
        return INVALID_DATE_TEXT;
    }

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / MS_PER_DAY);

    if (diffDays >= 7) {
        return formatDate(d);
    }

    return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format a label from kebab-case or snake_case to Title Case
 */
export function formatLabel(value: string): string {
    if (!value) return '';
    return value
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get a Lucide icon component by name.
 * Falls back to a generic icon if not found.
 */
export function toLucideIcon(iconName?: string, defaultIcon: LucideIcon = LayoutDashboard): LucideIcon {
    if (!iconName) return defaultIcon;

    // Convert icon name to PascalCase (e.g., "app-window" -> "AppWindow")
    const pascalCase = iconName
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    return (icons as Record<string, LucideIcon>)[pascalCase] || defaultIcon;
}

/**
 * Sort an array of objects by a specific field
 */
export function sortEntities<T>(
    entities: T[],
    sortConfig?: { field: keyof T; direction: 'asc' | 'desc' }
): T[] {
    if (!sortConfig) return [...entities];

    return [...entities].sort((a, b) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];

        if (aVal === bVal) return 0;

        // Handle nulls/undefined: place them at the end
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let comparison: number;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
            comparison = aVal.getTime() - bVal.getTime();
        } else {
            // Fallback for other types
            comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
}
