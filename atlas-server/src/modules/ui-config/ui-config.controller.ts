import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UIConfigService } from './ui-config.service';

import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('ui-config')
@Controller(':slug/ui-config')
@UseGuards(AuthGuard)
export class UIConfigController {
    constructor(private readonly uiConfigService: UIConfigService) { }

    // ─────────────────────────────────────────────────────────────
    // UI Entity Configs
    // ─────────────────────────────────────────────────────────────

    @Get('entities')
    @ApiOperation({ summary: 'Get all UI entity configurations' })
    @ApiResponse({ status: 200, description: 'List of all UI entity configurations' })
    async getAllUIEntityConfigs() {
        return this.uiConfigService.getAllUIEntityConfigs();
    }

    @Get('entities/:entityType')
    @ApiOperation({ summary: 'Get UI entity configuration by type' })
    @ApiParam({ name: 'entityType', description: 'Entity type (e.g., application, interface)' })
    @ApiResponse({ status: 200, description: 'UI entity configuration with browse and detail config' })
    @ApiResponse({ status: 404, description: 'UI configuration not found' })
    async getUIEntityConfig(@Param('entityType') entityType: string) {
        return this.uiConfigService.getUIEntityConfig(entityType);
    }

    // ─────────────────────────────────────────────────────────────
    // Global Config
    // ─────────────────────────────────────────────────────────────

    @Get('global')
    @ApiOperation({ summary: 'Get global UI configuration' })
    @ApiResponse({ status: 200, description: 'Global UI configuration' })
    async getGlobalConfig() {
        return this.uiConfigService.getGlobalConfig();
    }

    // ─────────────────────────────────────────────────────────────
    // Menu Configuration
    // ─────────────────────────────────────────────────────────────

    @Get('menu')
    @ApiOperation({ summary: 'Get menu configuration' })
    @ApiResponse({ status: 200, description: 'Menu configuration with items' })
    async getMenuConfig() {
        return this.uiConfigService.getMenuConfig();
    }
}
