/* eslint-disable unicorn/filename-case */
import { Operation, Type, navigateType } from "@typespec/compiler";
import { isDeclaration } from "@typespec/emitter-framework";
import {
  InterfaceDeclaration,
  InterfaceMember,
  TypeDeclaration,
} from "@typespec/emitter-framework/typescript";
import { useHelpers } from "../helpers.js";
import { CliType } from "../index.js";
import { mapJoin } from "@alloy-js/core";

export interface ControllerInterfaceProps {
  cli: CliType;
}

export function ControllerInterface({ cli }: ControllerInterfaceProps) {
  const commands: Operation[] = [];
  const helpers = useHelpers();
  if (cli.kind === "Interface" || cli.kind === "Namespace") {
    // TODO: Namespaces might have operation templates, probably need to find those?
    commands.push(...cli.operations.values());
  } else {
    commands.push(cli);
  }

  const typeDecls = collectTypeDecls(cli).map((type) => <TypeDeclaration type={type} />);

  const memberDecls = mapJoin(commands, (command) => {
    const optionsBagForm = helpers.toOptionsBag(command);
    return <InterfaceMember type={optionsBagForm.type as Operation} />;
  });
  return (
    <>
      <InterfaceDeclaration name="CommandInterface">
        {`${cli.name}: () => void;`}
        {memberDecls}
        version: string;
      </InterfaceDeclaration>
      {typeDecls}
    </>
  );
}

// todo: make this better.
function collectTypeDecls(root: Type) {
  const types: Type[] = [];
  navigateType(
    root,
    {
      model(m) {
        if (isDeclaration(m)) {
          types.push(m);
        }
      },
    },
    {}
  );

  return types;
}
