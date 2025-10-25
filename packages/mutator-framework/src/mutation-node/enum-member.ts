import type { EnumMember } from "@typespec/compiler";
import { MutationNode } from "./mutation-node.js";

export class EnumMemberMutationNode extends MutationNode<EnumMember> {
  readonly kind = "EnumMember";

  traverse() {}
}
