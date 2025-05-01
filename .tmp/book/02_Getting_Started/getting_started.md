# Getting Started

## Setting Up the Development Environment

To begin using TypeSpec, you need to set up your development environment. This involves installing Node.js, the TypeSpec CLI, and verifying that everything is working correctly.

### Installing Node.js

1. Download Node.js from the official website: [nodejs.org](https://nodejs.org/).
2. Follow the installation instructions for your operating system.
3. Ensure that you install the minimum required versions:
   - Node.js: 20.0.0 or higher
   - npm: 7.0.0 or higher (npm is included with Node.js)

### Installing TypeSpec CLI

Once Node.js is installed, you can install the TypeSpec CLI globally using npm. Open your terminal and run the following command:

```bash
npm install -g @typespec/compiler
```

This command installs the TypeSpec compiler, which you will use to compile your TypeSpec definitions.

### Verifying Installation

To confirm that the TypeSpec CLI has been installed correctly, run the following command in your terminal:

```bash
tsp --version
```

If the installation was successful, you should see the version number of the TypeSpec CLI displayed in the terminal.

## Creating a New TypeSpec Project

After setting up your environment, you can create a new TypeSpec project. Follow these steps:

1. Open your terminal and navigate to the directory where you want to create your project.
2. Run the following command to initialize a new TypeSpec project:

```bash
tsp init
```

3. When prompted, select the `Generic REST API` template.
4. Install the project dependencies by running:

```bash
tsp install
```

5. Compile the initial TypeSpec file with:

```bash
tsp compile .
```

6. To automatically compile changes on save, use:

```bash
tsp compile . --watch
```

### Project Structure Overview

Once you've completed these steps, you'll have a basic TypeSpec project set up. Here's an overview of the files and directories in your TypeSpec project:

- **main.tsp**: Entry point for TypeSpec definitions.
- **tspconfig.yaml**: TypeSpec compiler configuration.
- **package.json**: Project metadata and dependencies.
- **node_modules/**: Installed dependencies.
- **tsp-output/**: Generated files, including the OpenAPI specification.

As you work through the tutorial, keep the `openapi.yaml` file open in your editor to watch the API specification evolve as you make changes.
