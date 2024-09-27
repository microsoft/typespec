// import { Enum } from "@typespec/compiler";
// import { ConstantDeclaration } from "./constant-declaration.js";
// import { usePythonNamePolicy } from "../name-policy.js";
// import { Declaration, DeclarationProps, mapJoin } from "@alloy-js/core";
// import { BaseClasses } from "./index.js";

// /**
//  * Represents the properties for a class declaration.
//  */
// export interface EnumDeclarationProps extends DeclarationProps {
//   /** The TypeSpec type this understands */
//   type: Enum;
// }

// export function EnumDeclaration(props: EnumDeclarationProps) {
//   const namer = usePythonNamePolicy();
//   const enumName = props.name ?? namer.getName(props.type.name, "class");

//   const memberComponents = mapJoin(
//     [...props.type.members.values()],
//     (member) => {
//       const value = member.value ?? member.name;
//       return <ConstantDeclaration name={member.name} value={value} />;
//     },
//     { ender: "\n" }
//   );
//   const baseClassComponents = <BaseClasses values={["Enum"]} />;

//   // TODO: Can we just reuse the ClassDeclaration component here??
//   return (
//     <Declaration {...props} name={enumName} >
//       class {enumName}{baseClassComponents}:
//         {memberComponents}
//         {props.children}
//     </Declaration>
//   );
// }
