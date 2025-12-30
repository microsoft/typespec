# Core Library for Python Generation

This directory contains the Python-based code generator that transforms YAML code models into Python SDK code.

## Overview

The generator (`pygen`) is the second stage of the `@typespec/http-client-python` pipeline. It receives a YAML code model from the TypeScript emitter and generates Python SDK files using a template-based approach.

## Architecture

The generator follows a two-stage process:

### Stage 1: Preprocess (`pygen/preprocess/`)

Enhances the YAML code model with Python-specific information:

- **Naming conventions**: Converts to `snake_case`, pads reserved words
- **Type mappings**: Adds Python type hints
- **Overloads**: Creates method overloads for different content types (JSON, binary)
- **Documentation**: Formats docstrings (Markdown to reStructuredText)

**Entry point**: `pygen/preprocess/__init__.py`

### Stage 2: Codegen (`pygen/codegen/`)

Generates Python files using a three-layer architecture:

1. **Models** (`codegen/models/`): Python classes representing code elements
   - Parse enhanced YAML into structured Python objects
   - Provide access to properties needed for code generation

2. **Serializers** (`codegen/serializers/`): Orchestrate template rendering
   - Use Jinja2 to render templates with model data
   - Manage file generation and output

3. **Templates** (`codegen/templates/`): Jinja2 templates defining Python code structure
   - Define the format and structure of generated files
   - Support both sync and async code generation

**Entry point**: `pygen/codegen/__init__.py`

## Directory Structure

```
pygen/
├── __init__.py              # Options management, base classes
├── utils.py                 # Shared utilities
├── preprocess/              # Stage 1: Preprocessing
│   ├── __init__.py         # PreProcessPlugin - main logic
│   ├── helpers.py          # Padding and naming helpers
│   └── python_mappings.py  # Reserved words, type mappings
└── codegen/                 # Stage 2: Code generation
    ├── __init__.py         # CodeGenerator - orchestrator
    ├── models/             # Data model classes
    │   ├── code_model.py   # Root model
    │   ├── client.py       # Client classes
    │   ├── operation*.py   # Operation types
    │   ├── model_type.py   # Data models
    │   ├── enum_type.py    # Enumerations
    │   └── ...
    ├── serializers/        # Template renderers
    │   ├── __init__.py     # JinjaSerializer - main coordinator
    │   ├── client_serializer.py
    │   ├── model_serializer.py
    │   └── ...
    └── templates/          # Jinja2 templates
        ├── client.py.jinja2
        ├── model_dpg.py.jinja2
        ├── enum.py.jinja2
        └── ...
```

## Usage

The generator is typically invoked by the TypeScript emitter, but can also be run standalone:

```bash
# Via emitter (normal usage)
tsp compile . --emit=@typespec/http-client-python

# Standalone (for testing)
python -m pygen.preprocess --output-folder ./output --tsp-file ./code-model.yaml
python -m pygen.codegen --output-folder ./output --tsp-file ./code-model.yaml
```

## Development

### Running Tests

```bash
# From http-client-python root
npm run test:generator
```

### Regenerating Test Samples

```bash
npm run regenerate
```

### Adding New Templates

1. Create `.jinja2` file in `codegen/templates/`
2. Create corresponding serializer in `codegen/serializers/`
3. Register serializer in `JinjaSerializer.serialize()` method

## Key Concepts

### Options

Generator behavior is controlled by options (from `tspconfig.yaml`):
- `package-name`: Python package name
- `package-version`: Version string
- `models-mode`: Model generation mode (`dpg` or `msrest`)
- `show-operations`: Whether to generate operation classes
- `version-tolerant`: Enable version-tolerant features
- And many more (see `OptionsDict` in `__init__.py`)

### Model Modes

- **DPG (Data Plane Generator)**: Dictionary-based models using `TypedDict`
- **MSRest**: Class-based models with serialization methods

### Operation Types

- **Basic**: Simple request-response
- **LRO**: Long-running operations with polling
- **Paging**: Paginated responses
- **LRO + Paging**: Combined pattern

## Additional Resources

- [Full Architecture Documentation](../ARCHITECTURE.md)
- [Contributing Guide](../CONTRIBUTING.md)
