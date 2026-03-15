import { EntityRelationsService } from './entity-relations.service';
import type { AttributeDefinition } from './validation/type-validators';
import type { EntityRecord } from '../../database/entity.repository';

type Direction = 'incoming' | 'outgoing';

interface TestRelationDefinition {
  relationType: string;
  fromEntityType: string | null;
  toEntityType: string | null;
}

interface TestRelationRecord {
  relationType: string;
  fromEntityId: string;
  toEntityId: string;
  attributes: unknown;
}

interface RelationsAccessor {
  mapRelationsToAttributes: (
    entity: EntityRecord,
    relationFields: Map<string, AttributeDefinition>,
    relationDefinitions: Map<string, TestRelationDefinition>,
    outgoingByEntity: Map<string, Map<string, TestRelationRecord[]>>,
    incomingByEntity: Map<string, Map<string, TestRelationRecord[]>>
  ) => Record<string, unknown>;
  inferRelationDirection: (
    entityType: string,
    fieldDef: AttributeDefinition,
    relationDef?: TestRelationDefinition,
  ) => Direction;
}

describe('EntityRelationsService direction inference', () => {
  let service: EntityRelationsService;

  beforeEach(() => {
    service = new EntityRelationsService(
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('maps incoming directional relations based on relation definitions', () => {
    const entity = {
      id: 'author-1',
      entityType: 'author',
      attributes: {},
    } as EntityRecord;

    const relationField: AttributeDefinition = {
      key: 'books',
      displayName: 'Books',
      type: 'relation',
      relType: 'book_written_by',
    };

    const relationFields = new Map<string, AttributeDefinition>([['books', relationField]]);
    const relationDefinitions = new Map([
      ['book_written_by', {
        relationType: 'book_written_by',
        fromEntityType: 'book',
        toEntityType: 'author',
      }],
    ]);

    const outgoingByEntity = new Map([
      ['author-1', new Map([
        ['book_written_by', [{
          relationType: 'book_written_by',
          fromEntityId: 'author-1',
          toEntityId: 'author-outgoing-should-not-be-used',
          attributes: { role: 'editor' },
        }]],
      ])],
    ]);

    const incomingByEntity = new Map([
      ['author-1', new Map([
        ['book_written_by', [{
          relationType: 'book_written_by',
          fromEntityId: 'book-1',
          toEntityId: 'author-1',
          attributes: { role: 'main-author', contribution: 100 },
        }]],
      ])],
    ]);

    const attrs = (service as unknown as RelationsAccessor).mapRelationsToAttributes(
      entity,
      relationFields,
      relationDefinitions,
      outgoingByEntity,
      incomingByEntity,
    );

    expect(attrs.books).toEqual([
      {
        targetId: 'book-1',
        role: 'main-author',
        contribution: 100,
      },
    ]);
  });

  it('maps outgoing directional relations for source entity type', () => {
    const entity = {
      id: 'book-1',
      entityType: 'book',
      attributes: {},
    } as EntityRecord;

    const relationField: AttributeDefinition = {
      key: 'authors',
      displayName: 'Authors',
      type: 'relation',
      relType: 'book_written_by',
    };

    const relationFields = new Map<string, AttributeDefinition>([['authors', relationField]]);
    const relationDefinitions = new Map([
      ['book_written_by', {
        relationType: 'book_written_by',
        fromEntityType: 'book',
        toEntityType: 'author',
      }],
    ]);

    const outgoingByEntity = new Map([
      ['book-1', new Map([
        ['book_written_by', [{
          relationType: 'book_written_by',
          fromEntityId: 'book-1',
          toEntityId: 'author-1',
          attributes: { role: 'co-author', contribution: 50 },
        }]],
      ])],
    ]);

    const incomingByEntity = new Map([
      ['book-1', new Map([
        ['book_written_by', [{
          relationType: 'book_written_by',
          fromEntityId: 'incoming-book-should-not-be-used',
          toEntityId: 'book-1',
          attributes: { role: 'translator' },
        }]],
      ])],
    ]);

    const attrs = (service as unknown as RelationsAccessor).mapRelationsToAttributes(
      entity,
      relationFields,
      relationDefinitions,
      outgoingByEntity,
      incomingByEntity,
    );

    expect(attrs.authors).toEqual([
      {
        targetId: 'author-1',
        role: 'co-author',
        contribution: 50,
      },
    ]);
  });

  it('respects field side override for ambiguous relations', () => {
    const direction = (service as unknown as RelationsAccessor).inferRelationDirection(
      'author',
      {
        key: 'books',
        displayName: 'Books',
        type: 'relation',
        relType: 'book_written_by',
        side: 'from',
      },
      {
        relationType: 'book_written_by',
        fromEntityType: 'book',
        toEntityType: 'author',
      },
    );

    expect(direction).toBe('outgoing');
  });
});
