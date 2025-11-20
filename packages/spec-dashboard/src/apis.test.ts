import { describe, it, expect } from "vitest";
import { ScenarioManifest } from "@typespec/spec-coverage-sdk";
import { splitManifestByTables, TableDefinition } from "./apis.js";

describe("splitManifestByTables", () => {
  const createManifest = (
    packageName: string,
    displayName?: string,
    scenarioNames: string[] = [],
  ): ScenarioManifest => ({
    packageName,
    displayName,
    commit: "abc123",
    version: "1.0.0",
    scenarios: scenarioNames.map((name) => ({
      name,
      scenarioDoc: `Doc for ${name}`,
      location: {
        path: "test.tsp",
        start: { line: 1, character: 1 },
        end: { line: 2, character: 1 },
      },
    })),
  });

  it("should use displayName as default table name when no table definitions", () => {
    const manifest = createManifest("test-package", "Test Display Name", ["scenario1"]);
    const result = splitManifestByTables(manifest, []);

    expect(result).toHaveLength(1);
    expect(result[0].tableName).toBe("Test Display Name");
  });

  it("should fall back to packageName when displayName is empty", () => {
    const manifest = createManifest("test-package", undefined, ["scenario1"]);
    const result = splitManifestByTables(manifest, []);

    expect(result).toHaveLength(1);
    expect(result[0].tableName).toBe("test-package");
  });

  it("should use table.name from table definition", () => {
    const manifest = createManifest("test-package", "Display Name", [
      "prefix1_scenario1",
      "prefix1_scenario2",
    ]);
    const tables: TableDefinition[] = [
      {
        name: "Custom Table Name",
        packageName: "test-package",
        prefixes: ["prefix1_"],
      },
    ];

    const result = splitManifestByTables(manifest, tables);

    expect(result).toHaveLength(1);
    expect(result[0].tableName).toBe("Custom Table Name");
    expect(result[0].manifest.scenarios).toHaveLength(2);
  });

  it("should not include scenarios in catch-all table if already assigned to specific table", () => {
    const manifest = createManifest("test-package", "Display Name", [
      "prefix1_scenario1",
      "prefix1_scenario2",
      "other_scenario",
    ]);
    const tables: TableDefinition[] = [
      {
        name: "Prefix1 Table",
        packageName: "test-package",
        prefixes: ["prefix1_"],
      },
      {
        name: "Catch All Table",
        packageName: "test-package",
        // No prefixes - catch-all table
      },
    ];

    const result = splitManifestByTables(manifest, tables);

    expect(result).toHaveLength(2);
    
    // First table should have prefix1 scenarios
    const prefix1Table = result.find((r) => r.tableName === "Prefix1 Table");
    expect(prefix1Table).toBeDefined();
    expect(prefix1Table!.manifest.scenarios).toHaveLength(2);
    expect(prefix1Table!.manifest.scenarios.map((s) => s.name)).toEqual([
      "prefix1_scenario1",
      "prefix1_scenario2",
    ]);

    // Catch-all table should only have the remaining scenario
    const catchAllTable = result.find((r) => r.tableName === "Catch All Table");
    expect(catchAllTable).toBeDefined();
    expect(catchAllTable!.manifest.scenarios).toHaveLength(1);
    expect(catchAllTable!.manifest.scenarios[0].name).toBe("other_scenario");
  });

  it("should process tables with prefixes before catch-all tables", () => {
    const manifest = createManifest("test-package", "Display Name", [
      "prefix1_scenario1",
      "prefix2_scenario1",
      "other_scenario",
    ]);
    const tables: TableDefinition[] = [
      {
        name: "Catch All Table",
        packageName: "test-package",
        // No prefixes - should be processed last
      },
      {
        name: "Prefix1 Table",
        packageName: "test-package",
        prefixes: ["prefix1_"],
      },
      {
        name: "Prefix2 Table",
        packageName: "test-package",
        prefixes: ["prefix2_"],
      },
    ];

    const result = splitManifestByTables(manifest, tables);

    expect(result).toHaveLength(3);

    // Verify each table got the correct scenarios
    const prefix1Table = result.find((r) => r.tableName === "Prefix1 Table");
    expect(prefix1Table!.manifest.scenarios).toHaveLength(1);
    expect(prefix1Table!.manifest.scenarios[0].name).toBe("prefix1_scenario1");

    const prefix2Table = result.find((r) => r.tableName === "Prefix2 Table");
    expect(prefix2Table!.manifest.scenarios).toHaveLength(1);
    expect(prefix2Table!.manifest.scenarios[0].name).toBe("prefix2_scenario1");

    const catchAllTable = result.find((r) => r.tableName === "Catch All Table");
    expect(catchAllTable!.manifest.scenarios).toHaveLength(1);
    expect(catchAllTable!.manifest.scenarios[0].name).toBe("other_scenario");
  });

  it("should handle unmatched scenarios in default table when no catch-all", () => {
    const manifest = createManifest("test-package", "Display Name", [
      "prefix1_scenario1",
      "other_scenario",
    ]);
    const tables: TableDefinition[] = [
      {
        name: "Prefix1 Table",
        packageName: "test-package",
        prefixes: ["prefix1_"],
      },
    ];

    const result = splitManifestByTables(manifest, tables);

    expect(result).toHaveLength(2);

    // Prefix table
    const prefix1Table = result.find((r) => r.tableName === "Prefix1 Table");
    expect(prefix1Table!.manifest.scenarios).toHaveLength(1);
    expect(prefix1Table!.manifest.scenarios[0].name).toBe("prefix1_scenario1");

    // Default table with displayName
    const defaultTable = result.find((r) => r.tableName === "Display Name");
    expect(defaultTable).toBeDefined();
    expect(defaultTable!.manifest.scenarios).toHaveLength(1);
    expect(defaultTable!.manifest.scenarios[0].name).toBe("other_scenario");
  });

  it("should handle multiple prefixes in a single table", () => {
    const manifest = createManifest("test-package", "Display Name", [
      "prefix1_scenario1",
      "prefix2_scenario1",
      "prefix1_scenario2",
    ]);
    const tables: TableDefinition[] = [
      {
        name: "Combined Table",
        packageName: "test-package",
        prefixes: ["prefix1_", "prefix2_"],
      },
    ];

    const result = splitManifestByTables(manifest, tables);

    expect(result).toHaveLength(1);
    expect(result[0].tableName).toBe("Combined Table");
    expect(result[0].manifest.scenarios).toHaveLength(3);
  });

  it("should not duplicate scenarios across tables", () => {
    const manifest = createManifest("test-package", "Display Name", [
      "shared_scenario1",
      "unique_scenario",
    ]);
    const tables: TableDefinition[] = [
      {
        name: "Table 1",
        packageName: "test-package",
        prefixes: ["shared_"],
      },
      {
        name: "Table 2",
        packageName: "test-package",
        prefixes: ["shared_"], // Same prefix - should not get scenarios already in Table 1
      },
    ];

    const result = splitManifestByTables(manifest, tables);

    // First table gets the shared scenario
    const table1 = result.find((r) => r.tableName === "Table 1");
    expect(table1!.manifest.scenarios).toHaveLength(1);
    expect(table1!.manifest.scenarios[0].name).toBe("shared_scenario1");

    // Second table should be empty (no scenarios left with shared_ prefix)
    const table2 = result.find((r) => r.tableName === "Table 2");
    expect(table2).toBeUndefined(); // Table 2 shouldn't be in results if it has no scenarios

    // Unmatched scenario goes to default table
    const defaultTable = result.find((r) => r.tableName === "Display Name");
    expect(defaultTable!.manifest.scenarios).toHaveLength(1);
    expect(defaultTable!.manifest.scenarios[0].name).toBe("unique_scenario");
  });
});

