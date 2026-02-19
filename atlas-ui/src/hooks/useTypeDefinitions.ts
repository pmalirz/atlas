import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { EnumOption } from '@/engine/schema/types';

/**
 * TypeDefinition from the server
 */
export interface TypeDefinition {
    id: string;
    typeKey: string;
    displayName: string;
    baseType: string; // 'string' | 'text' | 'number' | 'decimal' | 'date' | 'datetime' | 'enum'
    options?: EnumOption[]; // For enum types
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    } | null;
}

/**
 * Normalize options to EnumOption[] format.
 */
function normalizeOptions(options: any[] | undefined): EnumOption[] | undefined {
    if (!options) return undefined;
    return options.map(opt => typeof opt === 'string' ? { key: opt } : opt);
}

/**
 * Fetch a single type definition by key
 */
export async function fetchTypeDefinition(typeKey: string): Promise<TypeDefinition> {
    const data = await apiClient.get<TypeDefinition>(`/definitions/types/${typeKey}`);
    return { ...data, options: normalizeOptions(data.options) };
}

/**
 * Fetch all type definitions
 */
export async function fetchAllTypeDefinitions(): Promise<TypeDefinition[]> {
    const data = await apiClient.get<TypeDefinition[]>('/definitions/types');
    return data.map(t => ({ ...t, options: normalizeOptions(t.options) }));
}

/**
 * Hook to fetch a single type definition by key
 */
export function useTypeDefinition(typeKey?: string) {
    const query = useQuery({
        queryKey: ['type-definition', typeKey],
        queryFn: () => fetchTypeDefinition(typeKey!),
        enabled: !!typeKey,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes (rarely changes)
    });

    return {
        typeDefinition: query.data,
        loading: query.isLoading,
        error: query.error,
        options: query.data?.options ?? [],
    };
}

/**
 * Hook to fetch all type definitions (for caching/lookup)
 */
export function useTypeDefinitions() {
    const query = useQuery({
        queryKey: ['type-definitions'],
        queryFn: fetchAllTypeDefinitions,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    return {
        types: query.data ?? [],
        loading: query.isLoading,
        error: query.error,
        getByKey: (typeKey: string) => query.data?.find(t => t.typeKey === typeKey),
    };
}
