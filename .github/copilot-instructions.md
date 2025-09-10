# TypeSpec Copilot Instructions

**ALWAYS follow these instructions first and only fall back to additional search and context gathering if the information here is incomplete or found to be in error.**

TypeSpec is a language for defining cloud service APIs and shapes. This monorepo contains the TypeSpec compiler, standard library packages, tools, documentation, and various language client emitters.

## Essential Setup and Build Commands

### Prerequisites and Installation

- Install Node.js 20 LTS: `curl -fsSL https://nodejs.org/dist/v20.19.4/node-v20.19.4-linux-x64.tar.xz | tar -xJ --strip-components=1 -C /usr/local`
- Install pnpm globally: `npm install -g pnpm`
- Install dependencies: `pnpm install` (takes ~1.5 minutes)
- Install Playwright browsers (optional for UI testing): `npx playwright install`

### Building the Project

- **CRITICAL**: Build the entire project: `pnpm build` (takes ~7 minutes, NEVER CANCEL - set timeout to 15+ minutes)
- Build in watch mode for development: `pnpm watch`
- Build specific package: `pnpm -r --filter "<package-name>..." build`
- Clean build artifacts: `pnpm clean`

### Testing and Validation

- **CRITICAL**: Run all tests: `pnpm test` (takes ~5 minutes, NEVER CANCEL - set timeout to 10+ minutes)
- Run E2E tests: `pnpm test:e2e` and `node e2e/e2e-tests.js` (~1 minute)
- Run tests with coverage: `pnpm test:ci`
- Run tests in watch mode (in specific package): `pnpm test:watch`

### Code Quality

- Check formatting: `pnpm format:check` (~1 minute)
- Format code: `pnpm format`
- Run linting: `pnpm lint` (~1 minute)
- Fix lint issues: `pnpm lint:fix`

### Essential TypeSpec Development Workflow

1. **ALWAYS** run the full build process after repository clone: `pnpm install && pnpm build`
2. Start watch mode: `pnpm watch`
3. Test TypeSpec compilation works:

   ```bash
   # Create test project
   mkdir test-tsp && cd test-tsp
   echo 'import "@typespec/rest"; import "@typespec/openapi3"; op ping(): void;' > main.tsp
   echo '{"dependencies": {"@typespec/compiler": "latest", "@typespec/rest": "latest", "@typespec/openapi3": "latest"}}' > package.json
   
   # Install and compile
   /path/to/typespec/packages/compiler/cmd/tsp.js install
   /path/to/typespec/packages/compiler/cmd/tsp.js compile main.tsp --emit @typespec/openapi3
   ```

4. Always format and lint before completing changes: `pnpm format && pnpm lint:fix`

## Repository Structure

### Key Packages (packages/)

- **compiler**: Core TypeSpec compiler and CLI tool
- **http, rest, openapi3**: Standard HTTP/REST API libraries
- **versioning**: API versioning support
- **json-schema**: JSON Schema emitter
- **prettier-plugin-typespec**: Code formatting support
- **typespec-vscode, typespec-vs**: Editor extensions
- **playground**: Interactive TypeSpec playground
- **website**: Documentation website (typespec.io)

### Important Directories

- `/packages/`: All TypeSpec packages and libraries
- `/e2e/`: End-to-end integration tests
- `/website/`: Documentation website source
- `/eng/`: Build engineering and automation scripts
- `/.github/workflows/`: CI/CD pipeline definitions

## Manual Validation After Changes

**ALWAYS perform these validation steps after making changes:**

1. **Basic functionality test**: Create and compile a simple TypeSpec file as shown above
2. **Build validation**: Run full build to ensure no build breaks: `pnpm build`
3. **Test validation**: Run relevant tests: `pnpm test`
4. **Code quality**: Ensure formatting and linting pass: `pnpm format:check && pnpm lint`

## Website Development

- Navigate to website: `cd website`
- Start development server: `pnpm start` (runs on port 4321)
- Build website: `pnpm build`
- The website includes documentation, API references, and the playground

## Critical Timing and Performance Notes

- **NEVER CANCEL** long-running commands - builds can take 7+ minutes, tests 5+ minutes
- Set explicit timeouts: Build commands need 15+ minutes, test commands need 10+ minutes
- Package installation: ~1.5 minutes
- Full rebuild from clean state: ~7 minutes
- Full test suite: ~5 minutes
- Lint check: ~1 minute
- E2E tests: ~1 minute

## Common Development Tasks

- Add change description: `pnpm change add`
- Generate external signatures: `pnpm gen-compiler-extern-signature`
- Regenerate samples: `pnpm regen-samples`
- Regenerate docs: `pnpm regen-docs`
- Sync dependency versions: `pnpm fix-version-mismatch`

## Troubleshooting

- If builds fail with watch mode conflicts, run: `pnpm clean && pnpm build`
- For installation issues, try: `pnpm install-conflict`
- If TypeScript compilation fails, check that compiler built first: `pnpm -r --filter "@typespec/compiler" build`
- For VS Code extension development, ensure you have the workspace open at the repository root

## Available Task Instructions

- [Testserver Generation](./prompts/testserver-generation.md): Instructions for generating TypeSpec HTTP spec test servers
- [http-client-csharp Development](./prompts/http-client-csharp-development.md): Instructions for developing the C# HTTP client
- [http-client-java Development](../packages/http-client-java/.github/copilot-instructions.md): Instructions for developing the TypeSpec library for Java client.
