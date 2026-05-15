import { code, For, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Attribute, Reference } from "@alloy-js/csharp";
import type { Interface } from "@typespec/compiler";
import type { OperationHttpCanonicalization } from "@typespec/http-canonicalization";
import { AspNetMvc } from "../../utils/csharp-libs.jsx";
import { ControllerAction } from "../controller-action/controller-action.jsx";
import { businessLogicInterfaceRefkey } from "../interfaces/interfaces.jsx";
import type { RequestModelInfo } from "../request-models.jsx";

export interface ControllerProps {
  /** The TypeSpec interface this controller represents. */
  type: Interface;
  /** The canonicalized HTTP operations belonging to this controller. */
  operations: OperationHttpCanonicalization[];
  /** Request models generated for unnamed body types. */
  requestModels?: RequestModelInfo[];
}

/**
 * Renders a full ASP.NET controller class.
 * Includes [ApiController], DI for business logic interface, and action methods.
 */
export function Controller(props: ControllerProps): Children {
  const namePolicy = cs.useCSharpNamePolicy();
  const baseName = namePolicy.getName(props.type.name, "class");
  const controllerName = `${baseName}Controller`;
  const implPropName = `${baseName}Impl`;

  const interfaceRef = <Reference refkey={businessLogicInterfaceRefkey(props.type)} />;

  const attributes = [<Attribute name={AspNetMvc.ApiControllerAttribute} />];

  return (
    <cs.ClassDeclaration
      name={controllerName}
      public
      partial
      baseType="ControllerBase"
      attributes={attributes}
    >
      <cs.Property name={implPropName} type={interfaceRef} internal virtual get />
      <hbr />
      <cs.Constructor public parameters={[{ name: "operations", type: interfaceRef }]}>
        {code`${implPropName} = operations;`}
      </cs.Constructor>
      <hbr />
      <hbr />
      <For each={props.operations} doubleHardline>
        {(op) => {
          const rm = props.requestModels?.find((r) => r.op === op);
          return <ControllerAction operation={op} implFieldName={implPropName} requestModel={rm} />;
        }}
      </For>
    </cs.ClassDeclaration>
  );
}
