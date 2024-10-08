import { Child, Children, createContext, DeclarationProps, Indent, mapJoin, refkey, Scope, useContext } from "@alloy-js/core";
import { usePythonNamePolicy } from "../name-policy.js";
import { Model, Enum, ModelProperty, Type, EnumMember } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { ClassVariable, ConstantDeclaration, Declaration, Decorator, DecoratorProps, InitDeclaration, PythonModuleContext, TypeExpression, useModule } from "./index.js";
import { Docstring } from "./docstring.jsx";

export enum ClassDeclarationFlags {
  None      = 0,
  Enum      = 1 << 0,
  Dataclass = 1 << 1,
}

export interface ClassDeclarationContext {
  parent: PythonModuleContext | ClassDeclarationContext; // TODO: | FunctionDeclarationContext | MethodDeclarationContext;
  className: string;
  flags: ClassDeclarationFlags;
}

export const ClassDeclarationContext = createContext<ClassDeclarationContext>();

export function useClass() {
  return useContext(ClassDeclarationContext);
}

/**
 * Represents the properties for a class declaration.
 */
export interface ClassDeclarationProps extends DeclarationProps {
  type?: Model | Enum;
  name?: string;
  docstring?: string | null;
  decorators?: DecoratorProps[];
  extends?: string[]; // needs to also include references
  dataclass?: boolean;
  children?: Children;
}

export function ClassDeclaration(props: ClassDeclarationProps) {
  const namer = usePythonNamePolicy();
  const type = props.type;

  const parentContext = useClass() ?? useModule();
  if (!parentContext) {
    throw new Error("ClassDeclaration must be a child of a PythonModuleContext or ClassDeclarationContext.");
  }

  let name: string;
  const instanceProperties: ModelProperty[] = [];
  const classProperties: ModelProperty[] = [];
  let constants: (ModelProperty | EnumMember)[] = [];
  let constantComponents: any[] = [];
  let baseClassComponent: Child | undefined;
  let initializerComponent: Child | undefined = undefined;
  const context: ClassDeclarationContext = {
    parent: parentContext,
    className: "",
    flags: ClassDeclarationFlags.None,
  };

  if (type?.kind == "Model") {
    if ($.type.isTemplateDeclaration(type)) {
      return undefined;
    }
    name = props.name ?? namer.getName(getTypeName(type), "class");
    for (const prop of type.properties.values()) {
      if ($.literal.is(prop.type)) {
        constants.push(prop);
      } else {
        instanceProperties.push(prop);
      }
    }
    const baseClass = type.baseModel;
    baseClassComponent = baseClass ? <>(<TypeExpression type={baseClass} />)</> : undefined;
    initializerComponent = instanceProperties.length === 0 ? undefined : <InitDeclaration type={type}/>;
  } else if (type?.kind == "Enum") {
    constants = [...type.members.values()];
    context.flags = ClassDeclarationFlags.Enum;
    name = props.name ?? namer.getName(type.name, "class");
    const baseClasses = props.extends ?? [];
    if (!baseClasses.includes("Enum")) {
      baseClasses.push("Enum");
    }
    baseClassComponent = <>({baseClasses.join(", ")})</>;
  } else {
    if (!props.name) {
      throw new Error("ClassDeclaration must have a name when type is not specified.");
    }
    name = props.name;
  }

  constantComponents = mapJoin(
    constants,
    (member) => {
      if (member.kind === "EnumMember") {
        const value = member.value ?? member.name;
        return <ConstantDeclaration name={member.name} value={value} />;
      } else if (member.kind === "ModelProperty") {
        const value = (member.type as any).value;
        return <ConstantDeclaration name={member.name} value={value} />;
      }
    },
    { ender: "\n" }
  );
  const classVariableComponents = mapJoin(
    classProperties,
    (prop) => <ClassVariable type={prop} />,
    { ender: "\n" } 
  );

  // TODO: Implement these
  const methodComponents = undefined;
  const decoratorComponents = mapJoin(
    props.decorators ?? [],
    (decorator) => <Decorator {...decorator} />,
    { ender: "\n" }
  );

  // if the class has no contents (no variables, no methods), then we can just pass
  let pass: string | undefined = undefined;
  if (!classVariableComponents?.length && !initializerComponent && !methodComponents && !props.children && !constantComponents?.length) {
    pass = "pass";
  }

  // store the className in the context for use by children
  context.className = name;

  // give props a refkey and ensure the name is reflected since it will be used by Declaration
  props.refkey = refkey(props.type);
  props.name = name;
  return (
    <Declaration {...props}>
      <ClassDeclarationContext.Provider value={context}>
        {decoratorComponents}class {name}{baseClassComponent}:
        <Indent>
          <Scope name={name} kind="class">
            <Docstring type={props.type} children={props.docstring} />{constantComponents}{classVariableComponents}{initializerComponent}{methodComponents}{props.children}{pass}
          </Scope>
        </Indent>
      </ClassDeclarationContext.Provider>
    </Declaration>
  );
}

function getTypeName(type: Type): string {
  if (type.kind === "Model") {
    if (type.name && type.name !== "") {
      return type.name;
    } else if (type.sourceModels.length) {
      // concatenate the names of the source models
      const constructedName = type.sourceModels.map((item) => getTypeName(item.model)).join("");
      return constructedName;
    }
  } else if (type.kind === "Enum") {
    return type.name;
  }
  // This will likely result in downstream errors
  return "";
}
