# http-client-python Architecture

This document provides a comprehensive overview of the `@typespec/http-client-python` emitter architecture and code generation pipeline. Understanding this architecture will help developers quickly navigate the codebase and contribute effectively.

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Details](#component-details)
  - [1. Emitter (TypeScript)](#1-emitter-typescript)
  - [2. Generator (Python)](#2-generator-python)
- [Code Generation Flow](#code-generation-flow)
- [Directory Structure](#directory-structure)
- [Key Concepts](#key-concepts)
- [Development Guide](#development-guide)

## Overview

The `@typespec/http-client-python` package is a TypeSpec emitter that generates Python SDK code from TypeSpec definitions. The emitter follows a two-stage architecture:

1. **Emitter Stage (TypeScript)**: Processes TypeSpec definitions and generates an intermediate YAML representation
2. **Generator Stage (Python)**: Transforms the YAML into Python SDK code using templates

This separation allows for language-specific code generation while maintaining a clean architecture.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        TypeSpec Compiler                        │
│                    (parses .tsp files)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Emitter (TypeScript)                         │
│  Location: packages/http-client-python/emitter/src/             │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  emitter.ts  │───▶│code-model.ts │───▶│   types.ts   │       │
│  │ (entry point)│    │(build model) │    │(type mapping)│       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                                                       │
│         │ Uses @azure-tools/typespec-client-generator-core      │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │         Intermediate YAML Code Model                 │       │
│  │  (contains clients, operations, models, types, etc.) │       │
│  └──────────────────────────────────────────────────────┘       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Generator (Python - pygen)                     │
│  Location: packages/http-client-python/generator/pygen/         │
│                                                                 │
│  Step 1: Preprocess                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  preprocess/                                             │   │
│  │  - Adds Python naming conventions (snake_case, etc.)     │   │
│  │  - Pads reserved words                                   │   │
│  │  - Adds body parameter overloads                         │   │
│  │  - Maps Python types                                     │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│                           │ Enhanced YAML                       │
│                           │                                     │
│  Step 2: Codegen          ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  codegen/                                                │   │
│  │                                                          │   │
│  │  ┌──────────┐      ┌──────────────┐    ┌─────────────┐   │   │
│  │  │ models/  │────▶│ serializers/ │───▶│ templates/  │   │    │
│  │  │ (Python  │      │ (Jinja2)     │    │ (.jinja2)   │   │   │
│  │  │  classes)│      │              │    │             │   │   │
│  │  └──────────┘      └──────────────┘    └─────────────┘   │   │
│  │       │                   │                    │         │   │
│  │       │                   │                    │         │   │
│  │       ▼                   ▼                    ▼         │   │
│  │  Structures data    Renders with       Jinja2 templates  │   │
│  │                     parameters                           │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│                ┌─────────────────────┐                          │
│                │  Generated Python   │                          │
│                │  SDK Files (.py)    │                          │
│                └─────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Emitter (TypeScript)

**Location**: `packages/http-client-python/emitter/src/`

The emitter bridges TypeSpec and Python code generation.

#### Key Files

- **`emitter.ts`**: Entry point that implements `$onEmit()`, creates SDK context, and invokes the Python generator
- **`code-model.ts`**: Builds the intermediate code model from TypeSpec (clients, operations, models, types)
- **`types.ts`**: Maps TypeSpec types to Python types
- **`http.ts`**: Processes HTTP operations and request/response structures
- **`lib.ts`**: Shared utilities, types, and diagnostic reporting

#### Responsibilities

1. Parse TypeSpec definitions using `typespec-client-generator-core`
2. Extract client information (endpoints, credentials, operations)
3. Build type mappings from TypeSpec to Python
4. Convert Markdown documentation to reStructuredText format
5. Generate intermediate YAML representation
6. Invoke Python generator with YAML input

### 2. Generator (Python)

**Location**: `packages/http-client-python/generator/pygen/`

The generator transforms the YAML code model into Python SDK code through two stages:

#### Step 1: Preprocess

Enhances the YAML with Python-specific information:

- Converts names to `snake_case` and pads Python reserved words
- Adds Python type hints and handles optional/required parameters
- Creates overloads for different content types (JSON, binary, multipart)
- Converts Markdown to reStructuredText for docstrings

**Main class**: `PreProcessPlugin` in `preprocess/__init__.py`

#### Step 2: Codegen

Transforms the enhanced YAML into Python files using a three-layer architecture:

1. **Models** (`codegen/models/`): Python classes that parse YAML into structured objects (CodeModel, Client, Operation, ModelType, EnumType, etc.)

2. **Serializers** (`codegen/serializers/`): Orchestrate code generation using Jinja2 templates (JinjaSerializer, ClientSerializer, ModelSerializer, etc.)

3. **Templates** (`codegen/templates/`): Jinja2 templates defining Python code structure (`.jinja2` files for clients, models, enums, operations, etc.)

**Example template usage**:

```python
{% for operation in operation_group.operations %}
def {{ operation.name }}(self, {{ operation.parameters }}):
    """{{ operation.description }}"""
    ...
{% endfor %}
```

## Code Generation Flow

### Detailed Step-by-Step Process

1. **TypeSpec Compilation**

   ```
   User runs: tsp compile . --emit=@typespec/http-client-python
   ```

2. **Emitter Initialization** (`emitter.ts`)
   - TypeSpec compiler calls `$onEmit()`
   - Creates `PythonSdkContext` using TCGC (TypeSpec Client Generator Core)
   - Loads emitter options from `tspconfig.yaml`

3. **Code Model Generation** (`code-model.ts`)
   - Traverses TypeSpec AST
   - Extracts clients, operations, models, enums
   - Maps types using `types.ts`
   - Builds YAML code model structure

4. **YAML Export**
   - Converts JavaScript objects to YAML
   - Saves to temporary file
   - Converts Markdown descriptions to reStructuredText

5. **Python Generator Invocation**
   - Emitter spawns Python process (or uses Pyodide)
   - Passes YAML file path and options
   - Python generator receives control

6. **Preprocessing** (`preprocess/__init__.py`)
   - Loads YAML file
   - Applies Python naming conventions
   - Pads reserved words
   - Adds type information
   - Creates operation overloads
   - Saves enhanced YAML

7. **Code Generation** (`codegen/__init__.py`)
   - Loads enhanced YAML
   - Creates `CodeModel` object hierarchy
   - Instantiates models for all code elements

8. **Serialization** (serializers)
   - `JinjaSerializer` orchestrates generation
   - Determines which files to create
   - For each file type:
     - Prepares model objects
     - Loads appropriate Jinja2 template
     - Renders template with model data
     - Writes output file

9. **Output**
   - Generated Python SDK files written to output directory
   - Package structure:
     ```
     output/
     ├── <package_name>/
     │   ├── __init__.py
     │   ├── _client.py
     │   ├── _configuration.py
     │   ├── _version.py
     │   ├── models/
     │   │   ├── __init__.py
     │   │   └── _models.py
     │   ├── operations/
     │   │   ├── __init__.py
     │   │   └── _operations.py
     │   └── aio/
     │       ├── __init__.py
     │       ├── _client.py
     │       └── operations/
     ├── setup.py (or pyproject.toml)
     ├── README.md
     └── CHANGELOG.md
     ```

## Directory Structure

```
packages/http-client-python/
├── emitter/                    # TypeScript emitter source
│   ├── src/
│   │   ├── emitter.ts         # Entry point
│   │   ├── code-model.ts      # Code model builder
│   │   ├── types.ts           # Type mappings
│   │   ├── http.ts            # HTTP operation handling
│   │   ├── lib.ts             # Shared utilities
│   │   └── ...
│   ├── test/                  # Emitter tests
│   ├── tsconfig.json
│   └── vitest.config.ts
├── generator/                 # Python generator
│   ├── pygen/
│   │   ├── __init__.py       # Entry point, options
│   │   ├── preprocess/       # Preprocessing stage
│   │   ├── codegen/          # Code generation stage
│   │   │   ├── models/      # Data models
│   │   │   ├── serializers/ # Jinja2 serializers
│   │   │   └── templates/   # Jinja2 templates
│   │   └── utils.py         # Utilities
│   ├── test/                 # Generator tests
│   ├── setup.py
│   └── dev_requirements.txt
├── eng/                      # Engineering scripts
│   └── scripts/
│       ├── setup/           # Setup scripts
│       └── ci/              # CI/CD scripts
├── package.json             # NPM package definition
├── README.md               # User documentation
├── CONTRIBUTING.md         # Contribution guide
└── ARCHITECTURE.md         # This file
```

## Key Concepts

### Code Model

The code model is an intermediate representation that bridges TypeSpec and Python. It's a tree structure containing:

- **Clients**: Top-level client classes
- **Operation Groups**: Collections of related operations
- **Operations**: Individual API methods
- **Models**: Data structures (classes)
- **Enums**: Enumeration types
- **Parameters**: Method parameters
- **Types**: Type system elements

### Type Mapping

TypeSpec types are mapped to Python types:

| TypeSpec  | Python                  |
| --------- | ----------------------- |
| `string`  | `str`                   |
| `int32`   | `int`                   |
| `float32` | `float`                 |
| `boolean` | `bool`                  |
| `bytes`   | `bytes`                 |
| Model     | `TypedDict` or class    |
| Enum      | `str` (with enum class) |
| Union     | `Union[...]`            |
| Array     | `List[...]`             |

### Operation Types

The emitter supports different operation patterns:

- **Basic**: Simple request-response
- **LRO (Long Running Operation)**: Async operations with polling
- **Paging**: Operations that return paginated results
- **LRO + Paging**: Combined pattern

### Model Modes

Two model generation modes:

1. **DPG (Data Plane Generator)**: Dictionary-based models using `TypedDict`
2. **MSRest**: Class-based models with serialization logic

## Development Guide

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- pnpm (for monorepo management)

### Setup

```bash
# Clone repository
git clone https://github.com/microsoft/typespec.git
cd typespec/packages/http-client-python

# Install dependencies
npm install

# Build
npm run build
```

### Making Changes

#### Emitter Changes (TypeScript)

1. Edit files in `emitter/src/`
2. Build: `npm run build` or `npm run watch`
3. Test: `npm run test:emitter`

#### Generator Changes (Python)

1. Edit files in `generator/pygen/`
2. Regenerate samples: `npm run regenerate`
3. Test: `npm run test:generator`

#### Template Changes

1. Edit `.jinja2` files in `generator/pygen/codegen/templates/`
2. Regenerate: `npm run regenerate`
3. Verify output in test directories

### Testing

```bash
# Run all tests
npm run ci

# Run emitter tests only
npm run test:emitter

# Run generator tests only
npm run test:generator

# Regenerate test outputs
npm run regenerate
```

### Debugging

**Emitter debugging**:

- Use VS Code debugger with TypeScript
- Add breakpoints in `emitter/src/`
- Inspect YAML output in temp directory

**Generator debugging**:

- Add Python breakpoints or print statements
- Inspect enhanced YAML after preprocessing
- Check generated files in output directory

## Additional Resources

- [Contributing Guide](./CONTRIBUTING.md)
- [TypeSpec Documentation](https://typespec.io)
- [TCGC Documentation](https://github.com/Azure/typespec-azure/tree/main/packages/typespec-client-generator-core)
- [Python SDK Guidelines](https://azure.github.io/azure-sdk/python_introduction.html)

## Support

- File issues: [TypeSpec Issues](https://github.com/microsoft/typespec/issues)
- Ask questions: [TypeSpec Discussions](https://github.com/microsoft/typespec/discussions)
