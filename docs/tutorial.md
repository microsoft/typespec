# Introduction to API Definition Language (Cadl)

Cadl is a language for describing cloud service APIs and generating other API description languages, client and service code, documentation, and other assets. Cadl provides highly extensible core language primitives that can describe API shapes common among REST, GraphQL, gRPC, and other protocols.

Cadl is an object oriented dynamic language whose evaluation results in an object model describing service APIs. Unlike typical programming languages, Cadl consists primarily of declarations, however these declarations can be decorated to provide highly dynamic behavior.

Cadl's primary benefits include:

* Protocol agnostic: it can describe and generate code for APIs across multiple protocols and serialization languages
* Modular: developers can group common API shapes and conventions together and reuse them
* Terse: the syntax is expressive, capable of describing complex APIs with minimal code
* Extensible: developers can customize the language to describe just about any style of API
 
## Language Tour

Cadl consists of the following language features:

* Models: data shapes or schemas
* Type Literals: strings and numbers with specific values
* Type Operators: syntax for composing model types into other types
* Operations: service endpoints with parameters and return values
* Namespaces & Usings: groups models and operations together into hierarchical groups with friendly names
* Imports: links declarations across multiple files and libraries together into a single program
* Decorators: bits of TypeScript code that add metadata or sometimes mutate declarations
* Libraries: encapsulate Cadl definitions into reusable components

In addition, Cadl comes with a standard library for describing REST APIs and generating OpenAPI. Other protocol bindings are a work in progress!

### Models

Cadl models are used to describe data shapes or schemas. Models have any number of members and can extend and be composed with other models. Members are required by default, but can made optional by appending a "?" to the member name. The following defines a data shape with two members:

```
model Dog {
  name: string;
  favoriteToy?: string;
}
```

#### Built-in Models

Cadl comes with built-in models for common data types:

* `string`: sequence of characters
* `int32`: 32-bit integer
* `int64`: 64-bit integer
* `safeint`: an integer that is safe to store in a IEEE754 double and safe to round trip through  all JSON processors.
* `byte`: an 8-bit element of data
* `float32`: IEEE 754 single-precision floating point number
* `float64`: IEEE 754 double-precision floating point number
* `plainDate`: A date on a calendar without a time zone, e.g. "April 10th"
* `plainTime`: A time on a clock without a time zone, e.g. "3:00 am"
* `zonedDateTime`: A date and time in a particular time zone, e.g. "April 10th at 3:00am in PST"
* `boolean`: true or false
* `null`: the null value found in e.g. JSON.
* `Map<K, V>`: a map from K to V.

#### Spread

The spread operator takes the members of a source model and copies them into a target model. Spread doesn't create any nominal relationship between source and target, and so it's useful when you want to reuse common properties without reasoning about or generating complex inheritence relationships.

```
model Animal {
  species: string;
}

model Pet {
  name: string;
}

model Dog {
  ... Animal;
  ... Pet;
}

// Dog is equivalent to the following declaration:
model Dog {
  species: string;
  name: string;
}
```

#### Extends

Sometimes you want to create an explicit relationship between two models, for example when you want to emit class definitions in languages which support inheritance. The `extends` keyword can be used to establish such a relationship.

```
model Animal {
  species: string;
}

model Pet {
  name: string;
}

model Dog extends Pet, Animal { }
```

### Enums

Enums define a type which can hold one of a set of constant values.

```
enum Color {
  Red,
  Blue,
  Green,
}
```

In this case, we haven't specified how the constants will be represented, allowing for different choices in different scenarios. For example, the OpenAPI emitter will choose string values "Red", "Green", "Blue". Another protocol might prefer to assign incrementing numeric values 0, 1, 2.

We can also specify explicit string or numeric values:
```
enum Color {
  Red: "red",
  Blue: "blue"
  Green: "green",
}

enum Priority {
  High: 100,
  Low: 0,
}
```

#### Templates

It is often useful to let the users of a model fill in certain details. Model templates enable this pattern. Similar to generics found in other languages, model templates declare template parameters that users provide when referencing the model.

```
model Page<T> {
  size: number;
  item: T[];
}

model DogPage {
  ... Page<Dog>;
}
```

#### Type Aliases

Sometimes it's convenient to alias a model template instantiation or type produced via type operators (covered later) as a convenient name. Aliases allow this:

```
alias DogPage = Page<Dog>;
```

