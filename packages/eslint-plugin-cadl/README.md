# TypeSpec Eslint Plugin

## Installation

Install the package as a dev dependency.

```
npm install -D @typespec/eslint-plugin
```

## Usage

Add the following to your eslint config

```yaml
plugins: ["@typespec/eslint-plugin"],
extends: ["plugin:@typespec/eslint-plugin/recommended"],
```

## Rules

- [call-decorator](./docs/rules/call-decorator.md)
