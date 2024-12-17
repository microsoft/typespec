import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Test for pageable payload.
 */
@scenarioService("/payload/pageable")
namespace Payload.Pageable;

model Pet {
  id: string;
  name: string;
}

@route("/server-driven-pagination")
namespace ServerDrivenPagination {
  @scenario
  @scenarioDoc("""
    Test case for using link as pagination. 
    
    Two requests need to be tested.
    1. Initial request:
    Expected route: /payload/pageable/server-driven-pagination/link
    Expected response body:
    ```json
    { "pets": [
        { "id": "1", "name": "dog" },
        { "id": "2", "name": "cat" }
      ],
      "links": {
        "next": "http://[host]:[port]/payload/pageable/server-driven-pagination/link/nextPage"
      }
    }
    ```
    2. Next page request:
    Expected route: /payload/pageable/server-driven-pagination/link/nextPage
    Expected response body:
    ```json
    { "pets": [
        { "id": "3", "name": "bird" },
        { "id": "4", "name": "fish" }
      ]
    }
    ```
    """)
  @route("/link")
  op link(): {
    @pageItems
    pets: Pet[];

    links: {
      @nextLink next?: url;
      @prevLink prev?: url;
      @firstLink first?: url;
      @lastLink last?: url;
    };
  };
}
