import { Refkey } from "@alloy-js/core";
import { ref } from "../symbols/index.js";

export interface ReferenceProps {
  refkey: Refkey;
}

export function Reference(props: ReferenceProps) {
  const reference = ref(props.refkey);

  return <>{reference}</>;
}
