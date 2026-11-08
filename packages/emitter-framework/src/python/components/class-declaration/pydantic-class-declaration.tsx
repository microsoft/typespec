import { code, For, type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Model } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../../lib.js";
import { declarationRefkeys } from "../../utils/refkey.js";
import { DocElement } from "../doc-element/doc-element.js";
import { ClassBases } from "./class-bases.js";
import { ClassDeclaration } from "./class-declaration.js";
import { ClassMember } from "./class-member.js";
import { MethodProvider } from "./class-method.js";

/**
 * Structured Pydantic ConfigDict keywords, emitted with snake_case names.
 * Undefined entries are omitted so Pydantic, not this emitter, supplies their defaults.
 */
export interface PydanticModelConfigDictProps {
  /** Emits `arbitrary_types_allowed`, permitting fields of arbitrary Python classes when enabled. */
  arbitraryTypesAllowed?: boolean;
  /** Emits `extra`, selecting whether unknown input fields are retained, rejected, or ignored. */
  extra?: "allow" | "forbid" | "ignore";
  /** Emits `from_attributes`, allowing model construction from object attributes when enabled. */
  fromAttributes?: boolean;
  /** Emits `frozen`, requesting Pydantic's faux-immutable model behavior. */
  frozen?: boolean;
  /** Emits `populate_by_name`, allowing field-name input alongside aliases when enabled. */
  populateByName?: boolean;
  /** Emits `str_strip_whitespace`, requesting whitespace trimming for string values. */
  strStripWhitespace?: boolean;
  /** Emits `strict`, controlling whether validation may coerce input values. */
  strict?: boolean;
  /** Emits `validate_assignment`, requesting validation when existing fields are reassigned. */
  validateAssignment?: boolean;
  /** Emits `validate_default`, requesting validation of default field values. */
  validateDefault?: boolean;
}

/** Structured SettingsConfigDict keywords; undefined entries defer to pydantic-settings defaults. */
export interface PydanticSettingsConfigDictProps {
  /** Emits `case_sensitive`, controlling case matching for environment variable names. */
  caseSensitive?: boolean;
  /** Emits `env_file`, the dotenv path to read when instantiating the generated settings class. */
  envFile?: string;
  /** Emits `env_file_encoding`, the encoding used to read the dotenv file. */
  envFileEncoding?: string;
  /** Emits `env_ignore_empty`, controlling whether empty environment values are ignored. */
  envIgnoreEmpty?: boolean;
  /** Emits `env_nested_delimiter`, separating nested fields within environment variable names. */
  envNestedDelimiter?: string;
  /** Emits `env_prefix`, prepended to field names for environment lookup. */
  envPrefix?: string;
}

/** Manually named Pydantic class with optional structured or raw configuration content. */
export interface PydanticClassDeclarationBaseProps extends Omit<py.ClassDeclarationProps, "name"> {
  /** Name required when no TypeSpec model supplies one. */
  name: string;
  /** ConfigDict values; ignored when `modelConfigExpression` is supplied. */
  modelConfig?: PydanticModelConfigDictProps;
  /** Raw Python expression assigned to `model_config`; takes precedence even when empty or null. */
  modelConfigExpression?: Children;
}

/** TypeSpec model source for generated Pydantic fields, inheritance, and documentation. */
export interface PydanticClassDeclarationPropsWithType extends Omit<
  PydanticClassDeclarationBaseProps,
  "name"
> {
  /** Model supplying fields; models with additional-properties records are rejected. */
  type: Model;
  /** Name override, passed through the active Python class naming policy. */
  name?: string;
  /** Default method kind available to descendant {@link Method} components. */
  methodType?: "method" | "class" | "static";
}

/** Selects a model-derived Pydantic class or a manually composed class with configuration. */
export type PydanticClassDeclarationProps =
  PydanticClassDeclarationPropsWithType | PydanticClassDeclarationBaseProps;

function isTypedPydanticClassDeclarationProps(
  props: PydanticClassDeclarationProps,
): props is PydanticClassDeclarationPropsWithType {
  return "type" in props;
}

/**
 * Declares a Pydantic class, placing configuration before generated fields and custom children.
 * Uses BaseModel only when no explicit or type-derived bases exist. A raw config expression
 * takes precedence over structured config, whose undefined values are omitted.
 * Requires a TypeSpec render context even for manually composed classes.
 */
