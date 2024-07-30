/* eslint-disable unicorn/filename-case */
import { ModelProperty } from "@typespec/compiler";
import { code } from "@alloy-js/core";
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

    return cases;
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
      ${names.map((v) => `case "${v}": `).join("")}${handler}; break;
    `;
  }
}
