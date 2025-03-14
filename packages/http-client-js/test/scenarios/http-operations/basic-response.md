# **Handling a Response with No Body (204 No Content)**

This test verifies that a response with status `204` and no body is correctly handled. The generated TypeScript function should recognize an empty response and return `void` without errors.

## **TypeSpec**

```tsp
@service({
  title: "Widget Service",
})
namespace DemoService;

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @test @get read(): void;
}
```

## **TypeScript**

### **Response Handling**

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(client: WidgetsClientContext, options?: ReadOptions): Promise<void> {
  const path = parse("/widgets").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

---

# **Handling a Response with a JSON Body**

This test verifies that a response with a body containing a `Widget` model is correctly handled. The generated TypeScript function should deserialize the response body into a `Widget` instance.

## **TypeSpec**

```tsp
@service({
  title: "Widget Service",
})
namespace DemoService;

@test
model Widget {
  name: string;
  age: int32;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @test @get read(): Widget;
}
```

## **TypeScript**

### **Deserializer**

This function converts the received JSON response into a `Widget` instance.

```ts src/models/serializers.ts function jsonWidgetToApplicationTransform
export function jsonWidgetToApplicationTransform(input_?: any): Widget {
  if (!input_) {
    return input_ as any;
  }
  return {
    name: input_.name,
    age: input_.age,
  }!;
}
```

### **Response Handling**

The function reads a `Widget` instance from the response body, ensuring it only processes JSON responses with a `200` status.

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(client: WidgetsClientContext, options?: ReadOptions): Promise<Widget> {
  const path = parse("/widgets").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonWidgetToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
```

---

# **Handling a Response with Multiple Status Codes (200 & 204)**

This test verifies that a response with multiple status codes (`200` and `204`) is correctly handled. If the response is `200`, it should deserialize a `Widget`; if `204`, it should return `void`.

## **TypeSpec**

```tsp
@service({
  title: "Widget Service",
})
namespace DemoService;

@test
model Widget {
  name: string;
  age: int32;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @test @get read(): Widget | void;
}
```

## **TypeScript**

### **Response Handling**

The function determines the response type based on the status code. If `200`, it deserializes a `Widget`; if `204`, it returns `void`.

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(
  client: WidgetsClientContext,
  options?: ReadOptions,
): Promise<Widget | void> {
  const path = parse("/widgets").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonWidgetToApplicationTransform(response.body)!;
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

---

# **Handling a Response with Multiple Content Types**

This test verifies that a response with multiple content types is correctly handled. The response can be in JSON or XML format, both containing a `Widget` model.

## **TypeSpec**

```tsp
@service({
  title: "Widget Service",
})
namespace DemoService;

model Widget {
  name: string;
  age: int32;
}

model JsonResponse {
  @body body: Widget;
  @header contentType: "application/json";
}

model XmlResponse {
  @body body: Widget;
  @header contentType: "application/xml";
}

@route("/widgets")
interface Widgets {
  @get read(): JsonResponse | XmlResponse;
}
```

## **TypeScript**

### **Response Handling**

This function ensures that the response is correctly processed based on its `content-type` header. It supports both JSON and XML responses, deserializing them into `Widget` instances.
TODO: need to implement xml serialization

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(client: WidgetsClientContext, options?: ReadOptions): Promise<Widget> {
  const path = parse("/widgets").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonWidgetToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/xml")) {
    return jsonWidgetToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
```
