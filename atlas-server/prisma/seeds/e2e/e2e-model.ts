import { PrismaClient } from '@prisma/client';
import {
    TypeDefinitionDataSchema,
    AttributeDefinitionArraySchema,
    RelationDefinitionDataSchema
} from 'atlas-shared/zod';
import { DEFAULT_TENANT_ID } from '../default-tenant';

/**
 * E2E Test Model Seed
 * 
 * Creates a Library domain model with:
 * - Book entity (all field types: string, text, number, boolean, date, enum, array)
 * - Author entity (similar field types)
 * - book_written_by relation with attributes (role, contribution)
 * 
 * All keys are designed to be stable and referenced by E2E tests.
 */

let prisma: PrismaClient;
let tenantId: string;

export async function seedModel(client: PrismaClient, tid: string = DEFAULT_TENANT_ID) {
    prisma = client;
    tenantId = tid;
    console.log('🌱 Seeding E2E test model...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    // Delete audit events first because they reference entities/users
    await prisma.auditEvent.deleteMany({});
    await prisma.relation.deleteMany({});
    await prisma.entity.deleteMany({});
    await prisma.entityDefinition.deleteMany({});
    await prisma.relationDefinition.deleteMany({});
    await prisma.typeDefinition.deleteMany({});
    console.log('✓ Data cleared\n');

    // Seed Type Definitions
    console.log('📋 Seeding type definitions...');
    const typeDefinitions = await seedTypeDefinitions();
    console.log(`   Created ${typeDefinitions.length} type definitions\n`);

    // Seed Entity Definitions
    console.log('📐 Seeding entity definitions...');
    const entityDefinitions = await seedEntityDefinitions();
    console.log(`   Created ${entityDefinitions.length} entity definitions\n`);

    // Seed Relation Definitions
    console.log('🔗 Seeding relation definitions...');
    const relationDefinitions = await seedRelationDefinitions();
    console.log(`   Created ${relationDefinitions.length} relation definitions\n`);

    // Seed Books
    console.log('📚 Seeding books...');
    const books = await seedBooks();
    console.log(`   Created ${books.length} books\n`);

    // Seed Authors
    console.log('✍️  Seeding authors...');
    const authors = await seedAuthors();
    console.log(`   Created ${authors.length} authors\n`);

    // Seed Relations
    console.log('🔗 Seeding book-author relations...');
    const relations = await seedRelations(books, authors);
    console.log(`   Created ${relations.length} relations\n`);

    // Summary
    const totalEntities = await prisma.entity.count();
    console.log('✅ E2E Model seed completed!');
    console.log(`   Total entities: ${totalEntities}\n`);
}

// =============================================================================
// Type Definitions
// =============================================================================

async function seedTypeDefinitions() {
    const types = [
        // Book Genre (single select)
        {
            typeKey: 'book_genre',
            displayName: 'Book Genre',
            baseType: 'enum',
            options: [
                { key: 'fiction', displayName: 'Fiction', description: 'Fictional works' },
                { key: 'non-fiction', displayName: 'Non-Fiction', description: 'Factual works' },
                { key: 'science', displayName: 'Science', description: 'Scientific literature' },
                { key: 'history', displayName: 'History', description: 'Historical works' },
                { key: 'biography', displayName: 'Biography', description: 'Life stories' },
            ],
        },
        // Book Language
        {
            typeKey: 'book_language',
            displayName: 'Language',
            baseType: 'enum',
            options: [
                { key: 'en', displayName: 'English' },
                { key: 'pl', displayName: 'Polish' },
                { key: 'de', displayName: 'German' },
                { key: 'fr', displayName: 'French' },
                { key: 'es', displayName: 'Spanish' },
            ],
        },
        // Book Status
        {
            typeKey: 'book_status',
            displayName: 'Book Status',
            baseType: 'enum',
            options: [
                { key: 'available', displayName: 'Available', description: 'Available for borrowing' },
                { key: 'borrowed', displayName: 'Borrowed', description: 'Currently borrowed' },
                { key: 'reserved', displayName: 'Reserved', description: 'Reserved by someone' },
                { key: 'archived', displayName: 'Archived', description: 'No longer in circulation' },
            ],
        },
        // Author Role in book (for relation attribute)
        {
            typeKey: 'author_role',
            displayName: 'Author Role',
            baseType: 'enum',
            options: [
                { key: 'main-author', displayName: 'Main Author', description: 'Primary author' },
                { key: 'co-author', displayName: 'Co-Author', description: 'Contributing author' },
                { key: 'editor', displayName: 'Editor', description: 'Editor of the work' },
                { key: 'translator', displayName: 'Translator', description: 'Translator of the work' },
            ],
        },
        // Author Status
        {
            typeKey: 'author_status',
            displayName: 'Author Status',
            baseType: 'enum',
            options: [
                { key: 'active', displayName: 'Active', description: 'Currently writing' },
                { key: 'inactive', displayName: 'Inactive', description: 'No longer writing' },
                { key: 'deceased', displayName: 'Deceased', description: 'No longer alive' },
            ],
        },
    ];

    return Promise.all(
        types.map((t) => {
            TypeDefinitionDataSchema.parse(t);
            return prisma.typeDefinition.upsert({
                where: { type_definitions_key_tenant_unique: { typeKey: t.typeKey, tenantId } },
                update: {
                    displayName: t.displayName,
                    baseType: t.baseType as any,
                    options: t.options,
                },
                create: {
                    typeKey: t.typeKey,
                    displayName: t.displayName,
                    baseType: t.baseType as any,
                    options: t.options,
                    tenantId,
                },
            });
        }),
    );
}

// =============================================================================
// Entity Definitions
// =============================================================================

async function seedEntityDefinitions() {
    const definitions = [
        // Book Entity - showcases ALL field types
        {
            entityType: 'book',
            displayName: 'Book',
            attributeSchema: [
                // String fields
                { key: 'name', displayName: 'Title', type: 'string', required: true, group: 'basic' },
                { key: 'description', displayName: 'Description', type: 'text', group: 'basic' },
                { key: 'isbn', displayName: 'ISBN', type: 'string', group: 'basic' },
                { key: 'publisher', displayName: 'Publisher', type: 'string', group: 'basic' },

                // Enum fields (single select)
                { key: 'genre', displayName: 'Genre', typeRef: 'book_genre', group: 'classification' },
                { key: 'language', displayName: 'Language', typeRef: 'book_language', group: 'classification' },
                { key: 'status', displayName: 'Status', typeRef: 'book_status', group: 'classification' },

                // Array field (multi-select via string array)
                { key: 'tags', displayName: 'Tags', type: 'string', isArray: true, group: 'classification' },

                // Date field
                { key: 'publicationDate', displayName: 'Publication Date', type: 'date', group: 'details' },

                // Number fields
                { key: 'pageCount', displayName: 'Page Count', type: 'number', validation: { min: 1, max: 10000 }, group: 'details' },
                { key: 'price', displayName: 'Price', type: 'decimal', group: 'details' },
                { key: 'rating', displayName: 'Rating', type: 'number', validation: { min: 1, max: 5 }, group: 'details' },

                // Boolean field
                { key: 'isAvailable', displayName: 'Available', type: 'boolean', group: 'status' },
                { key: 'isEbook', displayName: 'E-Book', type: 'boolean', group: 'status' },

                // Relation field
                { key: 'authors', displayName: 'Authors', type: 'relation', relType: 'book_written_by', group: 'relations' },
            ],
        },
        // Author Entity
        {
            entityType: 'author',
            displayName: 'Author',
            attributeSchema: [
                // String fields
                { key: 'name', displayName: 'Name', type: 'string', required: true, group: 'basic' },
                { key: 'description', displayName: 'Biography', type: 'text', group: 'basic' },
                { key: 'nationality', displayName: 'Nationality', type: 'string', group: 'basic' },
                { key: 'email', displayName: 'Email', type: 'string', group: 'contact' },
                { key: 'website', displayName: 'Website', type: 'string', group: 'contact' },

                // Enum field
                { key: 'status', displayName: 'Status', typeRef: 'author_status', group: 'basic' },

                // Array field
                { key: 'specializations', displayName: 'Specializations', type: 'string', isArray: true, group: 'expertise' },

                // Date field
                { key: 'birthDate', displayName: 'Birth Date', type: 'date', group: 'personal' },

                // Number fields
                { key: 'booksCount', displayName: 'Books Published', type: 'number', group: 'stats' },
                { key: 'rating', displayName: 'Rating', type: 'number', validation: { min: 1, max: 5 }, group: 'stats' },

                // Boolean field
                { key: 'isVerified', displayName: 'Verified Author', type: 'boolean', group: 'status' },

                // Relation field (incoming)
                { key: 'books', displayName: 'Books', type: 'relation', relType: 'book_written_by', group: 'relations' },
            ],
        },
    ];

    return Promise.all(
        definitions.map((d) => {
            AttributeDefinitionArraySchema.parse(d.attributeSchema);
            return prisma.entityDefinition.upsert({
                where: { entity_definitions_type_tenant_unique: { entityType: d.entityType, tenantId } },
                update: {
                    displayName: d.displayName,
                    attributeSchema: d.attributeSchema,
                },
                create: {
                    entityType: d.entityType,
                    displayName: d.displayName,
                    attributeSchema: d.attributeSchema,
                    tenantId,
                },
            });
        }),
    );
}

// =============================================================================
// Relation Definitions
// =============================================================================

async function seedRelationDefinitions() {
    const definitions = [
        {
            relationType: 'book_written_by',
            displayName: 'Written By',
            fromEntityType: 'book',
            toEntityType: 'author',
            isDirectional: true,
            // Relation attributes - showcases relation with properties
            attributeSchema: [
                {
                    key: 'role',
                    displayName: 'Role',
                    typeRef: 'author_role',
                    required: true,
                },
                {
                    key: 'contribution',
                    displayName: 'Contribution %',
                    type: 'number',
                    validation: { min: 0, max: 100 },
                },
            ],
        },
    ];

    return Promise.all(
        definitions.map((d) => {
            RelationDefinitionDataSchema.parse(d);
            return prisma.relationDefinition.upsert({
                where: { relation_definitions_type_tenant_unique: { relationType: d.relationType, tenantId } },
                update: {
                    displayName: d.displayName,
                    fromEntityType: d.fromEntityType,
                    toEntityType: d.toEntityType,
                    isDirectional: d.isDirectional,
                    attributeSchema: d.attributeSchema as any,
                },
                create: {
                    relationType: d.relationType,
                    displayName: d.displayName,
                    fromEntityType: d.fromEntityType,
                    toEntityType: d.toEntityType,
                    isDirectional: d.isDirectional,
                    attributeSchema: d.attributeSchema as any,
                    tenantId,
                },
            });
        }),
    );
}

// =============================================================================
// Entity Data - Books
// =============================================================================

async function seedBooks() {
    const books = [
        {
            name: 'Clean Code',
            description: 'A Handbook of Agile Software Craftsmanship. This book is a must-read for any developer who wants to write clean, maintainable code.',
            entityType: 'book',
            attributes: {
                isbn: '978-0132350884',
                publisher: 'Prentice Hall',
                genre: 'non-fiction',
                language: 'en',
                status: 'available',
                tags: ['programming', 'best-practices', 'classic'],
                publicationDate: '2008-08-01',
                pageCount: 464,
                price: 49.99,
                rating: 5,
                isAvailable: true,
                isEbook: true,
            },
        },
        {
            name: 'The Pragmatic Programmer',
            description: 'Your Journey to Mastery. A guide to software development that covers topics from personal responsibility to career development.',
            entityType: 'book',
            attributes: {
                isbn: '978-0135957059',
                publisher: 'Addison-Wesley',
                genre: 'non-fiction',
                language: 'en',
                status: 'borrowed',
                tags: ['programming', 'career', 'best-practices'],
                publicationDate: '2019-09-13',
                pageCount: 352,
                price: 54.99,
                rating: 5,
                isAvailable: false,
                isEbook: true,
            },
        },
        {
            name: 'Wzorce Projektowe',
            description: 'Elementy oprogramowania obiektowego wielokrotnego użytku. Klasyczna książka o wzorcach projektowych w języku polskim.',
            entityType: 'book',
            attributes: {
                isbn: '978-8324631766',
                publisher: 'Helion',
                genre: 'science',
                language: 'pl',
                status: 'available',
                tags: ['programming', 'patterns', 'classic'],
                publicationDate: '2010-01-01',
                pageCount: 376,
                price: 79.00,
                rating: 4,
                isAvailable: true,
                isEbook: false,
            },
        },
        {
            name: 'Test Book Without Author',
            description: 'A book used to test orphan entity handling.',
            entityType: 'book',
            attributes: {
                isbn: '000-0000000000',
                publisher: 'Test Publisher',
                genre: 'fiction',
                language: 'en',
                status: 'archived',
                tags: ['test'],
                publicationDate: '2024-01-01',
                pageCount: 100,
                price: 9.99,
                rating: 3,
                isAvailable: false,
                isEbook: false,
            },
        },
    ];

    return Promise.all(
        books.map((b) =>
            prisma.entity.create({
                data: {
                    name: b.name,
                    description: b.description,
                    entityType: b.entityType,
                    attributes: b.attributes,
                    tenantId,
                },
            }),
        ),
    );
}

// =============================================================================
// Entity Data - Authors
// =============================================================================

async function seedAuthors() {
    const authors = [
        {
            name: 'Robert C. Martin',
            description: 'Robert Cecil Martin, colloquially called "Uncle Bob", is an American software engineer and author. He is a co-author of the Agile Manifesto.',
            entityType: 'author',
            attributes: {
                nationality: 'American',
                email: 'unclebob@cleancoder.com',
                website: 'https://cleancoder.com',
                status: 'active',
                specializations: ['Clean Code', 'SOLID Principles', 'Agile'],
                birthDate: '1952-12-05',
                booksCount: 8,
                rating: 5,
                isVerified: true,
            },
        },
        {
            name: 'David Thomas',
            description: 'David Thomas is a programmer and author, best known for co-authoring "The Pragmatic Programmer" with Andrew Hunt.',
            entityType: 'author',
            attributes: {
                nationality: 'British',
                email: 'dave@pragprog.com',
                website: 'https://pragdave.me',
                status: 'active',
                specializations: ['Ruby', 'Agile', 'Pragmatic Programming'],
                birthDate: '1956-01-01',
                booksCount: 5,
                rating: 5,
                isVerified: true,
            },
        },
        {
            name: 'Andrew Hunt',
            description: 'Andrew Hunt is a writer and software consultant. He co-authored "The Pragmatic Programmer" and co-founded the Pragmatic Bookshelf.',
            entityType: 'author',
            attributes: {
                nationality: 'American',
                email: 'andy@pragprog.com',
                website: 'https://toolshed.com',
                status: 'active',
                specializations: ['Agile', 'Pragmatic Programming', 'Leadership'],
                birthDate: '1964-01-01',
                booksCount: 4,
                rating: 5,
                isVerified: true,
            },
        },
        {
            name: 'Test Author Inactive',
            description: 'An inactive author used for testing status filtering.',
            entityType: 'author',
            attributes: {
                nationality: 'Unknown',
                status: 'inactive',
                specializations: ['Testing'],
                booksCount: 0,
                rating: 1,
                isVerified: false,
            },
        },
    ];

    return Promise.all(
        authors.map((a) =>
            prisma.entity.create({
                data: {
                    name: a.name,
                    description: a.description,
                    entityType: a.entityType,
                    attributes: a.attributes,
                    tenantId,
                },
            }),
        ),
    );
}

// =============================================================================
// Relations
// =============================================================================

async function seedRelations(
    books: Awaited<ReturnType<typeof seedBooks>>,
    authors: Awaited<ReturnType<typeof seedAuthors>>,
) {
    // Find entities by name for reliable matching
    const cleanCode = books.find((b) => b.name === 'Clean Code')!;
    const pragProg = books.find((b) => b.name === 'The Pragmatic Programmer')!;
    const wzorce = books.find((b) => b.name === 'Wzorce Projektowe')!;

    const unclebob = authors.find((a) => a.name === 'Robert C. Martin')!;
    const dave = authors.find((a) => a.name === 'David Thomas')!;
    const andy = authors.find((a) => a.name === 'Andrew Hunt')!;

    const relations = [
        // Clean Code -> Robert C. Martin (main author, 100%)
        {
            relationType: 'book_written_by',
            fromEntityId: cleanCode.id,
            toEntityId: unclebob.id,
            attributes: {
                role: 'main-author',
                contribution: 100,
            },
        },
        // Pragmatic Programmer -> David Thomas (co-author, 50%)
        {
            relationType: 'book_written_by',
            fromEntityId: pragProg.id,
            toEntityId: dave.id,
            attributes: {
                role: 'co-author',
                contribution: 50,
            },
        },
        // Pragmatic Programmer -> Andrew Hunt (co-author, 50%)
        {
            relationType: 'book_written_by',
            fromEntityId: pragProg.id,
            toEntityId: andy.id,
            attributes: {
                role: 'co-author',
                contribution: 50,
            },
        },
        // Wzorce Projektowe -> David Thomas (translator, 100%) - for testing different roles
        {
            relationType: 'book_written_by',
            fromEntityId: wzorce.id,
            toEntityId: dave.id,
            attributes: {
                role: 'translator',
                contribution: 100,
            },
        },
    ];

    return Promise.all(
        relations.map((r) =>
            prisma.relation.create({
                data: {
                    relationType: r.relationType,
                    fromEntityId: r.fromEntityId,
                    toEntityId: r.toEntityId,
                    attributes: r.attributes,
                    tenantId,
                },
            }),
        ),
    );
}
