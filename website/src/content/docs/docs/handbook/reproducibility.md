---
title: Reproducibility
---

A crucial aspect of service definition is ensuring consistent output over time. This is important in scenarios such as:

- An update to a dependency or sub-dependency introduces an unexpected breaking change.
- Updates to a new version of a service should not impact older versions.
- Modifications are made to the TypeSpec specification.

These issues can be mitigated with a few precautionary measures:

## 1. Defend against dependency changes

_Note: This section applies if using `tsp install` or `npm install` to install dependencies. However other package managers (`yarn`, `pnpm`, etc.) have their own similar lock mechanisms._

When using `tsp install` or `npm install` a `package-lock.json` will be installed. This file SHOULD be committed to source control. It will ensure that later calls to `tsp install` or `npm install` will use the exact versions resolved in the lock files unless the `package.json` was updated or a command like `npm update` was run.

The command `npm ci` can also be used in the CI to ensure that the `package.json` and `package-lock.json` are in sync.

## 2. Work with multiple versions of a service

TypeSpec provides a library `@typespec/versioning` that can be used to describe changes to a service or library over time. Using this will ensure that a service can evolve while keeping track of the changes and allowing emitters to see the service representation at different versions.

[See versioning docs](../libraries/versioning/reference/index.mdx)

## 3. Change to the TypeSpec spec

If you don't directly control the spec, you might still want to make sure you remember which exact definition was used.
Using version control and pinning to a specific commit SHA will ensure that the spec will remain exactly as it was.

## Summary

1. Use `package-lock.json`
2. Use [versioning library](../libraries/versioning/reference/index.mdx)
3. Keep track of commit IDs
