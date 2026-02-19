import { EntityRecord } from '../../../database/entity.repository';

/**
 * Extended entity response with embedded relations
 * Attributes can contain nested objects/arrays for relations, so we relax the type from AttributeValues
 */
export type EntityResponse = Omit<EntityRecord, 'attributes'> & {
  attributes: Record<string, unknown>
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}
