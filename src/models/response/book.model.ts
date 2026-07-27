/**
 * Book response model.
 * Response from GET /BookStore/v1/Book and within books arrays.
 */
export interface BookResponse {
  /** ISBN identifier */
  isbn: string;
  /** Book title */
  title: string;
  /** Book subtitle */
  subTitle: string;
  /** Author name */
  author: string;
  /** Publication date */
  publish_date: string;
  /** Publisher name */
  publisher: string;
  /** Number of pages */
  pages: number;
  /** Book description */
  description: string;
  /** Book website URL */
  website: string;
}

/**
 * Type guard for valid book response.
 */
export function isValidBookResponse(
  response: unknown
): response is BookResponse {
  if (!response || typeof response !== 'object') return false;
  const obj = response as Record<string, unknown>;
  return (
    typeof obj.isbn === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.author === 'string' &&
    typeof obj.pages === 'number'
  );
}
