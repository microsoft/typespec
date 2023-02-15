# TypeSpec Lint

## Usage

### Define a new rule

```ts
export const myRule = createRule({
  name: "rule-name",
  create({ program }) {
    return {
      namespace: (namespace) => {
        // e.g. Lint all namespaces
      }
    }
  });
```

### Register the rule

```ts
const linter = getLinter($lib); // where $lib is the TypeSpecLibrary created with createTypeSpecLibrary
linter.registerRule(myRule);

// register multiple rules
linter.registerRules([rule1, rule2]);

// register and automatically enable rule
linter.registerRules([rule1, rule2], { enable: true });
```

### Enable rule

```ts
// Enable own library rule
linter.enableRule("<packagename>/<rulename>"); // Rule name must be the full qualified name composed of the library name and rule name.

// That way you can enable the rule another library provided but didn't enable
linter.enableRule("<otherpackage>/<rulename>");
```

## Testing

Testing individual rules is a big advantage of the linter rule.

```ts
import { noFooModelRule } from "./no-foo-model.js";

let ruleTester: RuleTester;
beforeEach(() => {
  const runner = createTestRunner();
  ruleTester = createRuleTester(runner, noFooModelRule);
});
it("emit diagnostics when using model named foo", () => {
  ruleTester.expect(`model Foo {}`).toEmitDiagnostic({
    code: "my-library/no-foo-model",
    message: "Cannot name a model with 'Foo'",
  });
});

it("should be valid to use other names", () => {
  ruleTester.expect(`model Bar {}`).toBeValid();
});
```
