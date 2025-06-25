// // imports mocha for the browser, defining the `mocha` global.
import "mocha/mocha";

mocha.setup({
  ui: "bdd",
  reporter: undefined,
  timeout: 20000,
});

export async function run(): Promise<void> {
  await import("./web.test.js");
  return new Promise((c, e) => {
    try {
      // Run the mocha test
      mocha.run((failures) => {
        if (failures > 0) {
          e(new Error(`${failures} tests failed.`));
        } else {
          c();
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      e(err);
    }
  });
}
