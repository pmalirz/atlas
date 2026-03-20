import type { ThemeShaderSlots } from '../types';

export type ThemeShaderSlotName = keyof ThemeShaderSlots;

export interface ShaderPreset {
    id: string;
    label: string;
    vertexSource: string;
    fragmentSource: string;
}
