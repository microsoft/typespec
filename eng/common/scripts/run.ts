import { execa } from "execa";

export const run = execa({ stdio: "inherit", preferLocal: true });
