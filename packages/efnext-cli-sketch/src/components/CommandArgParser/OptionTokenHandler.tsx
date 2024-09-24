/* eslint-disable unicorn/filename-case */
import { ModelProperty } from "@typespec/compiler";
import { code, mapJoin } from "@alloy-js/core";
import { useHelpers } from "../../helpers.js";

export interface OptionTokenHandlerProps {
  option: ModelProperty;
  path: string;
}

export function OptionTokenHandler({ option, path }: OptionTokenHandlerProps) {
  const helpers = useHelpers();

  if (helpers.boolean.is(option.type)) {
    const cases = [$case(`marshalledArgs${path} = true`)];
    if (helpers.option.isInvertable(option)) {
      cases.push($case(`marshalledArgs${path} = false`, "no-" + option.name));
    }

    return mapJoin(cases, (v) => v);
  } else {
    // todo: marshalling etc.
    return $case(`marshalledArgs${path} = token.value!`);
  }

  function $case(handler: string, optionName?: string) {
    const names = optionName
      ? [optionName]
      : helpers.option.hasShortName(option)
        ? [helpers.option.getShortName(option), option.name]
        : [option.name];

    return code`
      ${mapJoin(names, (v) => `case "${v}": `)}
        ${handler}; break;
    `;
  }
}
