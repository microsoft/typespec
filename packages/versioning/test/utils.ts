import type { Enum, Interface, Model, Union } from "@typespec/compiler";
import { ok, strictEqual } from "assert";

export function assertHasProperties(model: Model, props: string[]) {
  strictEqual(model.properties.size, props.length, `Model ${model.name} property count`);
  for (const propName of props) {
    ok(model.properties.has(propName), `Model ${model.name} should have property ${propName}`);
  }
}

export function assertHasVariants(union: Union, variants: string[]) {
  strictEqual(union.variants.size, variants.length, `Union ${union.name} variant count`);
  for (const variantName of variants) {
    ok(union.variants.has(variantName), `Union ${union.name} should have variant ${variantName}`);
  }
}
export function assertHasOperations(iface: Interface, operations: string[]) {
  strictEqual(iface.operations.size, operations.length, `Interface ${iface.name} operation count`);
  for (const operationName of operations) {
    ok(
      iface.operations.has(operationName),
      `Interface ${iface.name} should have operation ${operationName}`,
    );
  }
}

export function assertHasMembers(enumType: Enum, members: string[]) {
  strictEqual(enumType.members.size, members.length, `Enum ${enumType.name} member count`);
  for (const member of members) {
    ok(
      enumType.members.has(member),
      `Enum ${enumType.name} should have member ${member} but only has ${[
        ...enumType.members.keys(),
      ]}`,
    );
  }
}
