import { checkbox as inquirerCheckbox } from "@inquirer/prompts";
import pc from "picocolors";

export function checkbox<Value>(config: Parameters<typeof inquirerCheckbox<Value>>[0]) {
  return inquirerCheckbox({
    ...config,
    theme: {
      ...config.theme,
      style: {
        keysHelpTip: pc.gray(
          ` (Press ${pc.cyan("space")} to select, ${pc.cyan("a")} to toggle all, ${pc.cyan("i")} to invert selection and ${pc.cyan("enter")} to proceed.)`,
        ),
      },
      icon: {
        unchecked: pc.cyan(" ◯"),
        checked: pc.green(" ◉"),
      },
    },
  });
}
