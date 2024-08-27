import { Children } from "@alloy-js/core";

export interface BlackFormatterModel {
  children?: Children;
}

/** Apply the Python formatter `black` to the child components. */
export function BlackFormatter({ children }: BlackFormatterModel) {
  // TODO: Implement!
  return children;
}
