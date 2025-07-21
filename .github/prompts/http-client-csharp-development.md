# http-client-csharp Development

## Setup

- These setup instructions supercede those from copilot-instructions. There is no need to run any `pnpm` commands when working on http-client-csharp development. There is also no need to add change logs.
- http-client-csharp code is located under `packages/http-client-csharp`.
- For any tasks that do not involve changes to the `package.json` file, perform the following steps:
  - Run `npm ci`
  - Run `npm run build`
- If the task involves changing the emitter dependencies in `package.json`, run `npm install` instead of `npm ci`. You will still need to run `npm run build`.

## Development & Testing

- Add tests to the appropriate test file that covers the fix/feature.
- Validate the test fails as the feature/fix has not yet been implemented.
- Implement the feature/fix
- Validate that the test now passes.
- Add negative test cases as well as positive test cases.
- When adding new tests look for an existing test class that would be appropriate. Only create a new test class if you are adding a new TypeProvider or there is otherwise no existing test class that would make sense.
- If your test requires inputting C# code (either to test customization or to validate the expected output), put the code in a new file under the TestData folder for the corresponding test class. Do not inline literal C# test code. Examine tests that use `Helpers.GetExpectedFromTest` to determine the correct folder structure for TestData files.
- Regenerate all generated libraries by running `eng/scripts/Generate.ps1`.
- Ensure all unit tests are passing.
- Do not comment out or delete any existing tests.
