import { mkdir, writeFile } from "fs/promises";

export async function $onEmit(context) {
  const { outputDir } = context.program.compilerOptions;
  const {
    header,
    name,
    details,
    by: {
      owners: { primary, secondary },
    },
  } = context.options;

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    `${outputDir}/out.txt`,
    `${header}\n${name}\n${details}\n${primary}\n${secondary}`,
  );
}

export const $lib = {
  name: "emitter1",
};
