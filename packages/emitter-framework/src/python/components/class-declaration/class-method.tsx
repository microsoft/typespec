import { createContext, For, splitProps, useContext, type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Operation } from "@typespec/compiler";
import { useTsp } from "../../../core/index.js";
import { buildParameterDescriptors, getReturnType } from "../../utils/operation.js";
import { DocElement } from "../doc-element/doc-element.js";
import { TypeExpression } from "../type-expression/type-expression.js";

/**
 * Default method kind for a class subtree. An explicit Method `methodType` wins;
 * absent both a prop and a provider, methods are instance methods.
 */
export const MethodContext = createContext<"method" | "static" | "class" | undefined>(undefined);
/** Provides a method-kind default for descendants without changing individually specified kinds. */
export const MethodProvider = MethodContext.Provider;

/** Operation-derived method signature with optional Alloy overrides and decorator content. */
export interface MethodPropsWithType extends Omit<py.MethodDeclarationBaseProps, "name"> {
  /**
   * Operation supplying default documentation, parameters, and return type.
   * Error variants are excluded from unions; standalone `@error` models are retained.
   */
  type: Operation;
  /** Explicit method name; otherwise applies the Python function naming policy to the operation name. */
  name?: string;
  doc?: Children;
  /** Overrides the enclosing method context; falls back to an instance method if neither is set. */
  methodType?: "method" | "class" | "static";
  /** Emits an abstract-method decorator when true; the enclosing class must supply an appropriate base. */
  abstract?: boolean;
  /** Complete decorator lines, emitted in order above intrinsic class/static/abstract decorators. */
  decorators?: Children[];
  /** If true, parameters replaces operation parameters instead of adding to them as keyword-only */
  replaceParameters?: boolean;
}

/** Selects an operation-derived method or a manually specified Alloy method with decorator lines. */
export type MethodProps =
  | MethodPropsWithType
  | (py.MethodDeclarationBaseProps & {
      /** Complete decorator lines in top-to-bottom source order; falsy entries are skipped. */
      decorators?: Children[];
    });

/**
 * Get the method component based on the resolved method type.
 * We prioritize the methodType prop provided in the Method component,
 * and then the one provided in the context, and then we default to "method".
 */
function getResolvedMethodType(props: MethodProps): "method" | "class" | "static" {
  const ctxMethodType = useContext(MethodContext);
  const propMethodType = "methodType" in props ? (props as any).methodType : undefined;
  return (propMethodType ?? ctxMethodType ?? "method") as "method" | "class" | "static";
}

/**
 * A Python class method. Pass the `type` prop to create the
 * method by converting from a TypeSpec Operation. Any other props
 * provided will take precedence.
 */
export function Method(props: Readonly<MethodProps>) {
  const { $ } = useTsp();
  const isTypeSpecTyped = "type" in props;
  const type = isTypeSpecTyped ? props.type : undefined;
  const docSource = props.doc ?? (type ? $.type.getDoc(type) : undefined);
  const docElement = docSource ? (
    <DocElement doc={docSource} component={py.MethodDoc} />
  ) : undefined;
  const resolvedMethodType = getResolvedMethodType(props);
  const MethodComponent =
    resolvedMethodType === "static"
      ? py.StaticMethodDeclaration
      : resolvedMethodType === "class"
        ? py.ClassMethodDeclaration
        : py.MethodDeclaration;

  // Default to abstract when deriving from a TypeSpec operation (`type` prop present),
  // unless explicitly overridden by props.abstract === false
  const abstractFlag = (() => {
    const explicit = (props as any).abstract as boolean | undefined;
    return explicit ?? (!isTypeSpecTyped ? false : undefined);
  })();
  const decorators = (props as { decorators?: Children[] }).decorators;
  const decoratorsBlock = decorators ? (
    <For each={decorators} skipFalsy>
      {(decorator) => (
        <>
          {decorator}
          <hbr />
        </>
      )}
    </For>
  ) : undefined;

  /**
   * If the method does not come from the Typespec class declaration, return a standard Python method declaration.
   * Have in mind that, with that, we lose some of the TypeSpec class declaration overrides.
   */
  if (!isTypeSpecTyped) {
    const { decorators: _decorators, ...methodProps } = props;
    return (
      <>
        {decoratorsBlock}
        <MethodComponent {...methodProps} doc={docElement} abstract={abstractFlag} />
      </>
    );
  }

  const [efProps, updateProps, forwardProps] = splitProps(
    props,
    ["type", "decorators"],
    ["returnType", "parameters"],
  );

  const name = props.name ?? py.usePythonNamePolicy().getName(efProps.type.name, "function");
  const returnType = props.returnType ?? <TypeExpression type={getReturnType(efProps.type)} />;
  const allParameters = buildParameterDescriptors(efProps.type.parameters, {
    params: props.parameters,
    replaceParameters: props.replaceParameters,
  });

  return (
    <>
      {decoratorsBlock}
      <MethodComponent
        {...forwardProps}
        {...updateProps}
        name={name}
        returnType={returnType}
        parameters={allParameters}
        doc={docElement}
        abstract={abstractFlag}
      />
    </>
  );
}
