import type { Entity, Interface, Operation } from "../../core/types.js";
import { createRekeyableMap } from "../../utils/misc.js";
import { defineKit } from "../define-kit.js";
import { decoratorApplication, DecoratorArgs } from "../utils.js";

/**
 * A descriptor for creating an interface.
 */
export interface InterfaceDescriptor {
  /**
   * The name of the interface declaration.
   */
  name: string;

  /**
   * Decorators to apply to the interface.
   */
  decorators?: DecoratorArgs[];

  /**
   * The operations of the interface.
   */
  operations?: Operation[];
}

/**
 * Utilities for working with interfaces.
 * @typekit interface
 */
export interface InterfaceKit {
  /**
   * Create an interface type.
   *
   * @param desc The descriptor of the interface.
   */
  create(desc: InterfaceDescriptor): Interface;

  /**
   * Check if the given `type` is an interface.
   *
   * @param type The type to check.
   */
  is(type: Entity): type is Interface;
}

interface TypekitExtension {
  /**
   * Utilities for working with interfaces.
   */
  interface: InterfaceKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  interface: {
    create(desc) {
      const iface: Interface = this.program.checker.createType({
        kind: "Interface",
        name: desc.name,
        decorators: decoratorApplication(this, desc.decorators),
        operations: createRekeyableMap(),
        sourceInterfaces: [],
      });

      for (const op of desc.operations ?? []) {
        op.interface = iface;
        iface.operations.set(op.name, op);
      }

      this.program.checker.finishType(iface);
      return iface;
    },

    is(type) {
      return type.entityKind === "Type" && type.kind === "Interface";
    },
  },
});
