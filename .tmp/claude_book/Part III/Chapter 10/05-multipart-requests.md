# Multipart Requests

Multipart requests are a special type of HTTP request that allows sending multiple parts with different content types in a single request. They're commonly used for file uploads, form submissions with mixed content, and complex data operations. TypeSpec provides dedicated features for working with multipart requests in your API definitions.

## Understanding Multipart Requests

Multipart requests use the `multipart/form-data` content type and are structured as multiple "parts," each with its own headers and content. This format is especially useful for:

- Uploading files along with metadata
- Submitting forms with a mix of text fields and files
- Sending multiple related resources in a single request

The TypeSpec HTTP library includes specific constructs to model multipart requests clearly and consistently.

## The `@multipartBody` Decorator

The primary way to define multipart requests in TypeSpec is with the `@multipartBody` decorator:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@route("/profile")
interface Profile {
  @post
  updateProfile(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      name: HttpPart<string>;
      email: HttpPart<string>;
      bio?: HttpPart<string>;
      avatar?: HttpPart<File<"image/jpeg" | "image/png", bytes>>;
    },
  ): User;
}
```

In this example:

- The `@multipartBody` decorator indicates that the body is a multipart request
- Each field in the body object is wrapped with `HttpPart<T>` to indicate it's a part of the multipart body
- The `avatar` part is optional (with the `?` suffix) and uses the `File` type for file upload

## The `HttpPart` Type

The `HttpPart` type is a template that wraps the type of content in a multipart part:

```typespec
model Profile {
  @multipartBody body: {
    // Text part
    name: HttpPart<string>;

    // Number part
    age: HttpPart<int32>;

    // Boolean part
    active: HttpPart<boolean>;

    // File part
    photo: HttpPart<File>;

    // JSON part (serialized as JSON string)
    preferences: HttpPart<{
      theme: "light" | "dark";
      notifications: boolean;
    }>;
  };
}
```

Each `HttpPart` can have its own content type and other part-specific metadata.

## File Uploads with Multipart

Multipart requests are most commonly used for file uploads. TypeSpec makes it easy to model various file upload scenarios:

### Single File Upload

```typespec
@route("/documents")
interface Documents {
  @post
  uploadDocument(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      document: HttpPart<File>;
      title: HttpPart<string>;
      description?: HttpPart<string>;
      tags?: HttpPart<string[]>;
    },
  ): {
    id: string;
    url: string;
    size: int64;
  };
}
```

This example models uploading a single document file along with metadata like title, description, and tags.

### Multiple File Upload

```typespec
@route("/albums")
interface Albums {
  @post
  createAlbum(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      title: HttpPart<string>;
      description?: HttpPart<string>;
      photos: HttpPart<File<"image/jpeg" | "image/png", bytes>>[];
    },
  ): {
    id: string;
    title: string;
    photoCount: int32;
  };
}
```

This example uses an array of `HttpPart<File>` to model uploading multiple photos at once.

### Multiple Different Files

```typespec
@route("/product")
interface Products {
  @post
  createProduct(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      name: HttpPart<string>;
      price: HttpPart<decimal>;
      mainImage: HttpPart<File<"image/jpeg" | "image/png", bytes>>;
      thumbnail?: HttpPart<File<"image/jpeg" | "image/png", bytes>>;
      manual?: HttpPart<File<"application/pdf", bytes>>;
      specifications?: HttpPart<File<"application/pdf" | "application/msword", bytes>>;
    },
  ): {
    id: string;
    url: string;
  };
}
```

This example models uploading different types of files with specific content types.

## Part Headers

Each part in a multipart request can have its own headers. TypeSpec allows you to define these using the `@header` decorator inside the part:

```typespec
model UploadWithCustomHeaders {
  @multipartBody body: {
    file: HttpPart<{
      @header("Content-Disposition") contentDisposition: string;
      @header contentType: "application/pdf";
      @body content: bytes;
    }>;
  };
}
```

This approach gives you fine-grained control over the headers for each part.

## Custom Part Names

By default, the part name in the multipart body matches the property name in your TypeSpec model. You can customize this using the `@partName` decorator:

```typespec
@route("/forms")
interface Forms {
  @post
  submitForm(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      @partName("first_name") firstName: HttpPart<string>;
      @partName("last_name") lastName: HttpPart<string>;
      @partName("profile_picture") profilePicture?: HttpPart<File>;
    },
  ): void;
}
```

This customization is useful when you need to match existing client code or follow specific naming conventions.

## Nested Content in Multipart

For complex scenarios, you might need to structure content within parts:

```typespec
@route("/complex-forms")
interface ComplexForms {
  @post
  submitComplexForm(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      // JSON part with nested structure
      userData: HttpPart<{
        name: string;
        email: string;
        preferences: {
          theme: "light" | "dark";
          language: string;
        };
      }>;

      // File part
      document: HttpPart<File>;
    },
  ): void;
}
```

In this example, the `userData` part contains a JSON object with nested structure.

## Handling Multipart Responses

While less common, TypeSpec also supports modeling multipart responses:

```typespec
@route("/multi-download")
interface Downloads {
  @get
  downloadMultipleFiles(@query ids: string[]): {
    @header contentType: "multipart/mixed";
    @multipartBody body: {
      files: HttpPart<File>[];
    };
  };
}
```

This example models a response that returns multiple files in a multipart response.

## Form Data vs. Multipart

It's important to understand the difference between URL-encoded form data and multipart form data:

```typespec
@route("/forms")
interface Forms {
  // URL-encoded form (application/x-www-form-urlencoded)
  @post
  @route("/url-encoded")
  submitUrlEncodedForm(
    @header contentType: "application/x-www-form-urlencoded",
    @body formData: {
      name: string;
      email: string;
      subscribe: boolean;
    },
  ): void;

