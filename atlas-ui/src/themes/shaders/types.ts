import type { ThemeShaderSlots } from '../types';

export type ThemeShaderSlotName = keyof ThemeShaderSlots;

export interface ShaderPreset {
    id: string;
    label: string;
    vertexSource: string;
    fragmentSource: string;
    /** Optional default uniform values for this shader. Renderer will use these if present. */
    defaults?: Record<string, number | number[]>;
}