export function PydanticClassDeclaration(props: PydanticClassDeclarationProps) {
  const { $ } = useTsp();
  const configEntries: Array<[string, unknown]> = [];
  if (props.modelConfig && props.modelConfigExpression === undefined) {
    for (const key of Object.keys(props.modelConfig)) {
      const value = (props.modelConfig as Record<string, unknown>)[key];
      if (value !== undefined) {
        configEntries.push([toSnakeCase(key), value]);
      }
    }
  }
  const hasStructuredModelConfig =
    props.modelConfigExpression === undefined && configEntries.length > 0;
  const hasExpressionModelConfig = props.modelConfigExpression !== undefined;
  const configLine = hasExpressionModelConfig ? (
    <>
      {"model_config = "}
      {props.modelConfigExpression}
      <hbr />
    </>
  ) : hasStructuredModelConfig ? (
    <>
      {"model_config = "}
      {py.pydanticModule["."].ConfigDict}
      {"("}
      <For each={configEntries} comma space>
        {([k, v]) => (
          <>
            {k}=<py.Atom jsValue={v as any} />
          </>
        )}
      </For>
      {")"}
      <hbr />
    </>
  ) : undefined;

  if (!isTypedPydanticClassDeclarationProps(props)) {
    return (
      <ClassDeclaration {...props} bases={props.bases ?? [py.pydanticModule["."].BaseModel]}>
        {configLine}
        {props.children}
      </ClassDeclaration>
    );
  }

  const docSource = props.doc ?? $.type.getDoc(props.type);
  const docElement = docSource ? <DocElement doc={docSource} component={py.ClassDoc} /> : undefined;
  const namePolicy = py.usePythonNamePolicy();

  let name = props.name ?? props.type.name;
  if (!name) {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: props.type });
  }
  name = namePolicy.getName(name, "class");

  // Pydantic models currently don't support anonymous additional properties.
  const additionalPropsRecord = $.model.getAdditionalPropertiesRecord(props.type);
  if (additionalPropsRecord) {
    throw new Error("Models with additional properties (Record[…]) are not supported");
  }
  const modelMembers = Array.from($.model.getProperties(props.type).values());

  const refkeys = declarationRefkeys(props.refkey, props.type);

  const bases = ClassBases({
    type: props.type,
    bases: props.bases,
  });
  const resolvedBases =
    props.bases === undefined && bases.length === 0 ? [py.pydanticModule["."].BaseModel] : bases;

  return (
    <MethodProvider value={props.methodType}>
      <py.ClassDeclaration
        doc={docElement}
        name={name}
        refkey={refkeys}
        {...(resolvedBases.length ? { bases: resolvedBases } : {})}
      >
        {configLine}
        <For each={modelMembers} line>
          {(typeMember) => <ClassMember type={typeMember} methodType={props.methodType} />}
        </For>
        {/* Allow callers to append custom class content after generated members. */}
        <>{props.children}</>
      </py.ClassDeclaration>
    </MethodProvider>
  );
}

/** Manually named settings-class props; the wrapper owns its base class and configuration slots. */
type PydanticSettingsClassDeclarationBaseProps = Omit<
  PydanticClassDeclarationBaseProps,
  "bases" | "modelConfig" | "modelConfigExpression"
>;

/** Model-derived settings props with the BaseSettings base and settings-specific configuration supplied by the wrapper. */
type PydanticSettingsClassDeclarationPropsWithType = Omit<
  PydanticClassDeclarationPropsWithType,
  "bases" | "modelConfig" | "modelConfigExpression"
>;

/** Settings class source plus either structured settings keywords or a raw configuration expression. */
export type PydanticSettingsClassDeclarationProps =
  | (PydanticSettingsClassDeclarationBaseProps & {
      /** SettingsConfigDict values; ignored when `settingsConfigExpression` is supplied. */
      settingsConfig?: PydanticSettingsConfigDictProps;
      /** Raw expression assigned to `model_config`, taking precedence over structured settings. */
      settingsConfigExpression?: Children;
    })
  | (PydanticSettingsClassDeclarationPropsWithType & {
      /** SettingsConfigDict values; ignored when `settingsConfigExpression` is supplied. */
      settingsConfig?: PydanticSettingsConfigDictProps;
      /** Raw expression assigned to `model_config`, taking precedence over structured settings. */
      settingsConfigExpression?: Children;
    });

/**
 * Convenience wrapper for classes that inherit from pydantic-settings BaseSettings.
 */
export function PydanticSettingsClassDeclaration(props: PydanticSettingsClassDeclarationProps) {
  const { settingsConfig, settingsConfigExpression, ...classProps } = props;
  const configEntries: Array<[string, unknown]> = [];
  if (settingsConfig && settingsConfigExpression === undefined) {
    for (const key of Object.keys(settingsConfig)) {
      const value = (settingsConfig as Record<string, unknown>)[key];
      if (value !== undefined) {
        configEntries.push([toSnakeCase(key), value]);
      }
    }
  }

  const hasStructuredConfig = settingsConfigExpression === undefined && configEntries.length > 0;
  const hasExpressionConfig = settingsConfigExpression !== undefined;

  const modelConfigExpression = hasExpressionConfig ? (
    settingsConfigExpression
  ) : hasStructuredConfig ? (
    <>
      {py.pydanticSettingsModule["."].SettingsConfigDict}
      {"("}
      <For each={configEntries} comma space>
        {([k, v]) => (
          <>
            {k}=<py.Atom jsValue={v as any} />
          </>
        )}
      </For>
      {")"}
    </>
  ) : undefined;

  return (
    <PydanticClassDeclaration
      {...classProps}
      bases={[py.pydanticSettingsModule["."].BaseSettings]}
      modelConfigExpression={modelConfigExpression}
    />
  );
}

/** Alloy class options for a RootModel specialization; the wrapper supplies its sole base expression. */
export interface PydanticRootModelDeclarationProps extends Omit<py.ClassDeclarationProps, "bases"> {
  /** Python type expression used as the RootModel generic argument, not a TypeSpec Type object. */
  rootType: Children;
}

/**
 * Convenience wrapper for pydantic RootModel[T] declarations.
 */
export function PydanticRootModelDeclaration(props: PydanticRootModelDeclarationProps) {
  const { rootType, ...classProps } = props;
  return (
    <py.ClassDeclaration
      {...classProps}
      bases={[code`${py.pydanticModule["."].RootModel}[${rootType}]`]}
    />
  );
}

function toSnakeCase(value: string): string {
  return value.replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
