import { PrismaClient } from '@prisma/client';
import {
    UIEntityConfigDataSchema,
    MenuConfigSchema
} from 'atlas-shared/zod';

/**
 * E2E Test UI Seed
 * 
 * Creates UI configuration for E2E test entities:
 * - Menu configuration for Books and Authors
 * - Browse config with tile and table views
 * - Detail config with sections showcasing all field types
 * 
 * All field keys and section IDs are designed for stable test references.
 */
export async function seedUI(prisma: PrismaClient) {
    console.log('🎨 Seeding E2E UI Configuration...');

    // Cleanup UI Configs
    await prisma.uIEntityConfig.deleteMany({});
    await prisma.uIGlobalConfig.deleteMany({});

    const uiConfigs = [
        // =========================================================================
        // BOOK UI SCHEMA - Full showcase of all field types
        // =========================================================================
        {
            entityType: 'book',
            version: 1,
            browseConfig: {
                title: 'Books',
                description: 'Library book catalog',
                defaultView: 'tile',
                allowCreate: true,
                views: {
                    tile: {
                        enabled: true,
                        layout: { columns: 3 },
                        fields: [
                            { field: 'name', role: 'title' },
                            { field: 'publisher', role: 'subtitle' },
                            { field: 'description', role: 'description' },
                            { field: 'genre', role: 'badge', format: 'badge' },
                            { field: 'status', role: 'badge', format: 'badge' },
                            { field: 'updatedAt', role: 'footer', format: 'relative' },
                        ],
                    },
                    table: {
                        enabled: true,
                        columns: [
                            { field: 'name', header: 'Title', sortable: true },
                            { field: 'genre', header: 'Genre', format: 'badge' },
                            { field: 'language', header: 'Language', format: 'badge' },
                            { field: 'status', header: 'Status', format: 'badge' },
                            { field: 'pageCount', header: 'Pages' },
                            { field: 'rating', header: 'Rating' },
                            { field: 'isAvailable', header: 'Available', format: 'badge' },
                            { field: 'updatedAt', header: 'Updated', format: 'relative', sortable: true },
                        ],
                    },
                },
            },
            detailConfig: {
                headerFields: ['name', 'genre', 'status'],
                sections: [
                    // ─────────────────────────────────────────────────────────────
                    // SECTION 1: Basic Information (Card with 2 columns)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'basic',
                        title: 'Basic Information',
                        description: 'Core book details',
                        type: 'card',
                        layout: { columns: 2, gap: 4 },
                        fields: [
                            { field: 'name', column: 1, label: 'Title' },
                            { field: 'isbn', column: 2, label: 'ISBN' },
                            { field: 'description', column: 1, columnSpan: 2 },
                            { field: 'publisher', column: 1 },
                            { field: 'publicationDate', column: 2, label: 'Published' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 2: Classification (Card with 3 columns + value styles)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'classification',
                        title: 'Classification',
                        description: 'Genre, language and status',
                        type: 'card',
                        layout: { columns: 3 },
                        fields: [
                            {
                                field: 'genre',
                                column: 1,
                                valueStyles: {
                                    fiction: { label: 'Fiction', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
                                    'non-fiction': { label: 'Non-Fiction', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
                                    science: { label: 'Science', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
                                    history: { label: 'History', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
                                    biography: { label: 'Biography', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
                                },
                            },
                            {
                                field: 'language',
                                column: 2,
                                valueStyles: {
                                    en: { label: '🇬🇧 English', color: 'bg-slate-100 text-slate-700' },
                                    pl: { label: '🇵🇱 Polish', color: 'bg-red-100 text-red-700' },
                                    de: { label: '🇩🇪 German', color: 'bg-yellow-100 text-yellow-700' },
                                    fr: { label: '🇫🇷 French', color: 'bg-blue-100 text-blue-700' },
                                    es: { label: '🇪🇸 Spanish', color: 'bg-orange-100 text-orange-700' },
                                },
                            },
                            {
                                field: 'status',
                                column: 3,
                                valueStyles: {
                                    available: { label: 'Available', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
                                    borrowed: { label: 'Borrowed', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
                                    reserved: { label: 'Reserved', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
                                    archived: { label: 'Archived', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
                                },
                            },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 3: Tags (Card - multi-select array field)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'tags',
                        title: 'Tags',
                        description: 'Book categorization tags',
                        type: 'card',
                        layout: { columns: 1 },
                        fields: [
                            { field: 'tags', column: 1, label: 'Tags' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 4: Details (Collapsible - numeric and boolean fields)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'details',
                        title: 'Book Details',
                        description: 'Page count, price and ratings',
                        type: 'collapsible',
                        layout: { columns: 4 },
                        fields: [
                            { field: 'pageCount', column: 1, label: 'Pages' },
                            { field: 'price', column: 2, label: 'Price ($)' },
                            { field: 'rating', column: 3, label: 'Rating (1-5)', component: 'field:star_rating' },
                            { field: 'isAvailable', column: 4, label: 'Available' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 5: Format (Card - boolean fields)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'format',
                        title: 'Format',
                        description: 'Book format options',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'isAvailable', column: 1, label: 'In Stock' },
                            { field: 'isEbook', column: 2, label: 'E-Book Available' },
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
                    // SECTION 6: Authors (Card - relation field)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'authors',
                        title: 'Authors',
                        description: 'Book authors and their roles',
                        type: 'card',
                        layout: { columns: 1 },
                        fields: [
                            { field: 'authors', column: 1, label: 'Authors' },
                        ],
                    },

                    // ─────────────────────────────────────────────────────────────
                    // SECTION 7: Relationship Map (Widget)
                    // ─────────────────────────────────────────────────────────────
                    {
                        id: 'relation-graph',
                        title: 'Relationship Map',
                        description: 'Visual representation of book connections',
                        type: 'widget',
                        component: 'widget:relation_graph',
                        layout: { columns: 1 },
                        fields: [],
                    },
                ],
            },
        },

        // =========================================================================
        // AUTHOR UI SCHEMA
        // =========================================================================
        {
            entityType: 'author',
            version: 1,
            browseConfig: {
                title: 'Authors',
                description: 'Library author directory',
                defaultView: 'tile',
                allowCreate: true,
                views: {
                    tile: {
                        enabled: true,
                        layout: { columns: 4 },
                        fields: [
                            { field: 'name', role: 'title' },
                            { field: 'nationality', role: 'subtitle' },
                            { field: 'description', role: 'description' },
                            { field: 'status', role: 'badge', format: 'badge' },
                        ],
                    },
                    table: {
                        enabled: true,
                        columns: [
                            { field: 'name', header: 'Name', sortable: true },
                            { field: 'nationality', header: 'Nationality' },
                            { field: 'status', header: 'Status', format: 'badge' },
                            { field: 'booksCount', header: 'Books' },
                            { field: 'rating', header: 'Rating' },
                            { field: 'isVerified', header: 'Verified', format: 'badge' },
                            { field: 'updatedAt', header: 'Updated', format: 'relative', sortable: true },
                        ],
                    },
                },
            },
            detailConfig: {
                headerFields: ['name', 'status', 'isVerified'],
                sections: [
                    // Basic Information
                    {
                        id: 'basic',
                        title: 'Basic Information',
                        description: 'Author profile details',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'name', column: 1 },
                            { field: 'nationality', column: 2 },
                            { field: 'description', column: 1, columnSpan: 2, label: 'Biography' },
                            { field: 'birthDate', column: 1, label: 'Birth Date' },
                            {
                                field: 'status',
                                column: 2,
                                valueStyles: {
                                    active: { label: 'Active', color: 'bg-green-100 text-green-700' },
                                    inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-700' },
                                    deceased: { label: 'Deceased', color: 'bg-slate-100 text-slate-700' },
                                },
                            },
                        ],
                    },

                    // Contact
                    {
                        id: 'contact',
                        title: 'Contact Information',
                        type: 'card',
                        layout: { columns: 2 },
                        fields: [
                            { field: 'email', column: 1 },
                            { field: 'website', column: 2 },
                        ],
                    },

                    // Expertise
                    {
                        id: 'expertise',
                        title: 'Expertise',
                        description: 'Author specializations and areas of expertise',
                        type: 'card',
                        layout: { columns: 1 },
                        fields: [
                            { field: 'specializations', column: 1, label: 'Specializations' },
                        ],
                    },

                    // Statistics
                    {
                        id: 'stats',
                        title: 'Statistics',
                        type: 'collapsible',
                        layout: { columns: 3 },
                        fields: [
                            { field: 'booksCount', column: 1, label: 'Books Published' },
                            { field: 'rating', column: 2, label: 'Rating', component: 'field:star_rating' },
                            { field: 'isVerified', column: 3, label: 'Verified Author' },
                        ],
                    },

                    // Separator
                    {
                        id: 'relations-separator',
                        title: 'Published Works',
                        type: 'separator',
                        layout: { columns: 1 },
                        fields: [],
                    },

                    // Books relation
                    {
                        id: 'books',
                        title: 'Books',
                        description: 'Books written by this author',
                        type: 'card',
                        layout: { columns: 1 },
                        fields: [
                            { field: 'books', column: 1, label: 'Books' },
                        ],
                    },

                    // Relationship Map
                    {
                        id: 'relation-graph',
                        title: 'Relationship Map',
                        description: 'Visual representation of author connections',
                        type: 'widget',
                        component: 'widget:relation_graph',
                        layout: { columns: 1 },
                        fields: [],
                    },
                ],
            },
        },
    ];

    // Validate and insert UI configs
    for (const config of uiConfigs) {
        UIEntityConfigDataSchema.parse(config);
        await prisma.uIEntityConfig.create({
            data: {
                entityType: config.entityType,
                version: config.version,
                browseConfig: config.browseConfig as any,
                detailConfig: config.detailConfig as any,
            },
        });
        console.log(`   ✓ Created UI config for ${config.entityType}`);
    }

    // Create global menu configuration
    const menuConfig = {
        items: [
            { entityType: 'book', displayName: 'Books', icon: 'book', visible: true },
            { entityType: 'author', displayName: 'Authors', icon: 'user', visible: true },
        ],
    };

    MenuConfigSchema.parse(menuConfig);
    await prisma.uIGlobalConfig.create({
        data: { menuConfig: menuConfig as any, version: 1 },
    });
    console.log('   ✓ Created menu configuration');

    console.log('\n✅ E2E UI Configuration completed!');
}
