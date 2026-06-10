# Emitter Framework

**WARNING: THIS PACKAGE IS EXPERIMENTAL AND WILL CHANGE**

`@typespec/emitter-framework` provides JSX components and helpers for turning a
TypeSpec program into source files.

## Python Pydantic Helpers

The Python surface includes convenience components for common Pydantic patterns:

- `PydanticClassDeclaration` for `BaseModel` classes generated from TypeSpec models
- `PydanticSettingsClassDeclaration` for `BaseSettings` classes
- `PydanticRootModelDeclaration` for `RootModel[T]` classes

It also includes decorator builders for common validators/serializers:

- `fieldValidatorDecorator()`
- `modelValidatorDecorator()`
- `fieldSerializerDecorator()`
- `computedFieldDecorator()`

### Minimal Example

```tsx
import { code } from "@alloy-js/core";
import {
  Method,
  PydanticClassDeclaration,
  PydanticRootModelDeclaration,
  PydanticSettingsClassDeclaration,
  computedFieldDecorator,
  fieldSerializerDecorator,
  fieldValidatorDecorator,
} from "@typespec/emitter-framework/python";

export function Models() {
  return (
    <>
      <PydanticClassDeclaration
        name="User"
        modelConfig={{ validateAssignment: true, extra: "forbid" }}
      >
        <Method
          name="normalizeName"
          methodType="class"
          returnType="str"
          parameters={[{ name: "value", type: "str" }]}
          decorators={[fieldValidatorDecorator("name", { mode: "before" })]}
        />
        <Method
          name="serializeName"
          returnType="str"
          decorators={[fieldSerializerDecorator("name", { whenUsed: "json" })]}
        />
        <Method name="displayName" returnType="str" decorators={[computedFieldDecorator()]} />
      </PydanticClassDeclaration>

      <PydanticSettingsClassDeclaration
        name="AppSettings"
        settingsConfig={{ envPrefix: "APP_", envFile: ".env" }}
      />

      <PydanticRootModelDeclaration name="TagList" rootType={code`list[str]`} />
    </>
  );
}
```

### Notes

- Pass custom decorators to `Method` through the `decorators` prop.
- Decorators are emitted before `@classmethod`/`@staticmethod` when both are present.
- If you need direct symbol access, use `pydanticModule` and
  `pydanticSettingsModule` from `@alloy-js/python`.
