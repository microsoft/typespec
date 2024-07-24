import {
  Declaration,
  DeclarationProps,
  useTSNamePolicy,
} from "@alloy-js/typescript";

export interface InterfaceDeclarationProps extends DeclarationProps {
  extends?: string;
}

export function InterfaceDeclaration(props: InterfaceDeclarationProps) {
  const namePolicy = useTSNamePolicy();
  let name = namePolicy.getName(props.name, "class");

  const { children, ...declarationProps } = props;
  if (declarationProps.extends) {
    name = <>{name} extends {declarationProps.extends}</>;
  }

  return (
    <Declaration {...declarationProps}>
      interface {name} 
        {props.children}
    </Declaration>
  );
}
