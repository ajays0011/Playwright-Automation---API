/**
 * Replace book in collection request model.
 * Used for PUT /BookStore/v1/Books/{ISBN}
 */
export interface ReplaceBookRequest {
  /** User ID owning the collection */
  userId: string;
  /** New ISBN to replace with */
  isbn: string;
}

/**
 * Factory for creating replace book request payloads.
 */
export class ReplaceBookRequestFactory {
  /**
   * Create a valid replace book request.
   */
  static create(userId: string, newIsbn: string): ReplaceBookRequest {
    return { userId, isbn: newIsbn };
  }

  /**
   * Create request with invalid ISBN.
   */
  static withInvalidIsbn(userId: string): ReplaceBookRequest {
    return { userId, isbn: 'invalid-isbn-format' };
  }

  /**
   * Create request with missing userId.
   */
  static withMissingUserId(isbn: string): Partial<ReplaceBookRequest> {
    return { isbn };
  }

  /**
   * Create request with empty ISBN.
   */
  static withEmptyIsbn(userId: string): ReplaceBookRequest {
    return { userId, isbn: '' };
  }
}