Unlike `model`, `alias` does not create a new entity, and as such will not change generated code in any way. An  alias merely describes a source code shorthand to avoid repeating the right-hand side in multiple places. 

### Type Literals

API authors often need to describe API shapes in terms of specific literal values. For example, this operation returns this specific integer status code, or this model member can be one of a few specific string values. It is also often useful to pass specific literal values to decorators. Cadl supports string, number, and boolean literal values to support these cases:

```
model BestDog {
  name: "Suki",
  age: 14,
  best: true
}
```

String literal types can also be created using the triple-quote syntax which enables multi-line strings:

```
model Dog {
  favoriteFoods: """
    McDonalds
    Chipotle
    And so on
    """
}
```


### Type Operators

Cadl supports a few type operators that make it easy to compose new models from other models.

#### Union

Unions describe a type that must be exactly one of the union's constituents. Create a union with the `|` operator.

```
alias GoodBreed = Beagle | GermanShepherd | GoldenRetriever;
```

#### Intersection

Intersections describe a type that must include all of the intersection's constituents. Create an intersection with the `&` operator.

```
alias Dog = Animal & Pet;
```

#### Array

Arrays describe lists of things. Create an Array type with the `[]` operator.

```
alias Pack = Dog[];
```

### Operations

Operations describe service endpoints and consist of an operation name, parameters, and return type. Operations are declared using the `op` keyword:

```
op getDog(name: string): Dog;
```

The operation's parameters describe a model, so anything you can do in a model you can do in a parameter list as well, including using the spread operator:

```
op getDog(... commonParams, name: string): Dog;
```

Often an endpoint point return one of any number of models. For example, there might be return type for when an item is found, and a return type for when an item isn't found. Unions are used to describe this pattern:

```
model DogNotFound {
  error: "Not Found"
}

op getDog(name: string): Dog | DogNotFound;
```


### Namespaces & Usings

Namespaces let you group related types together into namespaces. This helps organize your types making them easier to find and prevents name conflicts. Namespaces are merged across files, so you can reference any type anywhere in your Cadl program via its namespace. You can create namespace blocks like the following:

```
namespace Models {
  model Dog { }
}

operation getDog(): Models.Dog;
```

You can also put an entire Cadl file into a namespace by using the blockless namespace syntax:

```
// models.cadl
namespace Models;
model Dog { };

// main.cadl
import "./models.cadl";
operation getDog(): Models.Dog;
```

Namespace declarations can declare multiple namespaces at once by using a dotted member expression. There's no need to declare nested namespace blocks if you don't want to.

```
namespace A.B;
namespace C.D {}
namespace C.D.E { model M { }}

alias M = A.B.C.D.E.M;
```

It can be convenient to add references to a namespace's declarations to your local namespace, especially when namespaces can become deeply nested. The `using` statement lets us do this:

```
// models.cadl
namespace Service.Models;
model Dog { };

// main.cadl
import "./models.cadl";
using ServiceModels;
operation getDog(): Dog; // here we can use Dog directly.
```

The bindings introduced by a `using` statement are local to the namespace they are declared in. They do not become part of the namespace themselves.

```
namespace Test {
  model A { }
}

namespace Test2 {
  using Test;
  alias B = A; // ok
}

alias C = Test2.A; // not ok
alias C = Test2.B; // ok
```

### Imports

Imports add files or libraries to your Cadl program. When you compile an Cadl file, you provide a path to your root Cadl file, by convention called "main.cadl". From there, any files you import are added to your program. If you import a directory, Cadl will look for a `main.cadl` file inside that directory.

The path you import must either begin with "./" or "../" or otherwise be an absolute path. The path must either refer to a directory, or else have an extension of either ".cadl" or ".js". The following demonstrates how to use imports to assemble an Cadl program from multiple files:

```
// main.cadl
import "./models";
op getDog(): Dog;

// models/main.cadl
import "./dog.cadl"

// models/dog.cadl
namespace Models;
model Dog { }
```

### Decorators

Decorators enable a developer to attach metadata to types in an Cadl program. They can also be used to calculate types based on their inputs. Decorators are the backbone of Cadl's extensibility and give it the flexibility to describe many different kinds of APIs and associated metadata like documentation, constraints, samples, and the like.

Many Cadl constructs can be decorated, including namespaces, operations and their parameters, and models and their members.

