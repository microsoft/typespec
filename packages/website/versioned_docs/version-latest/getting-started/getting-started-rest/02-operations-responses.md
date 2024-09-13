---
id: 02-operations-responses
title: Operations and Responses
---

# Operations and Responses

## Introduction

In this section, we'll build upon the basics we covered in the previous section. We'll define CRUD operations (Create, Read, Update, Delete) for our Pet Store API and discuss the benefits of using nested namespaces.

## Defining CRUD Operations

Next, we'll discuss how to define CRUD operations for our API. We'll cover operations for `Creating`, `Reading`, `Updating`, and `Deleting` pets, all within a nested namespace for better organization.

### Example: Adding CRUD Operations

Let's define the CRUD operations for our `Pet` model:

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;

model Pet {
  id: int32;

  @minLength(1)
  name: string;

  @minValue(0)
  @maxValue(100)
  age: int32;

  kind: petType;
}

enum petType {
  dog: "dog",
  cat: "cat",
  fish: "fish",
  bird: "bird",
  reptile: "reptile",
}

// highlight-start
@route("/pets")
namespace Pets {
  @get
  op listPets(): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  @get
  op getPet(@path petId: int32): {
    @statusCode statusCode: 200;
    @body pet: Pet;
  };

  @post
  op createPet(@body pet: Pet): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
  };

  @put
  op updatePet(@path petId: int32, @body pet: Pet): {
    @statusCode statusCode: 200;
    @body updatedPet: Pet;
  };

  @delete
  op deletePet(@path petId: int32): {
    @statusCode statusCode: 204;
  };
}
// highlight-end
```

In this example:

- The `@route` decorator defines the base path for the `Pets` namespace.
- The `listPets` operation lists all pets.
- The `getPet` operation retrieves a specific pet by its `petId`.
- The `createPet` operation creates a new pet.
- The `updatePet` operation updates an existing pet.
- The `deletePet` operation deletes an existing pet.

### Benefits of Nested Namespaces

Using nested namespaces in TypeSpec provides several benefits:

1. **Organization**: Grouping related operations under a common namespace makes the API easier to manage and understand.
2. **Operation IDs**: The TypeSpec compiler appends the namespace name to the `operationId` in the OpenAPI spec, making it clear which resource each operation is intended to operate on.
3. **Clarity**: It helps in avoiding naming conflicts and provides a clear structure for the API.

#### Example: Operation ID in OpenAPI Spec

For the `listPets` operation defined in the `Pets` namespace, the OpenAPI spec will generate an `operationId` like `Pets_listPets`, making it clear that this operation is related to the `Pets` resource.

### Example: Route URLs for CRUD Operations

Here's what the route URLs will look like for the CRUD operations defined in the `Pets` namespace:

- **List Pets**: `GET https://example.com/pets`
  - Retrieves a list of all pets.
- **Get Pet by ID**: `GET https://example.com/pets/{petId}`
  - Retrieves a specific pet by its `petId`.
- **Create Pet**: `POST https://example.com/pets`
  - Creates a new pet.
- **Update Pet by ID**: `PUT https://example.com/pets/{petId}`
  - Updates an existing pet by its `petId`.
- **Delete Pet by ID**: `DELETE https://example.com/pets/{petId}`
  - Deletes an existing pet by its `petId`.

### Operation Flowchart

For clarity, here's a flowchart that depicts the flow of data and operations within the API:

```
[Client] --> [API Gateway] --> [listPets Operation] --> [Database] --> [Response: List of Pets]
[Client] --> [API Gateway] --> [getPet Operation] --> [Database] --> [Response: Pet Details]
[Client] --> [API Gateway] --> [createPet Operation] --> [Database] --> [Response: Created Pet]
[Client] --> [API Gateway] --> [updatePet Operation] --> [Database] --> [Response: Updated Pet]
[Client] --> [API Gateway] --> [deletePet Operation] --> [Database] --> [Response: Deletion Confirmation]
```

## Handling Different Types of Responses

In a real-world API, different operations might return different types of successful responses. Let's see how we can handle various response scenarios in TypeSpec.

### Example: Handling Different Status Codes

Let's update our pet operations to return different status codes based on the outcome.

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;

