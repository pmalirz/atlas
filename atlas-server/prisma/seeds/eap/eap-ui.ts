import { PrismaClient } from '@prisma/client';
import {
    UIEntityConfigDataSchema,
    MenuConfigSchema
} from 'atlas-shared/zod';
import { DEFAULT_TENANT_ID } from '../default-tenant';


/**
 * Seed UI Configuration for atlas-ui dynamic pages
 * Showcases all UI engine capabilities: layouts, sections, value styles, etc.
 */
export async function seedUI(prisma: PrismaClient, tenantId: string = DEFAULT_TENANT_ID) {
    console.log('🎨 Seeding UI Configuration...');

    // Cleanup UI Configs
    await prisma.uIEntityConfig.deleteMany({});
    await prisma.uIGlobalConfig.deleteMany({});

    const uiConfigs = [
        // =========================================================================
        // APPLICATION UI SCHEMA - Full showcase of all capabilities
        // =========================================================================
        {
            entityType: 'application',
            version: 1,
            browseConfig: {
                title: 'Applications',
                description: 'Enterprise application portfolio management',
                defaultView: 'tile',
                allowCreate: true,
                views: {
                    tile: {
                        enabled: true,
                        layout: { columns: 3 },
                        fields: [
                            { field: 'name', role: 'title' },
                            { field: 'department', role: 'subtitle' },
                            { field: 'description', role: 'description' },
                            { field: 'status', role: 'badge', format: 'badge' },
                            { field: 'criticality', role: 'badge', format: 'badge' },
                            { field: 'updatedAt', role: 'footer', format: 'relative' },
                        ],
                    },
                    table: {
                        enabled: true,
                        columns: [
                            { field: 'name', header: 'Name', sortable: true },
                            { field: 'department', header: 'Department', sortable: true },
                            { field: 'status', header: 'Status', format: 'badge' },
                            { field: 'criticality', header: 'Criticality', format: 'badge' },
                            { field: 'businessImpact', header: 'Impact', format: 'badge' },
                            { field: 'updatedAt', header: 'Updated', format: 'relative', sortable: true },
                        ],
                    },
                },
            },
            detailConfig: {
                headerFields: ['name', 'status', 'criticality'],
                sections: [
                    // ─────────────────────────────────────────────────────────────
                    // SECTION 1: Basic Information (Card with 2 columns)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'basic',
                        title: 'Basic Information',
                        description: 'Core application details',
                        type: 'card',
                        layout: { columns: 2, gap: 4 },
                        fields: [
                            { field: 'name', column: 1, label: 'Application Name' },
                            { field: 'version', column: 2 },
                            { field: 'description', column: 1, columnSpan: 2 },
                            { field: 'department', column: 1 },
                            { field: 'documentation', column: 2, label: 'Documentation URL' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 2: Classification (Card with 3 columns + value styles)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'classification',
                        title: 'Classification',
                        description: 'Status, criticality and strategic assessment',
                        type: 'card',
                        layout: { columns: 3 },
                        fields: [
                            {
                                field: 'status',
                                column: 1,
                                valueStyles: {
                                    active: { label: 'Active', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
                                    deprecated: { label: 'Deprecated', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
                                    'in-development': { label: 'In Development', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
                                    retired: { label: 'Retired', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
                                },
                            },
                            {
                                field: 'criticality',
                                column: 2,
                                valueStyles: {
                                    low: { label: 'Low', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
                                    medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                                    high: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
                                    critical: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
                                },
                            },
                            {
                                field: 'businessImpact',
                                column: 3,
                                label: 'Business Impact',
                                valueStyles: {
                                    none: { label: 'None', color: 'bg-slate-100 text-slate-600' },
                                    minor: { label: 'Minor', color: 'bg-green-100 text-green-700' },
                                    moderate: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' },
                                    major: { label: 'Major', color: 'bg-orange-100 text-orange-700' },
                                    catastrophic: { label: 'Catastrophic', color: 'bg-red-100 text-red-700' },
                                },
                            },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 3: Strategic Assessment (Collapsible)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'strategic',
                        title: 'Strategic Assessment',
                        description: 'TIME model evaluation',
                        type: 'collapsible',
                        layout: { columns: 3 },
                        fields: [
                            { field: 'functionalFit', column: 1, label: 'Functional Fit (1-5)', component: 'field:star_rating' },
                            { field: 'technicalFit', column: 2, label: 'Technical Fit (1-5)', component: 'field:star_rating' },
                            {
                                field: 'timeClassification',
                                column: 3,
                                label: 'TIME Classification',
                                valueStyles: {
                                    tolerate: { label: 'Tolerate', color: 'bg-gray-100 text-gray-700' },
                                    invest: { label: 'Invest', color: 'bg-green-100 text-green-700' },
                                    migrate: { label: 'Migrate', color: 'bg-yellow-100 text-yellow-700' },
                                    eliminate: { label: 'Eliminate', color: 'bg-red-100 text-red-700' },
                                },
                            },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SEPARATOR
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'security-separator',
                        title: 'Security & Compliance',
                        type: 'separator',
                        layout: { columns: 1 },
                        fields: [],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 4: CIA+A Ratings (Card with 4 columns - compact grid)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'cia',
                        title: 'CIA+A Security Ratings',
                        description: 'Confidentiality, Integrity, Availability, Authenticity',
                        type: 'card',
                        layout: { columns: 4 },
                        fields: [
                            {
                                field: 'confidentiality',
                                column: 1,
                                label: 'Confidentiality',
                                valueStyles: {
                                    low: { label: 'Low', color: 'bg-green-100 text-green-700' },
                                    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
                                    high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
                                    critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
                                },
                            },
                            {
                                field: 'integrity',
                                column: 2,
                                label: 'Integrity',
                                valueStyles: {
                                    low: { label: 'Low', color: 'bg-green-100 text-green-700' },
                                    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
                                    high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
                                    critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
                                },
                            },
                            {
                                field: 'availability',
                                column: 3,
                                label: 'Availability',
                                valueStyles: {
                                    low: { label: 'Low', color: 'bg-green-100 text-green-700' },
                                    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
                                    high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
                                    critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
                                },
                            },
                            {
                                field: 'authenticity',
                                column: 4,
                                label: 'Authenticity',
                                valueStyles: {
                                    low: { label: 'Low', color: 'bg-green-100 text-green-700' },
                                    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
                                    high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
                                    critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
                                },
                            },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 5: Business Impact Analysis (Collapsible, 3 columns)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'bia',
                        title: 'Business Impact Analysis',
                        description: 'Recovery objectives and financial impact',
                        type: 'collapsible',
                        layout: { columns: 3 },
                        fields: [
                            // Recovery Requirements
                            { field: 'rtoRequired', column: 1, label: 'RTO Required (hours)' },
                            { field: 'rpoRequired', column: 2, label: 'RPO Required (hours)' },
                            { field: 'mtpdRequired', column: 3, label: 'MTPD Required (hours)' },
                            // Recovery Capabilities
                            { field: 'rtoCapability', column: 1, label: 'RTO Capability (hours)' },
                            { field: 'rpoCapability', column: 2, label: 'RPO Capability (hours)' },
                            { field: 'mtpdCapability', column: 3, label: 'MTPD Capability (hours)' },
                            // Financial Impact
                            { field: 'financialImpactPerHour', column: 1, columnSpan: 2, label: 'Financial Impact ($/hour)' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 6: DORA Compliance (Collapsible, 2 columns)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'dora',
                        title: 'DORA Compliance',
                        description: 'Digital Operational Resilience Act requirements',
                        type: 'collapsible',
                        layout: { columns: 2 },
                        fields: [
                            {
                                field: 'testingFrequency',
                                column: 1,
                                label: 'Testing Frequency',
                                valueStyles: {
                                    monthly: { label: 'Monthly', color: 'bg-green-100 text-green-700' },
                                    quarterly: { label: 'Quarterly', color: 'bg-blue-100 text-blue-700' },
                                    'semi-annually': { label: 'Semi-Annually', color: 'bg-yellow-100 text-yellow-700' },
                                    annually: { label: 'Annually', color: 'bg-orange-100 text-orange-700' },
                                    'not-tested': { label: 'Not Tested', color: 'bg-red-100 text-red-700' },
                                },
                            },
                            { field: 'lastTestedDate', column: 2, label: 'Last Tested' },
                            { field: 'recoveryProcedureDoc', column: 1, columnSpan: 2, label: 'Recovery Procedure Doc' },
                            { field: 'alternativeProcedure', column: 1, columnSpan: 2, label: 'Alternative Procedure' },
                            { field: 'isOutsourced', column: 1, label: 'Outsourced?' },
                            { field: 'thirdPartyProvider', column: 2, label: 'Third-Party Provider' },
                            { field: 'exitStrategy', column: 1, columnSpan: 2, label: 'Exit Strategy' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 7: CRA Compliance (Collapsible, 2 columns)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'cra',
                        title: 'CRA Compliance',
                        description: 'Cyber Resilience Act requirements',
                        type: 'collapsible',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'securityContact', column: 1, label: 'Security Contact' },
                            { field: 'patchingFrequency', column: 2, label: 'Patching Frequency' },
                            { field: 'vulnerabilityDisclosure', column: 1, columnSpan: 2, label: 'Vulnerability Disclosure URL' },
                            { field: 'sbomAvailable', column: 1, label: 'SBOM Available?' },
                            { field: 'lastSecurityAssessment', column: 2, label: 'Last Security Assessment' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 8: Regulatory (Card, 1 column for text areas)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'regulatory',
                        title: 'Regulatory Compliance',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'regulatoryScope', column: 1, label: 'Regulatory Scope' },
                            { field: 'dataResidency', column: 2, label: 'Data Residency' },
                            { field: 'complianceNotes', column: 1, columnSpan: 2, label: 'Compliance Notes' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SEPARATOR - Relations
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'relations-separator',
                        title: 'Relationships',
                        type: 'separator',
                        layout: { columns: 1 },
                        fields: [],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 9: Ownership (Card, 2 columns)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'ownership',
                        title: 'Ownership',
                        description: 'Application owners and stakeholders',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'ownerships', column: 1, columnSpan: 2, label: 'Owners' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 10: Technology Stack (Card)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'techstack',
                        title: 'Technology Stack',
                        description: 'Technologies and frameworks used',
                        type: 'card',
                        layout: { columns: 1 },
                        fields: [
                            { field: 'usesTechnologies', column: 1, label: 'Technologies' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 11: Infrastructure (Collapsible)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'infrastructure',
                        title: 'Infrastructure',
                        description: 'IT assets and hosting',
                        type: 'collapsible',
                        layout: { columns: 1 },
                        fields: [
                            { field: 'usesAssets', column: 1, label: 'IT Assets' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 12: Business Context (Collapsible)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'business',
                        title: 'Business Context',
                        description: 'Capabilities and data objects',
                        type: 'collapsible',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'supportsCapabilities', column: 1, label: 'Business Capabilities' },
                            { field: 'managesData', column: 2, label: 'Data Objects' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 13: Integration (Card)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'integration',
                        title: 'Integration',
                        description: 'Interfaces and APIs',
                        type: 'card',
                        layout: { columns: 1 },
                        fields: [
                            { field: 'ownedInterfaces', column: 1, label: 'Owned Interfaces' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 14: Relationship Map (Widget)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'relation-graph',
                        title: 'Relationship Map',
                        description: 'Visual representation of entity connections',
                        type: 'widget',
                        component: 'widget:relation_graph',
                        layout: { columns: 1 },
                        fields: [],
                    },
                ],
            },
        },

        // =========================================================================
        // IT ASSET UI SCHEMA
        // =========================================================================
        {
            entityType: 'it_asset',
            version: 1,
            browseConfig: {
                title: 'IT Assets',
                description: 'Hardware and software assets',
                defaultView: 'tile',
                allowCreate: true,
                views: {
                    tile: {
                        enabled: true,
                        layout: { columns: 4 },
                        fields: [
                            { field: 'name', role: 'title' },
                            { field: 'type', role: 'subtitle' },
                            { field: 'description', role: 'description' },
                            { field: 'status', role: 'badge', format: 'badge' },
                        ],
                    },
                    table: {
                        enabled: true,
                        columns: [
                            { field: 'name', header: 'Name', sortable: true },
                            { field: 'type', header: 'Type', format: 'badge' },
                            { field: 'status', header: 'Status', format: 'badge' },
                            { field: 'hostingType', header: 'Hosting' },
                            { field: 'updatedAt', header: 'Updated', format: 'relative', sortable: true },
                        ],
                    },
                },
            },
            detailConfig: {
                headerFields: ['name', 'type', 'status'],
                sections: [
                    {
                        id: 'basic',
                        title: 'Basic Information',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'name', column: 1 },
                            {
                                field: 'type', column: 2, valueStyles: {
                                    server: { label: 'Server', color: 'bg-slate-100 text-slate-700' },
                                    database: { label: 'Database', color: 'bg-blue-100 text-blue-700' },
                                    storage: { label: 'Storage', color: 'bg-gray-100 text-gray-700' },
                                    network: { label: 'Network', color: 'bg-indigo-100 text-indigo-700' },
                                    'cloud-service': { label: 'Cloud Service', color: 'bg-sky-100 text-sky-700' },
                                }
                            },
                            { field: 'description', column: 1, columnSpan: 2 },
                            {
                                field: 'status', column: 1, valueStyles: {
                                    online: { label: 'Online', color: 'bg-green-100 text-green-700' },
                                    offline: { label: 'Offline', color: 'bg-red-100 text-red-700' },
                                    maintenance: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-700' },
                                }
                            },
                            { field: 'location', column: 2 },
                        ],
                    },
                    {
                        id: 'hosting',
                        title: 'Hosting Details',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            {
                                field: 'hostingType', column: 1, valueStyles: {
                                    'on-premise': { label: 'On-Premise', color: 'bg-slate-100 text-slate-700' },
                                    'public-cloud': { label: 'Public Cloud', color: 'bg-blue-100 text-blue-700' },
                                    'private-cloud': { label: 'Private Cloud', color: 'bg-indigo-100 text-indigo-700' },
                                    hybrid: { label: 'Hybrid', color: 'bg-purple-100 text-purple-700' },
                                    'co-location': { label: 'Co-location', color: 'bg-emerald-100 text-emerald-700' },
                                }
                            },
                            {
                                field: 'environment', column: 2, valueStyles: {
                                    production: { label: 'Production', color: 'bg-red-100 text-red-700' },
                                    staging: { label: 'Staging', color: 'bg-orange-100 text-orange-700' },
                                    development: { label: 'Development', color: 'bg-green-100 text-green-700' },
                                    'disaster-recovery': { label: 'DR', color: 'bg-red-100 text-red-700' },
                                    test: { label: 'Test', color: 'bg-blue-100 text-blue-700' },
                                }
                            },
                        ],
                    },
                    {
                        id: 'relations',
                        title: 'Relationships',
                        type: 'separator',
                        layout: { columns: 1 },
                        fields: [],
                    },
                    {
                        id: 'dependencies',
                        title: 'Dependencies',
                        type: 'card',
                        layout: { columns: 1 },
                        fields: [
                            { field: 'dependsOn', column: 1, label: 'Depends On' },
                        ],
                    },
                    {
                        id: 'usage',
                        title: 'Usage',
                        type: 'card',
                        layout: { columns: 1 },
                        fields: [
                            { field: 'usedByApplications', column: 1, label: 'Supported Applications' },
                        ],
                    },
                ],
            },
        },

        // =========================================================================
        // INTERFACE UI SCHEMA
        // =========================================================================
        {
            entityType: 'interface',
            version: 1,
            browseConfig: {
                title: 'Interfaces',
                description: 'API and integration interfaces',
                defaultView: 'table',
                allowCreate: true,
                views: {
                    tile: {
                        enabled: true,
                        layout: { columns: 3 },
                        fields: [
                            { field: 'name', role: 'title' },
                            { field: 'protocol', role: 'subtitle' },
                            { field: 'description', role: 'description' },
                            { field: 'type', role: 'badge', format: 'badge' },
                            { field: 'slaLevel', role: 'badge', format: 'badge' },
                        ],
                    },
                    table: {
                        enabled: true,
                        columns: [
                            { field: 'name', header: 'Name', sortable: true },
                            { field: 'type', header: 'Type', format: 'badge' },
                            { field: 'protocol', header: 'Protocol' },
                            { field: 'frequency', header: 'Frequency' },
                            { field: 'slaLevel', header: 'SLA', format: 'badge' },
                            { field: 'status', header: 'Status', format: 'badge' },
                        ],
                    },
                },
            },
            detailConfig: {
                headerFields: ['name', 'type', 'status'],
                sections: [
                    {
                        id: 'general',
                        title: 'Interface Details',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'name', column: 1 },
                            {
                                field: 'type',
                                column: 2,
                                valueStyles: {
                                    api: { label: 'API', color: 'bg-blue-100 text-blue-700' },
                                    'file-transfer': { label: 'File Transfer', color: 'bg-green-100 text-green-700' },
                                    database: { label: 'Database', color: 'bg-purple-100 text-purple-700' },
                                    'message-queue': { label: 'Message Queue', color: 'bg-orange-100 text-orange-700' },
                                    webhook: { label: 'Webhook', color: 'bg-cyan-100 text-cyan-700' },
                                },
                            },
                            { field: 'description', column: 1, columnSpan: 2 },
                            { field: 'protocol', column: 1 },
                            { field: 'frequency', column: 2 },
                            {
                                field: 'slaLevel',
                                column: 1,
                                label: 'SLA Level',
                                valueStyles: {
                                    gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-700' },
                                    silver: { label: 'Silver', color: 'bg-slate-100 text-slate-700' },
                                    bronze: { label: 'Bronze', color: 'bg-orange-100 text-orange-700' },
                                },
                            },
                            {
                                field: 'status',
                                column: 2,
                                valueStyles: {
                                    active: { label: 'Active', color: 'bg-green-100 text-green-700' },
                                    planned: { label: 'Planned', color: 'bg-blue-100 text-blue-700' },
                                    deprecated: { label: 'Deprecated', color: 'bg-red-100 text-red-700' },
                                },
                            },
                        ],
                    },
                    {
                        id: 'connections',
                        title: 'Connections',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'ownerApp', column: 1, label: 'Owner Application' },
                            { field: 'connections', column: 2, label: 'Connected Applications' },
                            { field: 'transfersData', column: 1, columnSpan: 2, label: 'Data Objects Transferred' },
                        ],
                    },
                ],
            },
        },

        // =========================================================================
        // DATA OBJECT UI SCHEMA
        // =========================================================================
        {
            entityType: 'data_object',
            version: 1,
            browseConfig: {
                title: 'Data Objects',
                description: 'Enterprise data entities and objects',
                defaultView: 'table',
                allowCreate: true,
                views: {
                    tile: {
                        enabled: true,
                        layout: { columns: 3 },
                        fields: [
                            { field: 'name', role: 'title' },
                            { field: 'category', role: 'subtitle' },
                            { field: 'description', role: 'description' },
                            { field: 'classification', role: 'badge', format: 'badge' },
                        ],
                    },
                    table: {
                        enabled: true,
                        columns: [
                            { field: 'name', header: 'Name', sortable: true },
                            { field: 'category', header: 'Category', format: 'badge' },
                            { field: 'classification', header: 'Classification', format: 'badge' },
                            { field: 'owner', header: 'Owner' },
                            { field: 'isPersonalData', header: 'PII', format: 'badge' },
                        ],
                    },
                },
            },
            detailConfig: {
                headerFields: ['name', 'classification'],
                sections: [
                    {
                        id: 'basic',
                        title: 'Data Object Details',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'name', column: 1 },
                            { field: 'owner', column: 2 },
                            { field: 'description', column: 1, columnSpan: 2 },
                            {
                                field: 'category',
                                column: 1,
                                valueStyles: {
                                    'master-data': { label: 'Master Data', color: 'bg-purple-100 text-purple-700' },
                                    transactional: { label: 'Transactional', color: 'bg-blue-100 text-blue-700' },
                                    reference: { label: 'Reference', color: 'bg-green-100 text-green-700' },
                                    analytical: { label: 'Analytical', color: 'bg-orange-100 text-orange-700' },
                                    operational: { label: 'Operational', color: 'bg-slate-100 text-slate-700' },
                                },
                            },
                            {
                                field: 'classification',
                                column: 2,
                                valueStyles: {
                                    public: { label: 'Public', color: 'bg-green-100 text-green-700' },
                                    internal: { label: 'Internal', color: 'bg-blue-100 text-blue-700' },
                                    confidential: { label: 'Confidential', color: 'bg-orange-100 text-orange-700' },
                                    restricted: { label: 'Restricted', color: 'bg-red-100 text-red-700' },
                                },
                            },
                        ],
                    },
                    {
                        id: 'cia',
                        title: 'Security Ratings',
                        type: 'card',
                        layout: { columns: 4 },
                        fields: [
                            { field: 'confidentiality', column: 1 },
                            { field: 'integrity', column: 2 },
                            { field: 'availability', column: 3 },
                            { field: 'authenticity', column: 4 },
                        ],
                    },
                    {
                        id: 'regulatory',
                        title: 'Regulatory',
                        type: 'collapsible',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'isPersonalData', column: 1, label: 'Personal Data (PII)?' },
                            { field: 'dataResidency', column: 2 },
                            { field: 'regulatoryScope', column: 1 },
                            { field: 'retentionPeriodDays', column: 2, label: 'Retention (days)' },
                        ],
                    },
                ],
            },
        },

        // =========================================================================
        // TECHNOLOGY UI SCHEMA
        // =========================================================================
        {
            entityType: 'technology',
            version: 1,
            browseConfig: {
                title: 'Technologies',
                description: 'Technology radar and standards',
                defaultView: 'tile',
                allowCreate: true,
                views: {
                    tile: {
                        enabled: true,
                        layout: { columns: 4 },
                        fields: [
                            { field: 'name', role: 'title' },
                            { field: 'type', role: 'subtitle' },
                            { field: 'description', role: 'description' },
                            { field: 'recommendation', role: 'badge', format: 'badge' },
                        ],
                    },
                    table: {
                        enabled: true,
                        columns: [
                            { field: 'name', header: 'Name', sortable: true },
                            { field: 'type', header: 'Type', format: 'badge' },
                            { field: 'recommendation', header: 'Recommendation', format: 'badge' },
                            { field: 'version', header: 'Version' },
                            { field: 'vendor', header: 'Vendor' },
                        ],
                    },
                },
            },
            detailConfig: {
                headerFields: ['name', 'recommendation'],
                sections: [
                    {
                        id: 'basic',
                        title: 'Technology Details',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'name', column: 1 },
                            {
                                field: 'type',
                                column: 2,
                                valueStyles: {
                                    language: { label: 'Language', color: 'bg-blue-100 text-blue-700' },
                                    framework: { label: 'Framework', color: 'bg-purple-100 text-purple-700' },
                                    library: { label: 'Library', color: 'bg-green-100 text-green-700' },
                                    tool: { label: 'Tool', color: 'bg-orange-100 text-orange-700' },
                                    platform: { label: 'Platform', color: 'bg-cyan-100 text-cyan-700' },
                                    database: { label: 'Database', color: 'bg-red-100 text-red-700' },
                                    runtime: { label: 'Runtime', color: 'bg-yellow-100 text-yellow-700' },
                                },
                            },
                            { field: 'description', column: 1, columnSpan: 2 },
                            {
                                field: 'recommendation',
                                column: 1,
                                valueStyles: {
                                    adopt: { label: 'Adopt ✓', color: 'bg-green-100 text-green-700' },
                                    trial: { label: 'Trial', color: 'bg-blue-100 text-blue-700' },
                                    assess: { label: 'Assess', color: 'bg-yellow-100 text-yellow-700' },
                                    hold: { label: 'Hold ✗', color: 'bg-red-100 text-red-700' },
                                },
                            },
                            { field: 'version', column: 2 },
                            { field: 'vendor', column: 1 },
                            { field: 'license', column: 2 },
                            { field: 'website', column: 1, columnSpan: 2 },
                            { field: 'tags', column: 1, columnSpan: 2 },
                        ],
                    },
                ],
            },
        },

        // =========================================================================
        // PROCESS UI SCHEMA
        // =========================================================================
        {
            entityType: 'process',
            version: 1,
            browseConfig: {
                title: 'Business Processes',
                description: 'Enterprise process portfolio',
                defaultView: 'table',
                allowCreate: true,
                views: {
                    tile: {
                        enabled: true,
                        layout: { columns: 3 },
                        fields: [
                            { field: 'name', role: 'title' },
                            { field: 'type', role: 'subtitle' },
                            { field: 'description', role: 'description' },
                            { field: 'status', role: 'badge', format: 'badge' },
                            { field: 'criticality', role: 'badge', format: 'badge' },
                        ],
                    },
                    table: {
                        enabled: true,
                        columns: [
                            { field: 'name', header: 'Name', sortable: true },
                            { field: 'type', header: 'Type', format: 'badge' },
                            { field: 'owner', header: 'Owner' },
                            { field: 'status', header: 'Status', format: 'badge' },
                            { field: 'criticality', header: 'Criticality', format: 'badge' },
                        ],
                    },
                },
            },
            detailConfig: {
                headerFields: ['name', 'status'],
                sections: [
                    {
                        id: 'basic',
                        title: 'Process Details',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'name', column: 1 },
                            { field: 'owner', column: 2 },
                            { field: 'description', column: 1, columnSpan: 2 },
                            { field: 'type', column: 1 },
                            { field: 'status', column: 2 },
                            { field: 'criticality', column: 1 },
                            { field: 'automationLevel', column: 2 },
                        ],
                    },
                    {
                        id: 'bia',
                        title: 'Business Impact Analysis',
                        type: 'collapsible',
                        layout: { columns: 3 },
                        fields: [
                            { field: 'rto', column: 1, label: 'RTO (hours)' },
                            { field: 'rpo', column: 2, label: 'RPO (hours)' },
                            { field: 'mtpd', column: 3, label: 'MTPD (hours)' },
                            { field: 'businessImpact', column: 1, label: 'Business Impact' },
                            { field: 'financialImpactPerHour', column: 2, columnSpan: 2, label: 'Financial Impact ($/hour)' },
                        ],
                    },
                ],
            },
        },

        // =========================================================================
        // USER UI SCHEMA
        // =========================================================================
        {
            entityType: 'user',
            version: 1,
            browseConfig: {
                title: 'Users',
                description: 'System users and stakeholders',
                defaultView: 'tile',
                allowCreate: true,
                views: {
                    tile: {
                        enabled: true,
                        layout: { columns: 4 },
                        fields: [
                            { field: 'name', role: 'title' },
                            { field: 'role', role: 'subtitle' },
                            { field: 'email', role: 'description' },
                        ],
                    },
                    table: {
                        enabled: true,
                        columns: [
                            { field: 'name', header: 'Name', sortable: true },
                            { field: 'email', header: 'Email' },
                            { field: 'role', header: 'Role' },
                            { field: 'lastLogin', header: 'Last Login', format: 'relative' },
                        ],
                    },
                },
            },
            detailConfig: {
                headerFields: ['name', 'role'],
                sections: [
                    {
                        id: 'basic',
                        title: 'User Profile',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'firstName', column: 1 },
                            { field: 'lastName', column: 2 },
                            { field: 'email', column: 1, columnSpan: 2 },
                            { field: 'role', column: 1 },
                            { field: 'lastLogin', column: 2 },
                            { field: 'description', column: 1, columnSpan: 2 },
                        ],
                    },
                ],
            },
        },
    ];

    for (const config of uiConfigs) {
        // Validate UI configuration against schema
        UIEntityConfigDataSchema.parse(config);

        await prisma.uIEntityConfig.upsert({
            where: { ui_entity_config_type_tenant_unique: { entityType: config.entityType, tenantId } },
            update: {
                version: config.version,
                browseConfig: config.browseConfig as any,
                detailConfig: config.detailConfig as any,
            },
            create: { ...config, tenantId } as any,
        });
    }

    console.log(`    Created ${uiConfigs.length} UI entity configs`);

    // =========================================================================
    // UI Global Config - Menu Configuration
    // =========================================================================
    console.log('  Seeding UI Global Config...');

    const menuConfig = {
        items: [
            { entityType: 'application', displayName: 'Applications', icon: 'app-window', visible: true },
            { entityType: 'it_asset', displayName: 'IT Assets', icon: 'server', visible: true },
            { entityType: 'interface', displayName: 'Interfaces', icon: 'plug', visible: true },
            { entityType: 'data_object', displayName: 'Data Objects', icon: 'database', visible: true },
            { entityType: 'technology', displayName: 'Technologies', icon: 'cpu', visible: true },
            { entityType: 'process', displayName: 'Processes', icon: 'workflow', visible: true },
            { entityType: 'user', displayName: 'Users', icon: 'users', visible: true },
        ],
    };

    // Validate menu configuration against schema
    MenuConfigSchema.parse(menuConfig);

    // Singleton pattern - upsert by finding first or creating
    const existingConfig = await prisma.uIGlobalConfig.findFirst({ where: { tenantId } });
    if (existingConfig) {
        await prisma.uIGlobalConfig.update({
            where: { id: existingConfig.id },
            data: { menuConfig: menuConfig as any, version: 1 },
        });
    } else {
        await prisma.uIGlobalConfig.create({
            data: { menuConfig: menuConfig as any, version: 1, tenantId },
        });
    }

    console.log('    Created UI Global Config with menu items');
}