Decorators are defined using JavaScript functions that are exported from a standard ECMAScript module. When you import a JavaScript file, Cadl will look for any exported functions, and make them available as decorators inside the Cadl syntax. When a decoratorated declaration is evaluated by Cadl, it will invoke the decorator function, passing along a reference to the current compilation, an object representing the type it is attached to, and any arguments the user provided to the decorator.

Decorators are attached by adding the decorator before the element you want to decorate, prefixing the name of the decorator with `@`. Arguments can be provided by using parentheses in a manner similar to many programming languages, e.g. `@dec(1, "hi", { a: string })`. The parentheses can be omitted when no arguments are provided.

The following shows an example of declaring and then using a decorator:

```js
// model.js
export function logType(compilation, targetType, name) {
  console.log(name + ": " + targetType.kind);
}
```

```
// main.cadl
import "./model.js"

@logType("Dog type")
model Dog {
  @logType("Name type")
  name: string;
};
```

After running this Cadl program, the following will be printed to the console:

```
Name type: ModelProperty
Dog type: Model
```

#### Built-in decorators

Cadl comes built-in with a number of decorators that are useful for defining service APIs regardless of what protocol or language you're targeting.

* @doc - attach a documentation string. Works great with multi-line string literals.
* @tag - attach a simple tag to a declaration
* @secret - mark a string as a secret value that should be treated carefully to avoid exposure
* @minValue/@maxValue - set the min and max values of number types
* @minLength/@maxLength - set the min and max lengths for strings
* @format - set the format for a string using regular expression syntax

##### Visibility decorators

Additionally, the decorators `@withVisibility` and `@visibility` provide an extensible visibility framework that allows for defining a canonical model with fine-grained visibility flags and derived models that apply those flags. Flags can be any string value and so can be customized to your application. Also, `@visibility` can take multiple string flags to set multiple flags at once, and `@withVisibility` can take multiple string flags to filter on at once.

Consider the following example:

```
model Dog {
  // the service will generate an ID, so you dont need to send it.
  @visibility('read') id: int32;
  
  // the service will store this secret name, but won't ever return it
  @visibility('write') secretName: string;

  // no flags are like specifying all flags at once, so in this case
  // equivalent to @visibility('read', 'write')
  name: string;
}

// The spread operator will copy all the properties of Dog into ReadDog,
// and withVisibility will remove any that don't match the current
// visibility setting
@withVisibility('read')
model ReadDog {
  ... Dog;
}

@withVisibility('write')
model WriteDog {
  ... Dog;
}
```

### Libraries

Cadl libraries are bundles of useful Cadl declarations and decorators into reusable packages. Cadl libraries are actually npm packages under the covers. Official Cadl libraries can be found with the `@azure-tools/cadl-` npm package name prefix.

#### Using libraries

