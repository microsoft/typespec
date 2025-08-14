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

alias HeaderAndQuery = {
  @header foo?: string;
  @query bar?: string;
};

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
      Test case for using continuation token as pagination. Continuation token is passed in the request query and response body.
      
      Two requests need to be tested.
      
      1. Initial request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body?bar=bar
      
      Expected request header:
      foo=foo
      
      Expected response body:
      ```json
      { "pets": [
          { "id": "1", "name": "dog" },
          { "id": "2", "name": "cat" }
        ],
        "nextToken": "page2"
      }
      ```
      
      2. Next page request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body?bar=bar&token=page2
      
      Expected request header:
      foo=foo
      
      Expected response body:
      ```json
      { "pets": [
          { "id": "3", "name": "bird" },
          { "id": "4", "name": "fish" }
        ]
      }
      ```
      """)
    @route("/request-query-response-body")
    @list
    op requestQueryResponseBody(@continuationToken @query token?: string, ...HeaderAndQuery): {
      @pageItems
      pets: Pet[];

      @continuationToken nextToken?: string;
    };

    @scenario
    @scenarioDoc("""
      Test case for using continuation token as pagination. Continuation token is passed in the request header and response body.
      
      Two requests need to be tested.
      
      1. Initial request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body?bar=bar      
      
      Expected request header:
      foo=foo
      
      Expected response body:
      ```json
      { "pets": [
          { "id": "1", "name": "dog" },
          { "id": "2", "name": "cat" }
        ],
        "nextToken": "page2"
      }
      ```
      
      2. Next page request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body?bar=bar
      
      Expected request header:
      token=page2
      foo=foo
      
      Expected response body:
      ```json
      { "pets": [
          { "id": "3", "name": "bird" },
          { "id": "4", "name": "fish" }
        ]
      }
      ```
      """)
    @route("/request-header-response-body")
    @list
    op requestHeaderResponseBody(@continuationToken @header token?: string, ...HeaderAndQuery): {
      @pageItems
      pets: Pet[];

      @continuationToken nextToken?: string;
    };

    @scenario
    @scenarioDoc("""
      Test case for using continuation token as pagination. Continuation token is passed in the request query and response header.
      
      Two requests need to be tested.
      
      1. Initial request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-header?bar=bar
      
      Expected request header:
      foo=foo
      
      Expected response body:
      ```json
      { "pets": [
          { "id": "1", "name": "dog" },
          { "id": "2", "name": "cat" }
        ]
      }
      ```
      
      Expected response header:
      next-token=page2
      
      2. Next page request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-header?bar=bar&token=page2
      
      Expected request header:
      foo=foo
      
      Expected response body:
      ```json
      { "pets": [
          { "id": "3", "name": "bird" },
          { "id": "4", "name": "fish" }
        ]
      }
      ```
      """)
    @route("/request-query-response-header")
    @list
    op requestQueryResponseHeader(@continuationToken @query token?: string, ...HeaderAndQuery): {
      @pageItems
      pets: Pet[];

      @continuationToken @header nextToken?: string;
    };

    @scenario
    @scenarioDoc("""
      Test case for using continuation token as pagination. Continuation token is passed in the request header and response header.
      
      Two requests need to be tested.
      1. Initial request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-header?bar=bar
      
      Expected request header:
      foo=foo
      
      Expected response body:
      ```json
      { "pets": [
          { "id": "1", "name": "dog" },
          { "id": "2", "name": "cat" }
        ]
      }
      ```
      
      Expected response header:
      next-token=page2
      
      2. Next page request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-header?bar=bar
      
      Expected request header:
      token=page2
      foo=foo
      
      Expected response body:
      ```json
      { "pets": [
          { "id": "3", "name": "bird" },
          { "id": "4", "name": "fish" }
        ]
      }
      ```
      """)
    @route("/request-header-response-header")
    @list
    op requestHeaderResponseHeader(@continuationToken @header token?: string, ...HeaderAndQuery): {
      @pageItems
      pets: Pet[];

      @continuationToken @header nextToken?: string;
    };
  }
}

@scenario
@scenarioDoc("""
  Test case for simple pagination without nextlink or continuationToken.
  
  Single request:
  Expected route: /payload/pageable/simple
  
  Expected response body:
  ```json
  { "pets": [
      { "id": "1", "name": "dog" },
      { "id": "2", "name": "cat" },
      { "id": "3", "name": "bird" },
      { "id": "4", "name": "fish" }
    ]
  }
  ```
  """)
@route("/simple")
@list
op listWithoutContinuation(): {
  @pageItems
  pets: Pet[];
};
