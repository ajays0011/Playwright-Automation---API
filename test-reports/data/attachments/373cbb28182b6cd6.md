# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bookstore/collection.positive.spec.ts >> Collection Management - Positive Tests >> Add Books to Collection @integration @regression >> should add book within acceptable response time @regression
- Location: tests/bookstore/collection.positive.spec.ts:100:9

# Error details

```
TypeError: (0 , _apiFixtures.expect)(...).toHaveResponseTime is not a function
```

# Test source

```ts
  22  |     }) => {
  23  |       // Setup: create user and authenticate
  24  |       const client = new ApiClient(request);
  25  |       const accountService = new AccountService(client);
  26  |       const bookstoreService = new BookStoreService(client);
  27  |       const tokenManager = new TokenManager(request);
  28  | 
  29  |       const userName = generateUniqueUsername('add_book');
  30  |       const password = generateStrongPassword();
  31  | 
  32  |       // Create user
  33  |       const createResp = await accountService.createUser({ userName, password });
  34  |       expect(createResp).toHaveValidStatus(HTTP_STATUS.CREATED);
  35  |       const userId = (createResp.body as Record<string, string>).userID;
  36  | 
  37  |       // Get token
  38  |       tokenManager.setCredentials(userName, password);
  39  |       const token = await tokenManager.getToken();
  40  |       client.setToken(token);
  41  | 
  42  |       // Add book
  43  |       const addResponse = await bookstoreService.addBooksByIsbn(userId, [
  44  |         '9781449325862',
  45  |       ]);
  46  | 
  47  |       expect(addResponse).toHaveValidStatus(HTTP_STATUS.CREATED);
  48  | 
  49  |       // Verify: get user and check books
  50  |       const userResponse = await accountService.getUser(userId);
  51  |       expect(userResponse).toHaveValidStatus(HTTP_STATUS.OK);
  52  | 
  53  |       const userBody = userResponse.body as {
  54  |         books: Array<{ isbn: string }>;
  55  |       };
  56  |       expect(userBody.books.length).toBe(1);
  57  |       expect(userBody.books[0].isbn).toBe('9781449325862');
  58  | 
  59  |       // Cleanup
  60  |       await bookstoreService.deleteAllBooksForUser(userId);
  61  |       await accountService.deleteUser(userId);
  62  |     });
  63  | 
  64  |     test('should add multiple books to user collection @integration', async ({
  65  |       request,
  66  |     }) => {
  67  |       const client = new ApiClient(request);
  68  |       const accountService = new AccountService(client);
  69  |       const bookstoreService = new BookStoreService(client);
  70  |       const tokenManager = new TokenManager(request);
  71  | 
  72  |       const userName = generateUniqueUsername('add_multi');
  73  |       const password = generateStrongPassword();
  74  | 
  75  |       const createResp = await accountService.createUser({ userName, password });
  76  |       expect(createResp).toHaveValidStatus(HTTP_STATUS.CREATED);
  77  |       const userId = (createResp.body as Record<string, string>).userID;
  78  | 
  79  |       tokenManager.setCredentials(userName, password);
  80  |       const token = await tokenManager.getToken();
  81  |       client.setToken(token);
  82  | 
  83  |       const isbns = ['9781449325862', '9781449331818'];
  84  |       const addResponse = await bookstoreService.addBooksByIsbn(userId, isbns);
  85  | 
  86  |       expect(addResponse).toHaveValidStatus(HTTP_STATUS.CREATED);
  87  | 
  88  |       // Verify
  89  |       const userResponse = await accountService.getUser(userId);
  90  |       const userBody = userResponse.body as {
  91  |         books: Array<{ isbn: string }>;
  92  |       };
  93  |       expect(userBody.books.length).toBe(2);
  94  | 
  95  |       // Cleanup
  96  |       await bookstoreService.deleteAllBooksForUser(userId);
  97  |       await accountService.deleteUser(userId);
  98  |     });
  99  | 
  100 |     test('should add book within acceptable response time @regression', async ({
  101 |       request,
  102 |     }) => {
  103 |       const client = new ApiClient(request);
  104 |       const accountService = new AccountService(client);
  105 |       const bookstoreService = new BookStoreService(client);
  106 |       const tokenManager = new TokenManager(request);
  107 | 
  108 |       const userName = generateUniqueUsername('add_time');
  109 |       const password = generateStrongPassword();
  110 | 
  111 |       const createResp = await accountService.createUser({ userName, password });
  112 |       const userId = (createResp.body as Record<string, string>).userID;
  113 | 
  114 |       tokenManager.setCredentials(userName, password);
  115 |       const token = await tokenManager.getToken();
  116 |       client.setToken(token);
  117 | 
  118 |       const addResponse = await bookstoreService.addBooksByIsbn(userId, [
  119 |         '9781449325862',
  120 |       ]);
  121 | 
> 122 |       expect(addResponse).toHaveResponseTime(envConfig.responseTimeThreshold);
      |                           ^ TypeError: (0 , _apiFixtures.expect)(...).toHaveResponseTime is not a function
  123 | 
  124 |       // Cleanup
  125 |       await bookstoreService.deleteAllBooksForUser(userId);
  126 |       await accountService.deleteUser(userId);
  127 |     });
  128 |   });
  129 | 
  130 |   /**
  131 |    * DELETE /BookStore/v1/Book - Remove Single Book
  132 |    */
  133 |   test.describe('Remove Book from Collection @integration @regression', () => {
  134 |     test('should remove a specific book from collection @integration', async ({
  135 |       request,
  136 |     }) => {
  137 |       const client = new ApiClient(request);
  138 |       const accountService = new AccountService(client);
  139 |       const bookstoreService = new BookStoreService(client);
  140 |       const tokenManager = new TokenManager(request);
  141 | 
  142 |       const userName = generateUniqueUsername('rm_book');
  143 |       const password = generateStrongPassword();
  144 | 
  145 |       const createResp = await accountService.createUser({ userName, password });
  146 |       const userId = (createResp.body as Record<string, string>).userID;
  147 | 
  148 |       tokenManager.setCredentials(userName, password);
  149 |       const token = await tokenManager.getToken();
  150 |       client.setToken(token);
  151 | 
  152 |       // Add book first
  153 |       await bookstoreService.addBooksByIsbn(userId, ['9781449325862']);
  154 | 
  155 |       // Delete the specific book
  156 |       const deleteResponse = await bookstoreService.deleteBookFromUser(
  157 |         '9781449325862',
  158 |         userId
  159 |       );
  160 | 
  161 |       expect(deleteResponse).toHaveValidStatus(HTTP_STATUS.NO_CONTENT);
  162 | 
  163 |       // Verify book is removed
  164 |       const userResponse = await accountService.getUser(userId);
  165 |       const userBody = userResponse.body as {
  166 |         books: Array<{ isbn: string }>;
  167 |       };
  168 |       expect(userBody.books.length).toBe(0);
  169 | 
  170 |       // Cleanup
  171 |       await accountService.deleteUser(userId);
  172 |     });
  173 |   });
  174 | 
  175 |   /**
  176 |    * DELETE /BookStore/v1/Books?UserId={userId} - Clear All Books
  177 |    */
  178 |   test.describe('Clear All Books @integration @regression', () => {
  179 |     test('should delete all books from user collection @integration', async ({
  180 |       request,
  181 |     }) => {
  182 |       const client = new ApiClient(request);
  183 |       const accountService = new AccountService(client);
  184 |       const bookstoreService = new BookStoreService(client);
  185 |       const tokenManager = new TokenManager(request);
  186 | 
  187 |       const userName = generateUniqueUsername('clear_all');
  188 |       const password = generateStrongPassword();
  189 | 
  190 |       const createResp = await accountService.createUser({ userName, password });
  191 |       const userId = (createResp.body as Record<string, string>).userID;
  192 | 
  193 |       tokenManager.setCredentials(userName, password);
  194 |       const token = await tokenManager.getToken();
  195 |       client.setToken(token);
  196 | 
  197 |       // Add multiple books
  198 |       await bookstoreService.addBooksByIsbn(userId, [
  199 |         '9781449325862',
  200 |         '9781449331818',
  201 |       ]);
  202 | 
  203 |       // Clear all
  204 |       const clearResponse =
  205 |         await bookstoreService.deleteAllBooksForUser(userId);
  206 | 
  207 |       expect(clearResponse).toHaveValidStatus(HTTP_STATUS.NO_CONTENT);
  208 | 
  209 |       // Verify all books are removed
  210 |       const userResponse = await accountService.getUser(userId);
  211 |       const userBody = userResponse.body as {
  212 |         books: Array<{ isbn: string }>;
  213 |       };
  214 |       expect(userBody.books.length).toBe(0);
  215 | 
  216 |       // Cleanup
  217 |       await accountService.deleteUser(userId);
  218 |     });
  219 |   });
  220 | 
  221 |   /**
  222 |    * PUT /BookStore/v1/Books/{ISBN} - Replace Book
```