The first step in using a library is to install it via `npm`. You can get `npm` and `node` from the [Node.js website](https://nodejs.org).

If you haven't already intiialized your Cadl project's package.json file, now would be a good time to do so. The package.json file lets you track the dependencies your project depends on, and is a best practice to check in along with any Cadl files you create. Run `npm init` create your package.json file.

Then, in your Cadl project directory, type `npm install libraryName` to install a library. For example, to install the official Cadl REST API bindings and OpenAPI generator, you would type `npm install @azure-tools/cadl-rest @azure-tools/cadl-openapi`.

Lastly, you need to import the libraries into your Cadl program. By convention, all external dependencies are imported in your `main.cadl` file, but can be in any Cadl file imported into your program. Importing the two libraries we installed above would look like this:

```
// in main.cadl
import "@azure-tools/cadl-rest";
import "@azure-tools/cadl-openapi";
```

#### Creating libraries

Creating an Cadl library is essentially the same as creating any NPM library. [Consult the official documentation for more info](https://docs.npmjs.com/creating-node-js-modules). `main` should refer to a JS file that exports all your library's decorators and helper utilities.

The package.json file for an Cadl library requires one additional field: `cadlMain`, which refers to the root file of your Cadl program similar to how `main` refers to the root of a JS program. If you don't have any Cadl declarations, `cadlMain` can be identical to `main`.

### REST APIs

With the language building blocks we've covered so far we're ready to author our first REST API. Cadl has an official REST API "binding" called `@azure-tools/cadl-rest`. It's a set of Cadl declarations and decorators that describe REST APIs and can be used by code generators to generate OpenAPI descriptions, implementation code, and the like.

Cadl also has an official OpenAPI emitter called `@azure-tools/cadl-openapi` that consumes the REST API bindings and emits standard OpenAPI descriptions. This can then be fed in to any OpenAPI code generation pipeline.

The following examples assume you have imported both `@azure-tools/cadl-openapi` and `@azure-tools/cadl-rest` somewhere in your Cadl program (though importing them in `main.cadl` is the standard convention).

#### Service definition and metadata

A definition for a service is the namespace that contains all the operations for the service and carries top-level metadata like service name and version. Cadl offers the following decorators for providing this metadata, and all are optional.

* @serviceTitle - the title of the service
* @serviceVersion - the version of the service. Can be any string, but later version should lexigraphically sort after earlier versions
* @produces - the content types the service may produce
* @consumes - the content types that may be sent to the service

Here's an example that uses these to define a Pet Store service:

```
@serviceTitle("Pet Store Service")
@serviceVersion("2021-03-25")
@produces("application/json", "image/png")
@consumes("application/json")
namespace PetStore;
```


#### Resources & routes

Resources are operations that are grouped in a namespace. You declare such a namespace by adding the `@resource` decorator and providing the path to that resource:

```
@resource("/pets")
namespace Pets { }
```

To define an operation on this resource, you need to provide the HTTP verb for the route using the `@get`, `@head` `@post`, `@put`, `@patch`, or `@delete` decorators. Alternatively, you can name your operation `list`, `create`, `read`, `update`, `delete`, or `deleteAll` and the appropriate verb will be used automatically. Lets add an operation to our `Pets` resource:

```
@resource("/pets")
namespace Pets {
  op list(): Pet[];
  
  // or you could also use
  @get op listPets(): Pet[];
}
```

#### Path and query parameters

Model properties and parameters which should be passed as path and query parameters use the `@path` and `@query` parameters respectively. Let's modify our list route to support pagination, and add a read route to our Pets resource:

```
@resource("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): Pet[];
  
  op read(@path petId: int32): Pet;
}
```

Path parameters are appended to the URL unless a substitution with that parameter name exists on the resource path. For example, we might define a sub-resource using the following Cadl. Note how the path parameter for our sub-resource's list operation corresponds to the substitution in the URL.

```
@resource("/pets/{petId}/toys")
namespace PetToys {
  op list(@path petId: int32): Toy[];
}
```

#### Headers

Model properties and parameters that should be passed in a header use the `@header` decorator. The decorator takes the header name as a parameter. If a header name is not provided, it is inferred from the property or parameter name. Let's add `etag` support to our pet store's read operation:

```
model PetWithETag {
  ... Pet;
  @header eTag: string;
}

@resource("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): Pet[];
  op read(@path petId: int32, @header ifMatch?: string): PetWithETag;
}
```

#### Request & response bodies

Request and response bodies are declared using the `@body` decorator. Let's add an endpoint to create a pet. Let's also use this decorator for the responses, although this doesn't change anything about the API.

```
@resource("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): { @body pets: Pet[] };
  op read(@path petId: int32, @header ifMatch?: string): { @body pet: PetWithETag };
  op create(@body pet: Pet): {};
}
```

#### Status codes

Use the `@status` decorator to declare a status code for a response. Generally, setting this to just `int32` isn't particularly useful. Instead, use number literal types to create a discriminated union of response types. Let's add status codes to our responses, and add a 404 response to our read endpoint.

```
@resource("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): { @status code: 200, @body pets: Pet[] };
  op read(@path petId: int32, @header ifMatch?: string):
   { @status code: 200, @body pet: PetWithETag } | { @status code: 404 }
  op create(@body pet: Pet): { @status code: 200 };
}
```

#### Built-in request shapes

Since status codes are so common for REST APIs, Cadl comes with some built-in types for common status codes so you don't need to declare status codes so frequently. Lets update our sample one last time to use these built-in response types:

```
@resource("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): OkResponse<Pet[]>;
  op read(@path petId: int32, @header ifMatch?: string): OkResponse<PetWithETag> | NotFoundResponse;
  op create(@body pet: Pet): OkResponse<{}>;
}
```

## Next steps

Check out the [samples directory](https://github.com/Azure/adl/tree/master/packages/cadl-samples/) for more detailed real world examples of Cadl in action!
