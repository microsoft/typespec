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
      "next": "http://[host]:[port]/payload/pageable/server-driven-pagination/link/nextPage"
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
  @list
  op link(): {
    @pageItems
    pets: Pet[];

    @nextLink next?: url;
  };

  @route("/continuationtoken")
  namespace ContinuationToken {
    @scenario
    @scenarioDoc("""
      Test case for using continuation token as pagination. Continuation token is passed in the request body and response body.
      
      Two requests need to be tested.
      1. Initial request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-body-response-body
      Expected response body:
      ```json
      { "pets": [
          { "id": "1", "name": "dog" },
          { "id": "2", "name": "cat" }
        ],
        "nextToken": "12345"
      }
      ```
      2. Next page request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-body-response-body
      Expected request body:
      ```json
      { "token": "12345" }
      ```
      Expected response body:
      ```json
      { "pets": [
          { "id": "3", "name": "bird" },
          { "id": "4", "name": "fish" }
        ]
      }
      ```
      """)
    @scenarioDoc("""
    """)
    @route("/request-body-response-body")
    @list
    op reqBodyResBody(@continuationToken token?: string): {
      @pageItems
      pets: Pet[];

      @continuationToken nextToken?: string;
    };

    @scenario
    @scenarioDoc("""
      Test case for using continuation token as pagination. Continuation token is passed in the request query and response body.
      
      Two requests need to be tested.
      1. Initial request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body
      Expected response body:
      ```json
      { "pets": [
          { "id": "1", "name": "dog" },
          { "id": "2", "name": "cat" }
        ],
        "nextToken": "12345"
      }
      ```

      2. Next page request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body?token=12345

      Expected response body:
      ```json
      { "pets": [
          { "id": "3", "name": "bird" },
          { "id": "4", "name": "fish" }
        ]
      }
      ```
      """)
    @scenarioDoc("""
    """)
    @route("/request-query-response-body")
    @list
    op reqQueryResBody(@continuationToken @query token?: string): {
      @pageItems
      pets: Pet[];

      @continuationToken nextToken?: string;
    };


    @scenario
    @scenarioDoc("""
      Test case for using continuation token as pagination. Continuation token is passed in the request header and response body.
      
      Two requests need to be tested.
      1. Initial request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body      

      Expected response body:
      ```json
      { "pets": [
          { "id": "1", "name": "dog" },
          { "id": "2", "name": "cat" }
        ],
        "nextToken": "12345"
      }
      ```
      2. Next page request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body

      Expected header:
      token=12345

      Expected response body:
      ```json
      { "pets": [
          { "id": "3", "name": "bird" },
          { "id": "4", "name": "fish" }
        ]
      }
      ```
      """)
    @scenarioDoc("""
    """)
    @route("/request-header-response-body")
    @list
    op reqHeaderResBody(@continuationToken @header token?: string): {
      @pageItems
      pets: Pet[];

      @continuationToken nextToken?: string;
    };
  }
}
