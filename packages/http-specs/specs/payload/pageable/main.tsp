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

  @scenario
  @scenarioDoc("""
    Test case for using link as pagination with string nextLink.
    
    Two requests need to be tested.
    1. Initial request:
    Expected route: /payload/pageable/server-driven-pagination/link-string
    Expected response body:
    ```json
    { "pets": [
        { "id": "1", "name": "dog" },
        { "id": "2", "name": "cat" }
      ],
      "next": "http://[host]:[port]/payload/pageable/server-driven-pagination/link-string/nextPage"
    }
    ```
    2. Next page request:
    Expected route: /payload/pageable/server-driven-pagination/link-string/nextPage
    Expected response body:
    ```json
    { "pets": [
        { "id": "3", "name": "bird" },
        { "id": "4", "name": "fish" }
      ]
    }
    ```
    """)
  @route("/link-string")
  @list
  op linkString(): {
    @pageItems
    pets: Pet[];

    @nextLink next?: string;
  };

  @scenario
  @scenarioDoc("""
    Test case for using link as pagination with nested structure.
    
    Two requests need to be tested.
    1. Initial request:
    Expected route: /payload/pageable/server-driven-pagination/nested-link
    Expected response body:
    ```json
    { "nestedItems": {
        "pets": [
          { "id": "1", "name": "dog" },
          { "id": "2", "name": "cat" }
        ]
      },
      "nestedNext": {
        "next": "http://[host]:[port]/payload/pageable/server-driven-pagination/nested-link/nextPage"
      }
    }
    ```
    2. Next page request:
    Expected route: /payload/pageable/server-driven-pagination/nested-link/nextPage
    Expected response body:
    ```json
    { "nestedItems": {
        "pets": [
          { "id": "3", "name": "bird" },
          { "id": "4", "name": "fish" }
        ]
      }
    }
    ```
    """)
  @route("/nested-link")
  @list
  op nestedLink(): {
    nestedItems: {
      @pageItems
      pets: Pet[];
    };
    nestedNext: {
      @nextLink next?: url;
    };
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

    @scenario
    @scenarioDoc("""
      Test case for using continuation token as pagination with nested response structure. Continuation token is passed in the request query and nested within response body.
      
      Two requests need to be tested.
      
      1. Initial request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-nested-response-body?bar=bar
      
      Expected request header:
      foo=foo
      
      Expected response body:
      ```json
      { "nestedItems": {
          "pets": [
          { "id": "1", "name": "dog" },
          { "id": "2", "name": "cat" }
        ]
        },
        "nestedNext": {
          "nextToken": "page2"
        }
      }
      ```
      
      2. Next page request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-nested-response-body?bar=bar&token=page2
      
      Expected request header:
      foo=foo
      
      Expected response body:
      ```json
      { "nestedItems": {
          "pets": [
          { "id": "3", "name": "bird" },
          { "id": "4", "name": "fish" }
          ]
        }
      }
      ```
      """)
    @route("/request-query-nested-response-body")
    @list
    op requestQueryNestedResponseBody(
      @continuationToken @query token?: string,
      ...HeaderAndQuery,
    ): {
      nestedItems: {
        @pageItems
        pets: Pet[];
      };
      nestedNext?: {
        @continuationToken nextToken?: string;
      };
    };

    @scenario
    @scenarioDoc("""
      Test case for using continuation token as pagination with nested response structure. Continuation token is passed in the request header and nested within response body.
      
      Two requests need to be tested.
      
      1. Initial request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-nested-response-body?bar=bar
      
      Expected request header:
      foo=foo
      
      Expected response body:
      ```json
      { "nestedItems": {
          "pets": [
            { "id": "1", "name": "dog" },
            { "id": "2", "name": "cat" }
          ]
        },
        "next": {
          "nextToken": "page2"
        }
      }
      ```
      
      2. Next page request:
      Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-nested-response-body?bar=bar
      
      Expected request header:
      token=page2
      foo=foo
      
      Expected response body:
      ```json
      { "nestedItems": {
          "pets": [
            { "id": "3", "name": "bird" },
            { "id": "4", "name": "fish" }
          ]
        }
      }
      ```
      """)
    @route("/request-header-nested-response-body")
    @list
    op requestHeaderNestedResponseBody(
      @continuationToken @header token?: string,
      ...HeaderAndQuery,
    ): {
      nestedItems: {
        @pageItems
        pets: Pet[];
      };
      nestedNext?: {
        @continuationToken nextToken?: string;
      };
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

@scenario
@scenarioDoc("""
  Test case for pagination with a regular @pageSize parameter.
  
  Two requests need to be tested:
  1. Request with pageSize=2:
  Expected route: /payload/pageable/pagesize?pageSize=2
  
  Expected response body:
  ```json
  { "pets": [
      { "id": "1", "name": "dog" },
      { "id": "2", "name": "cat" }
    ]
  }
  ```
  
  2. Request with pageSize=4:
  Expected route: /payload/pageable/pagesize?pageSize=4
  
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
@route("/pagesize")
@list
op listWithPageSize(@pageSize @query pageSize?: int32): {
  @pageItems
  pets: Pet[];
};

model PaginationOptions {
  @pageSize maxPageSize?: int32;
}

@scenario
@scenarioDoc("""
  Test case for pagination with a nested @pageSize parameter.
  
  Two requests need to be tested:
  1. Request with nested pageSize=2:
  Expected route: /payload/pageable/pagesize-nested
  
  Expected request body:
  ```json
  { "pagination": { "maxPageSize": 2 } }
  ```
  
  Expected response body:
  ```json
  { "pets": [
      { "id": "1", "name": "dog" },
      { "id": "2", "name": "cat" }
    ]
  }
  ```
  
  2. Request with nested pageSize=4:
  Expected route: /payload/pageable/pagesize-nested
  
  Expected request body:
  ```json
  { "pagination": { "maxPageSize": 4 } }
  ```
  
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
@route("/pagesize-nested")
@list
op listWithNestedPageSize(pagination?: PaginationOptions): {
  @pageItems
  pets: Pet[];
};
