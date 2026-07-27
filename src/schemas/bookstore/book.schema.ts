/**
 * JSON Schema for a single Book Response.
 * Validates response from GET /BookStore/v1/Book
 */
export const bookSchema = {
  type: 'object',
  properties: {
    isbn: {
      type: 'string',
      minLength: 1,
      description: 'ISBN identifier',
    },
    title: {
      type: 'string',
      minLength: 1,
      description: 'Book title',
    },
    subTitle: {
      type: 'string',
      description: 'Book subtitle',
    },
    author: {
      type: 'string',
      minLength: 1,
      description: 'Author name',
    },
    publish_date: {
      type: 'string',
      description: 'Publication date',
    },
    publisher: {
      type: 'string',
      description: 'Publisher name',
    },
    pages: {
      type: 'integer',
      minimum: 0,
      description: 'Number of pages',
    },
    description: {
      type: 'string',
      description: 'Book description',
    },
    website: {
      type: 'string',
      description: 'Book website URL',
    },
  },
  required: [
    'isbn',
    'title',
    'subTitle',
    'author',
    'publish_date',
    'publisher',
    'pages',
    'description',
    'website',
  ],
  additionalProperties: false,
};
