# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: account/auth.negative.spec.ts >> Authentication API - Negative Tests @negative >> Generate Token - Invalid Inputs @negative @regression >> should return failed schema for invalid credentials @contract @negative
- Location: tests/account/auth.negative.spec.ts:52:9

# Error details

```
Error: Response body does not match schema.
Validation errors:
  - /expires: must be string ({"type":"string"})

Received body:
{
  "token": null,
  "expires": null,
  "status": "Failed",
  "result": "User authorization failed."
}
```

# Test source

```ts
  1   | import { test, expect } from '../../src/fixtures/api-fixtures';
  2   | import { HTTP_STATUS } from '../../src/config/constants';
  3   | import { DataProvider } from '../../src/utils/data-provider';
  4   | import {
  5   |   failedTokenResponseSchema,
  6   | } from '../../src/schemas/account/token-response.schema';
  7   | 
  8   | const dataProvider = new DataProvider();
  9   | 
  10  | test.describe('Authentication API - Negative Tests @negative', () => {
  11  |   /**
  12  |    * Generate Token - Negative Scenarios
  13  |    */
  14  |   test.describe('Generate Token - Invalid Inputs @negative @regression', () => {
  15  |     test('should fail with missing userName @negative', async ({
  16  |       accountService,
  17  |     }) => {
  18  |       const response = await accountService.generateToken({
  19  |         userName: '',
  20  |         password: 'Test@12345',
  21  |       });
  22  | 
  23  |       expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
  24  |     });
  25  | 
  26  |     test('should fail with missing password @negative', async ({
  27  |       accountService,
  28  |     }) => {
  29  |       const response = await accountService.generateToken({
  30  |         userName: 'testuser',
  31  |         password: '',
  32  |       });
  33  | 
  34  |       expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
  35  |     });
  36  | 
  37  |     test('should fail with invalid credentials @negative', async ({
  38  |       accountService,
  39  |     }) => {
  40  |       const response = await accountService.generateToken({
  41  |         userName: 'nonexistent_user_abc_999',
  42  |         password: 'WrongPass@123',
  43  |       });
  44  | 
  45  |       expect(response).toHaveValidStatus(HTTP_STATUS.OK);
  46  |       const body = response.body as Record<string, unknown>;
  47  |       expect(body.token).toBeNull();
  48  |       expect(body.status).toBe('Failed');
  49  |       expect(body.result).toBe('User authorization failed.');
  50  |     });
  51  | 
  52  |     test('should return failed schema for invalid credentials @contract @negative', async ({
  53  |       accountService,
  54  |     }) => {
  55  |       const response = await accountService.generateToken({
  56  |         userName: 'nonexistent_user_def_999',
  57  |         password: 'WrongPass@123',
  58  |       });
  59  | 
> 60  |       expect(response).toMatchSchema(failedTokenResponseSchema);
      |                        ^ Error: Response body does not match schema.
  61  |     });
  62  | 
  63  |     test('should fail with empty payload @negative', async ({
  64  |       apiClient,
  65  |     }) => {
  66  |       const response = await apiClient.post('/Account/v1/GenerateToken', {
  67  |         data: {},
  68  |         skipAuth: true,
  69  |       });
  70  | 
  71  |       expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
  72  |     });
  73  | 
  74  |     test('should fail with null values @negative', async ({
  75  |       apiClient,
  76  |     }) => {
  77  |       const response = await apiClient.post('/Account/v1/GenerateToken', {
  78  |         data: { userName: null, password: null },
  79  |         skipAuth: true,
  80  |       });
  81  | 
  82  |       expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
  83  |     });
  84  | 
  85  |     test('should fail with numeric userName @negative', async ({
  86  |       apiClient,
  87  |     }) => {
  88  |       const response = await apiClient.post('/Account/v1/GenerateToken', {
  89  |         data: { userName: 12345, password: 'Test@12345' },
  90  |         skipAuth: true,
  91  |       });
  92  | 
  93  |       // API may accept numeric types - verify behavior
  94  |       expect(response.status).toBeDefined();
  95  |     });
  96  | 
  97  |     test('should fail with boolean values @negative', async ({
  98  |       apiClient,
  99  |     }) => {
  100 |       const response = await apiClient.post('/Account/v1/GenerateToken', {
  101 |         data: { userName: true, password: false },
  102 |         skipAuth: true,
  103 |       });
  104 | 
  105 |       expect(response.status).toBeDefined();
  106 |     });
  107 |   });
  108 | 
  109 |   /**
  110 |    * Data-driven negative tests from JSON dataset
  111 |    */
  112 |   test.describe('Generate Token - Data Driven Negative Tests @negative', () => {
  113 |     let invalidAuthData: Array<{
  114 |       description: string;
  115 |       payload: Record<string, unknown>;
  116 |       expectedStatus: number;
  117 |       expectedResult?: string;
  118 |     }>;
  119 | 
  120 |     test.beforeAll(() => {
  121 |       invalidAuthData = dataProvider.loadNegativeData('invalid-auth');
  122 |     });
  123 | 
  124 |     test('should handle all invalid auth payloads @negative @regression', async ({
  125 |       apiClient,
  126 |     }) => {
  127 |       for (const testCase of invalidAuthData) {
  128 |         const response = await apiClient.post('/Account/v1/GenerateToken', {
  129 |           data: testCase.payload,
  130 |           skipAuth: true,
  131 |         });
  132 | 
  133 |         // Soft assertions so all cases run
  134 |         expect
  135 |           .soft(response.status, `Failed for: ${testCase.description}`)
  136 |           .toBeDefined();
  137 | 
  138 |         if (testCase.expectedResult) {
  139 |           const body = response.body as Record<string, unknown>;
  140 |           expect
  141 |             .soft(body.result, `Result mismatch for: ${testCase.description}`)
  142 |             .toBe(testCase.expectedResult);
  143 |         }
  144 |       }
  145 |     });
  146 |   });
  147 | 
  148 |   /**
  149 |    * Authorization - Missing Token Scenarios
  150 |    */
  151 |   test.describe('Authorization with Missing/Invalid Token @negative', () => {
  152 |     test('should fail accessing protected endpoint without token @negative', async ({
  153 |       apiClient,
  154 |     }) => {
  155 |       const response = await apiClient.get(
  156 |         '/Account/v1/User/non-existing-user-id',
  157 |         { skipAuth: true }
  158 |       );
  159 | 
  160 |       expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
```