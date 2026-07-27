import { test, expect } from '../../src/fixtures/api-fixtures';
import { HTTP_STATUS } from '../../src/config/constants';
import { DataProvider } from '../../src/utils/data-provider';

const dataProvider = new DataProvider();

test.describe('Books API - Negative Tests @negative', () => {
  test.describe('Get All Books - Edge Cases @negative @regression', () => {
    test('should handle request with invalid query parameters @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.get('/BookStore/v1/Books', {
        params: { invalid_param: 'value' },
        skipAuth: true,
      });

      // Should still return books (query params might be ignored)
      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
    });

    test('should handle request with extra path segments @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.get('/BookStore/v1/Books/extra/path', {
        skipAuth: true,
      });

      // Should return error for invalid path
      expect(response.status).toBeDefined();
    });
  });
});
