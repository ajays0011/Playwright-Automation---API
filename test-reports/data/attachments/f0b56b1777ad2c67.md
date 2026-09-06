# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: account/user.negative.spec.ts >> User API - Negative Tests @negative >> Delete User - Invalid Operations @negative @regression >> should fail deleting with invalid token @negative
- Location: tests/account/user.negative.spec.ts:196:9

# Error details

```
Error: Expected status 401, but received 200.
Response body: {
  "code": "1207",
  "message": "User Id not correct!"
}
```

# Test source

```ts
  105 | 
  106 |     test('should fail with empty payload @negative', async ({
  107 |       apiClient,
  108 |     }) => {
  109 |       const response = await apiClient.post('/Account/v1/User', {
  110 |         data: {},
  111 |         skipAuth: true,
  112 |       });
  113 | 
  114 |       expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
  115 |     });
  116 | 
  117 |     test('should fail with null values @negative', async ({ apiClient }) => {
  118 |       const response = await apiClient.post('/Account/v1/User', {
  119 |         data: { userName: null, password: null },
  120 |         skipAuth: true,
  121 |       });
  122 | 
  123 |       expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
  124 |     });
  125 |   });
  126 | 
  127 |   /**
  128 |    * Get User - Negative Scenarios
  129 |    */
  130 |   test.describe('Get User - Invalid IDs @negative @regression', () => {
  131 |     test('should fail with non-existing user ID @negative', async ({
  132 |       authAccountService,
  133 |     }) => {
  134 |       const fakeUserId = generateUUID();
  135 |       const response = await authAccountService.getUser(fakeUserId);
  136 | 
  137 |       expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
  138 |     });
  139 | 
  140 |     test('should fail with invalid UUID format @negative', async ({
  141 |       authAccountService,
  142 |     }) => {
  143 |       const response = await authAccountService.getUser('invalid-uuid');
  144 | 
  145 |       expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
  146 |     });
  147 | 
  148 |     test('should fail with empty user ID @negative', async ({
  149 |       authAccountService,
  150 |     }) => {
  151 |       const response = await authAccountService.getUser('');
  152 | 
  153 |       // Empty ID in path results in a different endpoint
  154 |       expect(response.status).toBeDefined();
  155 |     });
  156 | 
  157 |     test('should fail without authentication @negative', async ({
  158 |       apiClient,
  159 |     }) => {
  160 |       const fakeUserId = generateUUID();
  161 |       const response = await apiClient.get(
  162 |         `/Account/v1/User/${fakeUserId}`,
  163 |         { skipAuth: true }
  164 |       );
  165 | 
  166 |       expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
  167 |     });
  168 |   });
  169 | 
  170 |   /**
  171 |    * Delete User - Negative Scenarios
  172 |    */
  173 |   test.describe('Delete User - Invalid Operations @negative @regression', () => {
  174 |     test('should fail deleting non-existing user @negative', async ({
  175 |       authAccountService,
  176 |     }) => {
  177 |       const fakeUserId = generateUUID();
  178 |       const response = await authAccountService.deleteUser(fakeUserId);
  179 | 
  180 |       // Should fail - user does not exist
  181 |       expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
  182 |     });
  183 | 
  184 |     test('should fail deleting without authentication @negative', async ({
  185 |       apiClient,
  186 |     }) => {
  187 |       const fakeUserId = generateUUID();
  188 |       const response = await apiClient.delete(
  189 |         `/Account/v1/User/${fakeUserId}`,
  190 |         { skipAuth: true }
  191 |       );
  192 | 
  193 |       expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
  194 |     });
  195 | 
  196 |     test('should fail deleting with invalid token @negative', async ({
  197 |       apiClient,
  198 |     }) => {
  199 |       const fakeUserId = generateUUID();
  200 |       const response = await apiClient.delete(
  201 |         `/Account/v1/User/${fakeUserId}`,
  202 |         { token: 'invalid-token' }
  203 |       );
  204 | 
> 205 |       expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
      |                        ^ Error: Expected status 401, but received 200.
  206 |     });
  207 |   });
  208 | });
  209 | 
```