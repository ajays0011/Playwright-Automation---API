# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bookstore/bookstore.security.spec.ts >> BookStore API - Security Tests @security >> Unsupported HTTP Methods @security >> should reject PUT on /BookStore/v1/Book @security
- Location: tests/bookstore/bookstore.security.spec.ts:104:9

# Error details

```
Error: Failed to parse test data file: /home/runner/work/Playwright-Automation---API/Playwright-Automation---API/test-data/negative/security-payloads.json
```

# Test source

```ts
  33  |   private readonly testDataDir: string;
  34  |   private readonly cache: Map<string, unknown>;
  35  | 
  36  |   constructor() {
  37  |     this.envConfig = EnvConfig.getInstance();
  38  |     this.testDataDir = path.resolve(process.cwd(), 'test-data');
  39  |     this.cache = new Map();
  40  |   }
  41  | 
  42  |   /**
  43  |    * Load environment-specific test data.
  44  |    * Looks in test-data/{env}/{fileName}.json
  45  |    */
  46  |   loadEnvData<T>(fileName: string): T {
  47  |     const filePath = path.join(
  48  |       this.testDataDir,
  49  |       this.envConfig.environment,
  50  |       `${fileName}.json`
  51  |     );
  52  |     return this.loadJsonFile<T>(filePath);
  53  |   }
  54  | 
  55  |   /**
  56  |    * Load negative test data (shared across environments).
  57  |    * Looks in test-data/negative/{fileName}.json
  58  |    */
  59  |   loadNegativeData<T>(fileName: string): T {
  60  |     const filePath = path.join(
  61  |       this.testDataDir,
  62  |       'negative',
  63  |       `${fileName}.json`
  64  |     );
  65  |     return this.loadJsonFile<T>(filePath);
  66  |   }
  67  | 
  68  |   /**
  69  |    * Load common test data (shared across environments).
  70  |    * Looks in test-data/common/{fileName}.json
  71  |    */
  72  |   loadCommonData<T>(fileName: string): T {
  73  |     const filePath = path.join(
  74  |       this.testDataDir,
  75  |       'common',
  76  |       `${fileName}.json`
  77  |     );
  78  |     return this.loadJsonFile<T>(filePath);
  79  |   }
  80  | 
  81  |   /**
  82  |    * Load and return data for data-driven test generation.
  83  |    * Each item in the array becomes a separate test case.
  84  |    *
  85  |    * @example
  86  |    * ```typescript
  87  |    * const testCases = provider.getTestCases<TestCase>('invalid-auth');
  88  |    * for (const testCase of testCases) {
  89  |    *   test(`should fail with ${testCase.description}`, async () => { ... });
  90  |    * }
  91  |    * ```
  92  |    */
  93  |   getTestCases<T extends { description?: string }>(
  94  |     fileName: string,
  95  |     source: 'env' | 'negative' | 'common' = 'negative'
  96  |   ): T[] {
  97  |     switch (source) {
  98  |       case 'env':
  99  |         return this.loadEnvData<T[]>(fileName);
  100 |       case 'negative':
  101 |         return this.loadNegativeData<T[]>(fileName);
  102 |       case 'common':
  103 |         return this.loadCommonData<T[]>(fileName);
  104 |     }
  105 |   }
  106 | 
  107 |   /**
  108 |    * Load a JSON file and return parsed data.
  109 |    * Results are cached to avoid repeated disk reads.
  110 |    */
  111 |   private loadJsonFile<T>(filePath: string): T {
  112 |     // Check cache first
  113 |     if (this.cache.has(filePath)) {
  114 |       logger.debug(`Returning cached data for: ${filePath}`);
  115 |       return this.cache.get(filePath) as T;
  116 |     }
  117 | 
  118 |     if (!fs.existsSync(filePath)) {
  119 |       const errorMsg = `Test data file not found: ${filePath}`;
  120 |       logger.error(errorMsg);
  121 |       throw new Error(errorMsg);
  122 |     }
  123 | 
  124 |     try {
  125 |       const fileContent = fs.readFileSync(filePath, 'utf-8');
  126 |       const data = JSON.parse(fileContent) as T;
  127 |       this.cache.set(filePath, data);
  128 |       logger.debug(`Loaded test data from: ${filePath}`);
  129 |       return data;
  130 |     } catch (error) {
  131 |       const errorMsg = `Failed to parse test data file: ${filePath}`;
  132 |       logger.error(errorMsg, error);
> 133 |       throw new Error(errorMsg);
      |             ^ Error: Failed to parse test data file: /home/runner/work/Playwright-Automation---API/Playwright-Automation---API/test-data/negative/security-payloads.json
  134 |     }
  135 |   }
  136 | 
  137 |   /**
  138 |    * Clear the data cache (useful between test suites).
  139 |    */
  140 |   clearCache(): void {
  141 |     this.cache.clear();
  142 |     logger.debug('Data cache cleared');
  143 |   }
  144 | }
  145 | 
```