export async function run(): Promise<void> {
  const { runWebTests } = await import("./web.test.js");
  await runWebTests();
}