model Pet {
  id: int32;

  @minLength(1)
  name: string;

  @minValue(0)
  @maxValue(100)
  age: int32;

  kind: petType;
}

enum petType {
  dog: "dog",
  cat: "cat",
  fish: "fish",
  bird: "bird",
  reptile: "reptile",
}

@route("/pets")
namespace Pets {
  @get
  op listPets(): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  @get
  op getPet(@path petId: int32): {
    @statusCode statusCode: 200;
    @body pet: Pet;
    // highlight-start
  } | {
    @statusCode statusCode: 404;
    // highlight-end
  };

  @post
  op createPet(@body pet: Pet): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
    // highlight-start
  } | {
    @statusCode statusCode: 202;
    @body acceptedPet: Pet;
    // highlight-end
  };

  @put
  op updatePet(@path petId: int32, @body pet: Pet): {
    @statusCode statusCode: 200;
    @body updatedPet: Pet;
    // highlight-start
  } | {
    @statusCode statusCode: 404;
    // highlight-end
  };

  @delete
  op deletePet(@path petId: int32): {
    @statusCode statusCode: 204;
  };
}
```

In this example:

- The pet operations are updated to handle different status codes, depending on the outcome of the operation reported by the backend service.

**Explanation of the `|` Operator**:

- The `|` operator is used to define multiple possible responses for an operation. Each response block specifies a different status code and response body.
- In the `createPet` operation for example, the `|` operator allows the operation to return either a 201 status code with a `newPet` object or a 202 status code with an `acceptedPet` object.

### OpenAPI Spec Mapping

Here is how the TypeSpec operation definitions map to the OpenAPI specification:

<div style="display: flex; gap: 10px;">
  <div style="flex: 1;">
    <h4>TypeSpec Definition:</h4>
    <pre><code>
@route("/pets")
namespace Pets {
<nbsp>

@get
op listPets(): {
@statusCode statusCode: 200;
@body pets: Pet[];
};

@get
op getPet(@path petId: int32): {
@statusCode statusCode: 200;
@body pet: Pet;
} | {
@statusCode statusCode: 404;
};

@post
op createPet(@body pet: Pet): {
@statusCode statusCode: 201;
@body newPet: Pet;
} | {
@statusCode statusCode: 202;
@body acceptedPet: Pet;
};

@put
op updatePet(@path petId: int32, @body pet: Pet):{
@statusCode statusCode: 200;
@body updatedPet: Pet;
} | {
@statusCode statusCode: 404;
} | {
@statusCode statusCode: 500;
};

@delete
op deletePet(@path petId: int32): {
@statusCode statusCode: 204;
@body NoContentResponse;
} | {
@statusCode statusCode: 404;
};
}
</code></pre>

</div>
<div style="flex: 1;">
  <h4>OpenAPI Spec:</h4>
  <pre><code>
paths:
  /pets:
    get:
      operationId: Pets_listPets
      parameters: []
      responses:
        '200':
          description: The request has succeeded.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
    post:
      operationId: Pets_createPet
      parameters: []
      responses:
        '201':
          description: The request has succeeded and a new resource has been created as a result.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '202':
          description: The request has been accepted for processing, but processing has not yet completed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
  /pets/{petId}:
    get:
      operationId: Pets_getPet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
            format: int32
      responses:
        '200':
          description: The request has succeeded.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '404':
          description: The server cannot find the requested resource.
    put:
      operationId: Pets_updatePet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
            format: int32
      responses:
        '200':
          description: The request has succeeded.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '404':
          description: The server cannot find the requested resource.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
    delete:
      operationId: Pets_deletePet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
            format: int32
      responses:
        '204':
          description: 'There is no content to send for this request, but the headers may be useful. '
    </code></pre>
  </div>
</div>

**Note**: As you can see, TypeSpec is much more compact and easier to read compared to the equivalent OpenAPI specification.

## Conclusion

In this section, we demonstrated how to define CRUD operations for your REST API using TypeSpec and discussed the benefits of using nested namespaces. We also covered how to handle different types of successful responses.

In the next section, we'll dive deeper into handling errors in your REST API, including defining custom response models for error handling.
