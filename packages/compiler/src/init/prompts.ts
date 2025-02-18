import { checkbox as inquirerCheckbox } from "@inquirer/prompts";
import pc from "picocolors";

export function checkbox(config: Parameters<typeof inquirerCheckbox>[0]) {
  return inquirerCheckbox({
    ...config,
    instructions: pc.gray(
      ` (Press ${pc.cyan("space")} to select, ${pc.cyan("a")} to toggle all, ${pc.cyan("i")} to invert selection and ${pc.cyan("enter")} to proceed.)`,
    ),
    theme: {
      icon: {
        unchecked: pc.cyan(" ◯"),
        checked: pc.green(" ◉"),
      },
    },
  });
}
