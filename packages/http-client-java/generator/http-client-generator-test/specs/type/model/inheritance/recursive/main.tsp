import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Illustrates inheritance recursion")
@scenarioService("/type/model/inheritance/recursive")
namespace Type.Model.Inheritance.Recursive;

@doc("extension")
model Extension extends Element {
  level: int8;
}

@doc("element")
model Element {
  extension?: Extension[];
}

@scenario
@scenarioDoc("""
  Send a PUT request with the following body:
  Expected input body:
  ```json
  {
    "level": 0,
    "extension": [
      {
        "level": 1,
        "extension": [
          {
            "level": 2
          }
        ]
      },
      {
        "level": 1
      }
    ]
  }
  ```
  """)
@put
op put(@body input: Extension): void;

@scenario
@scenarioDoc("""
  Send a GET request which returns the following body:
  Expected response body:
  ```json
  {
    "level": 0,
    "extension": [
      {
        "level": 1,
        "extension": [
          {
            "level": 2
          }
        ]
      },
      {
        "level": 1
      }
    ]
  }
  ```
  """)
@get
op get(): Extension;
