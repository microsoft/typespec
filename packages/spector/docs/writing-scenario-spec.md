## Defining scenario

The goal of the testserver is to define scenarios that needs to be supported in client generators. This means to have a meaningful coverage we need scenarios to:

- have a specific behavior that is meant to be tested
  - ❌ DO NOT use the same scenario for testing multiple things.
- have a meaningful name that can be used in a compatibility table to see what a given generator support(e.g. `get_string`)
- a description of what the scenario is validating(e.g. `"Support passing a simple string as JSON"`)
- have a good description on what the client is expecting to generate/receive/send(e.g `Validate that this operation returns a JSON string that match "abc"`)
  - ✅ DO describe how to validate that this scenario is working from the client point of view

When naming scenario always think about what would it look like in the [compatibility table](#compatibility-table) and would that name be meaningful to someone looking to see what is supported.

```cadl
import "@typespec/spector";

@scenarioService("/strings")
namespace String;

@scenario("get_string")
@doc("Support passing a simple string as JSON")
@scenarioDoc("In this scenario the Client should expect a string matching 'abc' to be returned.")
@get
@route("/simple")
op returnString(): string;
```

Decorators that should be provided in this test library `@typespec/spector`:

- `@scenario`: Specify that this operation, interface or namespace is a scenario. Optionally take a scenario name otherwise default to the namespace name + operation/interface name
- `@scenarioDoc`: Specify how to implement this scenario. Differ from `@doc` which describe the scenario to the end user.
- `@supportedBy`: Specify if something is supported only by some kind of SDK. Option: `arm`, `dpg`. By default everything.

## Compatibility table

With all this information, a detailed compatibility table should be able to be produced by compiling each one of the scenarios and extracting the cases. Providing something like

| Scenario                     | CSharp | Python | Go  | Java | TS/JS |
| ---------------------------- | ------ | ------ | --- | ---- | ----- |
| Vanilla                      |
| `get_string`                 | ✅     | ✅     | ✅  | ✅   | ✅    |
| `put_string`                 | ✅     | ✅     | ✅  | ✅   | ✅    |
| Azure                        |
| `pageable_nextLink`          | ✅     | ✅     | ✅  | ✅   | ✅    |
| `pageable_continuationToken` | ❌     | ✅     | ✅  | ✅   | ✅    |

## Writing the mock api

Each scenario should be accompanied by a mock api. See [writing a mock api docs](./writing-mock-apis.md)
