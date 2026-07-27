/**
 * Add books to collection request model.
 * Used for POST /BookStore/v1/Books
 */
export interface AddBooksRequest {
  /** User ID to add books to */
  userId: string;
  /** Collection of ISBNs to add */
  collectionOfIsbns: IsbnEntry[];
}

export interface IsbnEntry {
  /** Book ISBN */
  isbn: string;
}

/**
 * Factory for creating add books request payloads.
 */
export class AddBooksRequestFactory {
  /**
   * Create a valid add books request with a single ISBN.
   */
  static createSingle(userId: string, isbn: string): AddBooksRequest {
    return {
      userId,
      collectionOfIsbns: [{ isbn }],
    };
  }

  /**
   * Create a valid add books request with multiple ISBNs.
   */
  static createMultiple(userId: string, isbns: string[]): AddBooksRequest {
    return {
      userId,
      collectionOfIsbns: isbns.map((isbn) => ({ isbn })),
    };
  }

  /**
   * Create request with empty collection.
   */
  static withEmptyCollection(userId: string): AddBooksRequest {
    return {
      userId,
      collectionOfIsbns: [],
    };
  }

  /**
   * Create request with invalid ISBN.
   */
  static withInvalidIsbn(userId: string): AddBooksRequest {
    return {
      userId,
      collectionOfIsbns: [{ isbn: 'invalid-isbn' }],
    };
  }

  /**
   * Create request with missing userId.
   */
  static withMissingUserId(isbn: string): Partial<AddBooksRequest> {
    return {
      collectionOfIsbns: [{ isbn }],
    };
  }
}
