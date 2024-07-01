---
id: getting-started-http-10-summary
title: Summary
---

# Summary

In this tutorial, we have covered the basics of creating a REST API definition using TypeSpec. We started by setting up a new TypeSpec project and then defined a Pet Store service with various operations. We explored how to use decorators to define routes, handle path and query parameters, manage headers, and specify request and response bodies. We also looked at how to automatically generate routes, define status codes, handle errors, and manage versioning.

By following these steps, you should now have a good understanding of how to use TypeSpec to define and manage your HTTP APIs. For more advanced features and detailed documentation, refer to the official TypeSpec documentation and community resources.

## Complete Code Example

Here's the complete Pet Store service definition written in TypeSpec:

```typespec
import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;

/**
 * This is a sample Pet Store server.
 */
@service({
  title: "Pet Store Service",
})
@server("https://example.com", "Single server endpoint")
@versioned(Versions)
namespace PetStore {
  enum Versions {
    v1: "1.0.0",
    v2: "2.0.0",
  }

  @route("/pets")
  namespace Pets {
    @added(Versions.v1)
    model Pet {
      @minLength(1)
      name: string;

      @minValue(0)
      @maxValue(100)
      age: int32;

      kind: "dog" | "cat" | "fish" | "bird" | "reptile";
    }

    op list(@query skip?: int32, @query top?: int32): {
      @statusCode statusCode: 200;
      @body pets: Pet[];
    };

    op read(@path petId: int32, @header ifMatch?: string): {
      @statusCode statusCode: 200;
      @header eTag: string;
      @body pet: Pet;
    } | {
      @statusCode statusCode: 404;
      @body error: NotFoundError;
    };

    @post
    op create(@body pet: Pet): {
      @statusCode statusCode: 201;
    } | {
      @statusCode statusCode: 400;
      @body error: ValidationError;
    } | {
      @statusCode statusCode: 500;
      @body error: InternalServerError;
    };

    @put
    op update(@path petId: int32, @body pet: Pet):
      | {
          @statusCode statusCode: 200;
          @body updatedPet: Pet;
        }
      | {
          @statusCode statusCode: 404;
          @body error: NotFoundError;
        }
      | {
          @statusCode statusCode: 400;
          @body error: ValidationError;
        }
      | {
          @statusCode statusCode: 500;
          @body error: InternalServerError;
        };

    @delete
    op delete(@path petId: int32): {
      @statusCode statusCode: 204;
    } | {
      @statusCode statusCode: 404;
      @body error: NotFoundError;
    } | {
      @statusCode statusCode: 500;
      @body error: InternalServerError;
    };
  }

  model CommonParameters {
    @path
    @segment("pets")
    petId: int32;

    @added(Versions.v2)
    @path
    @segment("toys")
    toyId: int32;
  }

  @added(Versions.v2)
  model Toy {
    name: string;
  }

  @error
  model ValidationError {
    code: "VALIDATION_ERROR";
    message: string;
    details: string[];
  }

  @error
  model NotFoundError {
    code: "NOT_FOUND";
    message: string;
  }

  @error
  model InternalServerError {
    code: "INTERNAL_SERVER_ERROR";
    message: string;
  }

  @autoRoute
  interface ToyOperations {
    @added(Versions.v2)
    @get
    getToy(...CommonParameters): Toy | NotFoundError;

    @added(Versions.v2)
    @put
    updateToy(...CommonParameters, toy: Toy): Toy | NotFoundError;
  }
}
```

Running `tsp compile .` will generate two versions of the OpenAPI description for this service in your `tsp-output` folder, one for each version defined in the `Versions` enum.

```
tsp-output/
┗ @typespec/
  ┗ openapi3/
┃   ┣ openapi.1.0.0.yaml
┃   ┗ openapi.2.0.0.yaml
```

You can also explore this TypeSpec example and the generated OpenAPI descriptions [in the TypeSpec Playground](https://typespec.io/playground?c=aW1wb3J0ICJAdHlwZXNwZWMvaHR0cCI7DQrSGnJlc3TWGnZlcnNpb25pbmfEIA0KdXNpbmcgVHlwZVNwZWMuSHR0cDvRFlJlc3TSFlbJS8VKLyoqDQogKiBUaGlzIGlzIGEgc2FtcGxlIFBldCBTdG9yZSBzZXJ2ZXIuxCcvDQpAxA9pY2Uoew0KICB0aXRsZTogIsouU8YfIiwNCn0pxy9lcigi5AD3czovL2V4xWAuY29tIiwgIlNpbmdsyGQgZW5kcG9pbnQixDrnAPVlZCjnALRzKQ0KbmFtZXNwYWPlAKHGcuUAiWVudW0gyCjGEyAgdjE6ICIxLjAuMOQAj8USMjogIjLKEn3kAQQgIEByb3V0ZSgiL3BldHPEfSAgzWnJUkBhZGTrAJEudjHFLSAgbW9kZWzEK8gqICBAbWluTGVuZ3RoKMgmxlc6IHN0cugBgcosVmFsdWUoMMkrQG1heMYUMTDKFmFnZTogaW50MzLLP2tpbmQ6ICJkb2ciIHwgImNhdMUIZmlzaMUJYmlyZMUJcmVwdGlsZeQCRsQ45wD%2FICBvcCBsaXN0KEBxdWVyeSBza2lwP8dnLCDHFXRvyRQpOusA53N0YXR1c0NvZGUgygs6IDIwMMdmICBAYm9keSDkAV065AEkW13HGn3pAMRvcCByZWFkKEBwYXRoxCpJZMdsLCBAaGVhZGVyIGlmTWF0Y2g%2F6AFA%2FwCG8gCGx0hlVGFnyETyAKPlAKLHF30gfN9jZTogNDA0z0ZlcnJvcjogTm90Rm91bmRFxA%2FxAPJAcG9zdMYLb3AgY3JlYXRlKO4Ahv8A4cV%2BMjAx%2FwCtzS808QGW5wCtVmFsaWRhdGlvbu0Ar99UxVQ12FRJbnRlcm5hbOQEFGVy%2BAEHdeoBBnVwZOUBBvQCBe8BGshx6wCg%2FwIIx3vsAKjGcGRQ7gH2xAF932D8AgXxAQj0AgnfZddl9ADF%2FQHB32fVZ%2BwB0NFn%2BgHUxWvqAdhkZWxldGXGDW9wIMYP8wHb%2FwLl5wG%2B6AFe%2FwKR%2FwOS9QOS31L%2FAuP9AuPpBWLmBh9Db21tb25QYXJhbWV0ZXLqBlbkARXHC3NlZ21lbnQoIuoGiyDtATDqAWLwBowyxy7VT3RveclPdG95zE%2FqBwfWUuYAvVRveegAsO8GxcpA5QEVyjPvApPIP2PlAVMiVkFMSURBVElPTl9FUlJPUugGlW1lc3PlBubLYSAgZGV0YWlsc8gW5wZD13ntAejPd05PVF9GT1VORNxw11jzAe7PXklOVEVSTkFMX1NFUlZFUv8A2stqYXV0b1LkCIbEDmnEaGbkCH1Ub3lPcGVy5QFF%2BgiG6QH6Z2XnBU1nZXRUb3koLi4u8AJ1KTrEVSB88QMN31zqBanmBTbXXyzkAl7FY9lp5QD1fQ0K&e=%40typespec%2Fopenapi3&options=%7B%7D).

---

[Previous: Error Handling](./getting-started-http-09-error-handling.md)
