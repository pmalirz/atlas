import { auroraVeilShader } from './presets/aurora-veil';
import { neonDripShader } from './presets/neon-drip';
import type { ShaderPreset } from './types';

const shaderPresets: Map<string, ShaderPreset> = new Map();

[auroraVeilShader, neonDripShader].forEach((shader) => {
    shaderPresets.set(shader.id, shader);
});

export function getShaderPreset(id: string): ShaderPreset | undefined {
    return shaderPresets.get(id);
}

export function getAllShaderPresets(): ShaderPreset[] {
    return Array.from(shaderPresets.values());
}
