# Cadl Eslint Plugin

## Installation

Install the package as a dev dependency.

```
npm install -D @cadl-lang/eslint-plugin
```

## Usage

Add the following to your eslint config

```yaml
plugins: ["@cadl-lang/eslint-plugin"],
extends: ["plugin:@cadl-lang/eslint-plugin/recommended"],
```

## Rules

- [call-decorator](./docs/rules/call-decorator.md)