  // Multipart form (multipart/form-data)
  @post
  @route("/multipart")
  submitMultipartForm(
    @header contentType: "multipart/form-data",
    @multipartBody formData: {
      name: HttpPart<string>;
      email: HttpPart<string>;
      subscribe: HttpPart<boolean>;
      avatar?: HttpPart<File>;
    },
  ): void;
}
```

Key differences:

- URL-encoded forms can only contain simple text data
- Multipart forms can contain mixed content, including files
- URL-encoded forms use the `@body` decorator
- Multipart forms use the `@multipartBody` decorator with `HttpPart<T>` wrappers

## Advanced Multipart Examples

### E-commerce Product Creation

```typespec
@route("/products")
interface Products {
  @post
  createProduct(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      // Product details as JSON
      details: HttpPart<{
        name: string;
        description: string;
        price: decimal;
        category: string;
        attributes: Record<string>;
      }>;

      // Primary product image
      mainImage: HttpPart<File<"image/jpeg" | "image/png", bytes>>;

      // Additional product images (optional)
      additionalImages?: HttpPart<File<"image/jpeg" | "image/png", bytes>>[];

      // Product documentation
      manual?: HttpPart<File<"application/pdf", bytes>>;

      // Structured metadata as separate parts
      sku: HttpPart<string>;

      weight?: HttpPart<decimal>;
      dimensions?: HttpPart<string>;
      inStock: HttpPart<boolean>;
    },
  ): {
    id: string;
    createdAt: utcDateTime;
    status: "pending" | "active";
  };
}
```

This comprehensive example shows a mix of JSON data, multiple images, optional files, and structured metadata in a multipart request.

### User Registration with Profile Image

```typespec
@route("/register")
interface Registration {
  @post
  registerUser(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      // User details
      username: HttpPart<string>;

      email: HttpPart<string>;
      password: HttpPart<string>;

      // Profile information
      fullName?: HttpPart<string>;

      bio?: HttpPart<string>;

      // Profile picture
      profileImage?: HttpPart<File<"image/jpeg" | "image/png" | "image/gif", bytes>>;

      // Consent flags
      acceptTerms: HttpPart<boolean>;

      subscribeToNewsletter?: HttpPart<boolean>;

      // Additional metadata
      referredBy?: HttpPart<string>;

      registrationSource?: HttpPart<string>;
    },
  ): {
    id: string;
    username: string;
    profileUrl: string;
    token: string;
  };
}
```

This example models a complete user registration flow with various data types, including a profile image.

## Best Practices for Multipart Requests

When working with multipart requests in TypeSpec, consider these best practices:

1. **Always specify the `contentType` header** explicitly for multipart requests:

   ```typespec
   @header contentType: "multipart/form-data"
   ```

2. **Use appropriate content types for file parts** to ensure proper handling:

   ```typespec
   photo: HttpPart<File<"image/jpeg" | "image/png", bytes>>
   ```

3. **Make parts optional when appropriate** to simplify client implementation:

   ```typespec
   description?: HttpPart<string>
   ```

4. **Group related fields logically** within the multipart body structure.

5. **Document multipart fields** with the `@doc` decorator to explain their purpose:

   ```typespec
   @doc("User's profile picture (max 5MB, JPEG or PNG)")
   profileImage?: HttpPart<File<"image/jpeg" | "image/png", bytes>>;
   ```

6. **Consider size limitations** for file uploads and document them:

   ```typespec
   @doc("Product catalog PDF (max 10MB)")
   catalog?: HttpPart<File<"application/pdf", bytes>>;
   ```

7. **Use clear, consistent naming conventions** for parts across your API.

8. **Only use multipart when necessary** — for simple data submissions without files, standard JSON bodies are often simpler.

By following these best practices, you'll create clear, consistent, and usable multipart request definitions in your TypeSpec APIs.
