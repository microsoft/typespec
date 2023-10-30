---
title: Reproducibility
---

A key point to service definition is the ability to reliably reproduce the exact same output over time. In cases like:

1. A dependency or dependency of dependency was updated with an unintended breaking change
2. Changes to a new version of a service shouldn't affect the older versions
3. A change to the TypeSpec spec

This can be mitigated with a few steps:

## 1. Defend against dependency changes

_Note: This section applies if using `tsp install` or `npm install` to install dependencies. However other package managers (`yarn`, `pnpm`, etc.) have their own similar lock mechanisms._

When using `tsp install` or `npm install` a `package-lock.json` will be installed. This file SHOULD be committed to source control. It will ensure that later calls to `tsp install` or `npm install` will use the exact versions resolved in the lock files unless the `package.json` was updated or a command like `npm update` was run.

The command `npm ci` can also be used in the CI to ensure that the `package.json` and `package-lock.json` are in sync.

## 2. Work with multiple versions of a service

TypeSpec provides a library `@typespec/versioning` that can be used to describe changes to a service or library over time. Using this will ensure that a service can evolve while keeping track of the changes and allowing emitters to see the service representation at different versions.

[See versioning docs](../standard-library/versioning/reference/index.md)

## 3. Change to the TypeSpec spec

If you don't directly control the spec, you might still want to make sure you remember which exact definition was used.
Using version control and pinning to a specific commit SHA will ensure that the spec will remain exactly as it was.

## Summary

1. Use `package-lock.json`
2. Use [versioning library](../standard-library/versioning/reference/index.md)
3. Keep track of commit IDs
