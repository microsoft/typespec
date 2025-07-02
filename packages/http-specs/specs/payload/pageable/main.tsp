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

@route("/nested-xml-like")
namespace NestedXmlLike {
  model BlobFlatListSegment {
    @pageItems
    blobItems: Pet[];
  }

  model ListBlobsFlatSegmentResponse {
    containerName: string;
    segment: BlobFlatListSegment;
    
    @continuationToken
    nextMarker?: string;
  }

  @scenario
  @scenarioDoc("""
    Test case for nested paging with XML-like structure similar to Azure Storage blob listing.
    
    Tests that @pageItems and @continuationToken can be found in deeply nested structures
    that would be suitable for XML serialization.
    
    Expected route: /payload/pageable/nested-xml-like/blob-flat-segment
    Expected response body:
    ```json
    { 
      "enumerationResults": {
        "containerName": "mycontainer",
        "segment": {
          "blobItems": [
            { "id": "1", "name": "blob1" },
            { "id": "2", "name": "blob2" }
          ]
        },
        "nextMarker": "marker1"
      }
    }
    ```
    """)
  @route("/blob-flat-segment")
  @list
  op blobFlatSegment(@continuationToken @query marker?: string): {
    enumerationResults: ListBlobsFlatSegmentResponse;
  };

  model ItemsContainer {
    @pageItems
    items: Pet[];
  }

  model PaginationInfo {
    @continuationToken
    token?: string;
  }

  model NestedResponse {
    data: {
      itemsContainer: ItemsContainer;
      paginationInfo: PaginationInfo;
    };
  }

  @scenario  
  @scenarioDoc("""
    Test case for deeply nested paging structure across multiple levels.
    
    Tests that paging properties can be found when spread across different 
    nested containers in a hierarchy suitable for XML structures.
    
    Expected route: /payload/pageable/nested-xml-like/deeply-nested
    Expected response body:
    ```json
    { 
      "data": {
        "itemsContainer": {
          "items": [
            { "id": "1", "name": "item1" },
            { "id": "2", "name": "item2" }
          ]
        },
        "paginationInfo": {
          "token": "token1"
        }
      }
    }
    ```
    """)
  @route("/deeply-nested")
  @list
  op deeplyNested(@continuationToken @query inputToken?: string): NestedResponse;

  model ComplexBlobContainer {
    @pageItems
    blobs: Pet[];
    metadata: {
      containerInfo: {
        name: string;
        properties: Record<string>;
      };
    };
  }

  model ComplexEnumerationResults {
    @continuationToken
    nextMarker?: string;
    serviceEndpoint: string;
    containerName: string;
    prefix?: string;
    marker?: string; 
    maxResults?: int32;
    blobsContainer: ComplexBlobContainer;
  }

  @scenario
  @scenarioDoc("""
    Test case for complex Azure Storage-like nested structure.
    
    Tests a comprehensive nested structure with metadata that represents
    the kind of complex XML hierarchies found in Azure Storage APIs.
    
    Expected route: /payload/pageable/nested-xml-like/complex-azure-storage
    Expected response body:
    ```json
    { 
      "enumerationResults": {
        "nextMarker": "marker2", 
        "serviceEndpoint": "https://myaccount.blob.core.windows.net/",
        "containerName": "mycontainer",
        "maxResults": 5000,
        "blobsContainer": {
          "blobs": [
            { "id": "1", "name": "complexblob1" },
            { "id": "2", "name": "complexblob2" }
          ],
          "metadata": {
            "containerInfo": {
              "name": "mycontainer",
              "properties": {}
            }
          }
        }
      }
    }
    ```
    """)
  @route("/complex-azure-storage")
  @list
  op complexAzureStorage(@continuationToken @query marker?: string): {
    enumerationResults: ComplexEnumerationResults;
  };
}
