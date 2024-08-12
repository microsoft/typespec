import { Languages } from "@autorest/codemodel";
import { deconstruct, fixLeadingNumber, removeSequentialDuplicates } from "@azure-tools/codegen";
import pkg from "lodash";
import { Style, Styler } from "./formatter.js";
const { last } = pkg;

export function getNameOptions(typeName: string, components: Array<string>) {
  const result = new Set<string>();

  // add a variant for each incrementally inclusive parent naming scheme.
  for (let i = 0; i < components.length; i++) {
    const subset = Style.pascal([
      ...removeSequentialDuplicates(components.slice(-1 * i, components.length)),
    ]);
    result.add(subset);
  }

  // add a second-to-last-ditch option as <typename>.<name>
  result.add(
    Style.pascal([
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ...removeSequentialDuplicates([
        ...fixLeadingNumber(deconstruct(typeName)),
        ...deconstruct(last(components)!),
      ]),
    ])
  );
  return [...result.values()];
}

interface SetNameOptions {
  /**
   * Remove consecutive duplicate words in the name.
   * @example "FooBarBarSomething" -> "FooBarSomething"
   */
  removeDuplicates?: boolean;

  /**
   * Error message if a name is empty.
   */
  nameEmptyErrorMessage?: string;
}

const setNameDefaultOptions = Object.freeze({
  removeDuplicates: true,
});

export interface Nameable {
  language: Languages;
}

export class NamingService {
  public constructor() {}

  public setName(
    thing: Nameable,
    styler: Styler,
    defaultValue: string,
    overrides: Record<string, string>,
    options?: SetNameOptions
  ) {
    this.setNameAllowEmpty(thing, styler, defaultValue, overrides, options);
    // if (!thing.language.default.name) {
    //   this.session.error(options?.nameEmptyErrorMessage ?? getNameEmptyError(thing), ["Prenamer", "NameEmpty"], thing);
    // }
  }

  public setNameAllowEmpty(
    thing: Nameable,
    styler: Styler,
    defaultValue: string,
    overrides: Record<string, string>,
    options?: SetNameOptions
  ) {
    options = { ...setNameDefaultOptions, ...options };
    thing.language.default.name = styler(
      defaultValue && isUnassigned(thing.language.default.name)
        ? defaultValue
        : thing.language.default.name,
      options.removeDuplicates,
      overrides
    );
  }
}

export function isUnassigned(value: string) {
  return !value || value.indexOf("·") > -1;
}

export interface ScopeNamerOptions {
  deduplicateNames?: boolean;
  overrides?: Record<string, string>;
}

interface NamerEntry {
  entity: Nameable;
  styler: Styler;
  initialName: string;
}

/**
 * Class that will style and resolve unique names for entities in the same scope.
 */
export class ScopeNamer {
  private names = new Map<string, NamerEntry[]>();

  public constructor(private options: ScopeNamerOptions) {}

  /**
   * Add a nameable entity to be styled and named.
   * @param entity Nameable entity.
   * @param styler Styler to use to render name.
   * @param defaultName Default name in case entity doesn't have any specified.
   */
  public add(entity: Nameable, styler: Styler, defaultName?: string) {
    const initialName =
      defaultName && isUnassigned(entity.language.default.name)
        ? defaultName
        : entity.language.default.name;

    const name = styler(initialName, false, this.options.overrides);
    const list = this.names.get(name);
    const entry = { entity, styler, initialName };
    if (list) {
      list.push(entry);
    } else {
      this.names.set(name, [entry]);
    }
  }

  /**
   * Returns true if the name is already used in this scope.
   * @param name Name to check
   * @returns Boolean
   */
  public isUsed(name: string): boolean {
    return this.names.has(name);
  }

  /**
   * Trigger the renaming process.
   * Will go over all the entity and find best possible names.
   */
  public process() {
    const state = this.processSimplifyNames();
    if (this.options.deduplicateNames) {
      this.deduplicateNames(state);
    }
  }

  /**
   * 1st pass of the name resolving where it tries to simplify names with duplicate consecutive words.
   */
  private processSimplifyNames(): Map<string, Nameable[]> {
    const processedNames = new Map<string, Nameable[]>();
    for (const [name, entities] of this.names.entries()) {
      for (const { entity, styler, initialName } of entities) {
        let selectedName = name;
        const noDupName = styler(initialName, true, this.options.overrides);
        if (noDupName !== name) {
          if (!this.names.has(noDupName) && !processedNames.has(noDupName)) {
            selectedName = noDupName;
          }
        }

        entity.language.default.name = selectedName;
        const entries = processedNames.get(selectedName);
        if (entries) {
          entries.push(entity);
        } else {
          processedNames.set(selectedName, [entity]);
        }
      }
    }
    return processedNames;
  }

  /**
   * 2nd pass of the name resolving where it will deduplicate names used twice.
   */
  private deduplicateNames(names: Map<string, Nameable[]>) {
    const entityNames = new Set(names.keys());
    for (const [_, entries] of names.entries()) {
      if (entries.length > 1) {
        for (const entity of entries.slice(1)) {
          this.deduplicateSchemaName(entity, entityNames);
        }
      }
    }
  }

  /**
   * Tries to find a new compatible name for the given schema.
   */
  private deduplicateSchemaName(schema: Nameable, entityNames: Set<string>): void {
    const schemaName = schema.language.default.name;
    const maxDedupes = 1000;
    if (entityNames.has(schemaName)) {
      for (let i = 1; i <= maxDedupes; i++) {
        const newName = `${schemaName}AutoGenerated${i === 1 ? "" : i}`;
        if (!entityNames.has(newName)) {
          schema.language.default.name = newName;
          entityNames.add(newName);
          // this.session.warning(`Deduplicating schema name: '${schemaName}' -> '${newName}'`, [
          //   "PreNamer/DeduplicateName",
          // ]);
          return;
        }
      }

      // this.session.error(
      //   `Attempted to deduplicate schema name '${schema.language.default.name}' more than ${maxDedupes} times and failed.`,
      //   ["PreNamer/DeduplicateName"],
      // );
    }

    entityNames.add(schemaName);
  }
}
