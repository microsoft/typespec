import "@typespec/http";
import "@typespec/spector";
import "@typespec/xml";

using Http;
using Spector;
using Xml;

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

@doc("An XML pet item.")
@name("Pet")
model XmlPet {
  @name("Id") id: string;
  @name("Name") name: string;
}

@route("/xml")
namespace XmlPagination {
  @scenario
  @scenarioDoc("""
    Test case for XML pagination with continuation token. Continuation token is passed in the request query and response body.
    
    Two requests need to be tested.
    
    1. Initial request:
    Expected route: /payload/pageable/xml/list
    
    Expected response body:
    ```xml
    <PetListResult>
      <Pets>
        <Pet>
          <Id>1</Id>
          <Name>dog</Name>
        </Pet>
        <Pet>
          <Id>2</Id>
          <Name>cat</Name>
        </Pet>
      </Pets>
      <NextMarker>page2</NextMarker>
    </PetListResult>
    ```
    
    2. Next page request:
    Expected route: /payload/pageable/xml/list?marker=page2
    
    Expected response body:
    ```xml
    <PetListResult>
      <Pets>
        <Pet>
          <Id>3</Id>
          <Name>bird</Name>
        </Pet>
        <Pet>
          <Id>4</Id>
          <Name>fish</Name>
        </Pet>
      </Pets>
    </PetListResult>
    ```
    """)
  @route("/list-with-continuation")
  @list
  op listWithContinuation(@continuationToken @query marker?: string): {
    @header("content-type") contentType: "application/xml";
    @body body: XmlPetListResult;
  };
}

@doc("The XML response for listing pets.")
@name("PetListResult")
model XmlPetListResult {
  @pageItems
  @name("Pets")
  pets: XmlPet[];

  @continuationToken
  @name("NextMarker")
  nextMarker?: string;
}

@doc("The XML response for listing pets with next link.")
@name("PetListResult")
model XmlPetListResultWithNextLink {
  @pageItems
  @name("Pets")
  pets: XmlPet[];

  @nextLink
  @name("NextLink")
  nextLink?: url;
}
