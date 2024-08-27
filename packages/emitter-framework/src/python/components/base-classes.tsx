import { mapJoin } from "@alloy-js/core";

export interface BaseClassesModel {
  values: string[] | undefined;
}

export function BaseClasses({ values }: BaseClassesModel) {
  if (!values) {
    return undefined;
  }
  // TODO: We need to ensure these base classes are either declared or imported.
  return (
    <>
      ({mapJoin(
        values,
        (baseClass) => {
          return baseClass;
        },
        { joiner: ", " }
      )})
    </>
  );
}
