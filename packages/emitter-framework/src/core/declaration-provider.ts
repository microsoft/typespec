import { refkey, shallowReactive, type Refkey } from "@alloy-js/core";
import { getLocationContext, type MemberType, type Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";

export class DeclarationProvider {
  $: Typekit;
  declarations: Map<Type, Refkey> = shallowReactive(new Map());
  #staticMemberRefkeys: Map<MemberType, Refkey> = new Map();

  constructor($: Typekit) {
    this.$ = $;
  }

  /**
   * Get a refkey for the given type, creating one if one has not been created
   * for it already.
   *
   * @throws if the type is not a declaration or static member.
   *
   * @remarks
   *
   * If you need a static member refkey for a type which is not otherwise a
   * static member (e.g. because you are rendering a union which can't usually
   * have its variants referenced as an enum which can), you can call
   * `getStaticMemberRefkey` directly.
   */
  public getRefkey(type: Type): Refkey {
    if (this.isDeclaration(type)) {
      return this.getDeclarationRefkey(type);
    }

    if (this.isStaticMember(type)) {
      return this.getStaticMemberRefkey(type as MemberType);
    }

    throw new Error(
      "Type ${type.kind} is not a declaration or static member and cannot have a refkey.",
    );
  }

  /**
   * Whether the given type should be referenced via refkey. True for things
   * which are declarations and static members of declarations.
   */
  public shouldReference(type: Type): boolean {
    return this.isDeclaration(type) || this.isStaticMember(type);
  }

  /**
   * Get a refkey for the given declaration, creating one if one has not been
   * created for it already.
   *
   * @throws if the type is not a declaration type.
   */
  public getDeclarationRefkey(type: Type): Refkey {
    const existing = this.declarations.get(type);

    if (existing) {
      return existing;
    }

    if (!this.isDeclaration(type)) {
      throw new Error(`Type ${type.kind} is not a declaration type and cannot have a refkey.`);
    }

    const key = refkey();
    this.declarations.set(type, key);
    return key;
  }

  /**
   * Whether the given type should be emitted as a declaration.
   *
   * @remarks
   *
   * By default, things which are declarations in TypeSpec but not in the
   * compiler are considered declarations. For example, `string` is not a
   * declaration but `scalar customScalar extends string` is. Likewise,
   * `Array<Item>` is not a declaration because Array is built-in, but
   * `MyModel<Item>` is a declaration because it's not part of the compiler and
   * has a TypeSpec declaration.
   */
  public isDeclaration(type: Type): boolean {
    const location = getLocationContext(this.$.program, type).type;

    if (location === "compiler") {
      return false;
    }

    if (!("name" in type) || type.name === undefined || type.name === "") {
      return false;
    }

    if (
      this.$.unionVariant.is(type) ||
      this.$.enumMember.is(type) ||
      this.$.modelProperty.is(type) ||
      this.$.intrinsic.is(type)
    ) {
      return false;
    }

    if (location === "synthetic" && (type.name === "Record" || type.name === "Array")) {
      return false;
    }

    return true;
  }

  /**
   * Whether the given type is a static member that can be referenced directly
   * (i.e. without instantiation).
   */
  public isStaticMember(type: Type): boolean {
    return this.$.enumMember.is(type);
  }

  /**
   * Get a refkey for the given static member, creating one if one has not been
   * created for it already.
   */
  public getStaticMemberRefkey(type: MemberType): Refkey {
    const existing = this.#staticMemberRefkeys.get(type);
    if (existing) {
      return existing;
    }

    const key = refkey();
    this.#staticMemberRefkeys.set(type, key);
    return key;
  }
}
