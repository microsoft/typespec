import { For, type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Model } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../../lib.js";
import { pydanticModule } from "../../builtins.js";
import { declarationRefkeys } from "../../utils/refkey.js";
import { ClassMember } from "./class-member.js";
import { DocElement } from "../doc-element/doc-element.js";
import { ClassDeclaration } from "./class-declaration.js";
import { ClassBases } from "./class-bases.js";
import { MethodProvider } from "./class-method.js";

export interface PydanticModelConfigDictProps {
  arbitraryTypesAllowed?: boolean;
  extra?: "allow" | "forbid" | "ignore";
  fromAttributes?: boolean;
  frozen?: boolean;
  populateByName?: boolean;
  strStripWhitespace?: boolean;
  strict?: boolean;
  validateAssignment?: boolean;
  validateDefault?: boolean;
}

export interface PydanticClassDeclarationBaseProps extends Omit<py.ClassDeclarationProps, "name"> {
  name: string;
  modelConfig?: PydanticModelConfigDictProps;
  modelConfigExpression?: Children;
}

export interface PydanticClassDeclarationPropsWithType
  extends Omit<PydanticClassDeclarationBaseProps, "name"> {
  type: Model;
  name?: string;
  methodType?: "method" | "class" | "static";
}

export type PydanticClassDeclarationProps =
  | PydanticClassDeclarationPropsWithType
  | PydanticClassDeclarationBaseProps;

function isTypedPydanticClassDeclarationProps(
  props: PydanticClassDeclarationProps,
): props is PydanticClassDeclarationPropsWithType {
  return "type" in props;
}

/**
 * Converts TypeSpec Models to Pydantic classes.
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
  const hasStructuredModelConfig = props.modelConfigExpression === undefined && configEntries.length > 0;
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
      {pydanticModule["."].ConfigDict}
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
      <ClassDeclaration
        {...props}
        bases={props.bases ?? [pydanticModule["."].BaseModel]}
      >
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
    props.bases === undefined && bases.length === 0
      ? [pydanticModule["."].BaseModel]
      : bases;

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
          {(typeMember) => (
            <ClassMember type={typeMember} methodType={props.methodType} />
          )}
        </For>
        {/* Allow callers to append custom class content after generated members. */}
        <>
          {props.children}
        </>
      </py.ClassDeclaration>
    </MethodProvider>
  );
}

function toSnakeCase(value: string): string {
  return value.replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
