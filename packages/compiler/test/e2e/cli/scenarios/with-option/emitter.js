import { mkdir, writeFile } from "fs/promises";

export async function $onEmit(context) {
  const { outputDir } = context.program.compilerOptions;
  const {
    name,
    details,
    by: {
      owners: { primary, secondary },
    },
  } = context.options;

  await mkdir(outputDir, { recursive: true });
  await writeFile(`${outputDir}/out.txt`, `${name}\n${details}\n${primary}\n${secondary}`);
}

export const $lib = {
  name: "description",
};
