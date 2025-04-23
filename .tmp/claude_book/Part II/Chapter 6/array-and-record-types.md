# Array and Record Types

TypeSpec provides powerful ways to work with collections of values through array types and record types. These collection types allow you to express complex data structures that involve multiple related values.

## Array Types

Arrays in TypeSpec represent ordered collections of values of the same type. They are used to model lists, collections, or sequences of items.

### Basic Array Syntax

To declare an array type, use square brackets (`[]`) after the element type:

```typespec
model BlogPost {
  id: string;
  title: string;
  content: string;
  tags: string[]; // An array of strings
}
```

This creates a property `tags` that is an array of string values.

### Arrays of Complex Types

Arrays can contain any type, including models:

```typespec
model Comment {
  id: string;
  author: string;
  text: string;
  timestamp: utcDateTime;
}

model BlogPost {
  id: string;
  title: string;
  content: string;
  comments: Comment[]; // An array of Comment models
}
```

### Nested Arrays

TypeSpec supports multidimensional arrays, though they should be used sparingly in API design:

```typespec
model ChessGame {
  id: string;
  board: string[][]; // A 2D array representing a chess board
}
```

### Array Constraints

You can add constraints to array properties using decorators:

```typespec
model Playlist {
  id: string;
  name: string;

  @minItems(1)
  @maxItems(100)
  songs: Song[]; // Must have at least 1 song and at most 100 songs
}
```

Common array constraints include:

- `@minItems`: Specifies the minimum number of items in the array
- `@maxItems`: Specifies the maximum number of items in the array

### Empty Arrays vs. Optional Arrays

There's an important distinction between empty arrays and optional arrays:

```typespec
model Example {
  requiredArray: string[]; // Array must be present, but can be empty
  optionalArray?: string[]; // Array can be entirely absent
}
```

## Record Types

Record types in TypeSpec represent mappings from keys to values, similar to dictionaries or maps in programming languages. They are defined using the `Record<K, V>` template type.

### Basic Record Syntax

```typespec
model UserPreferences {
  id: string;
  settings: Record<string, string>; // A mapping from string keys to string values
}
```

In this example, `settings` is a record where both the keys and values are strings.

### Records with Complex Value Types

Records can have complex value types:

```typespec
model MetadataHolder {
  id: string;
  metadata: Record<
    string,
    {
      value: string;
      timestamp: utcDateTime;
      creator: string;
    }
  >;
}
```

### Records with Specific Key Types

While most records use string keys, you can constrain the key type:

```typespec
@format("uuid")
scalar UUID extends string;

model ResourceIndex {
  resources: Record<UUID, Resource>; // Map from UUID to Resource objects
}
```

### Records vs. Arrays

Records and arrays serve different purposes:

- Arrays are ordered collections of items of the same type, accessed by position
- Records are unordered mappings from keys to values, accessed by key

Choose the appropriate collection type based on how the data will be accessed and structured.

## Dynamic Properties

For models where the property names themselves are dynamic, you can use the Record type pattern:

```typespec
model DynamicConfig {
  id: string;

  // Dynamic property names with string values
  properties: Record<string, string>;
}
```

This allows for arbitrary properties to be defined without explicitly naming them in the TypeSpec model.

## Combining Arrays and Records

Arrays and records can be combined in various ways to represent complex data structures:

```typespec
model ComplexData {
  // Array of records
  userSettings: Record<string, string>[];

  // Record of arrays
  categoryItems: Record<string, Item[]>;

  // Record of records
  nestedMappings: Record<string, Record<string, string>>;
}
```

## Array and Record Transformation

In addition to direct use, arrays and records can be used with template types for transformations:

```typespec
model TaggedItem<T> {
  value: T;
  tags: string[];
}

model UserData {
  preferences: Record<string, string>;
  history: string[];
}

// Creates an array of TaggedItem<UserData>
model TaggedUserDataCollection is TaggedItem<UserData>[];
```

## Best Practices

### For Arrays

- **Use arrays for ordered collections**: When order matters or items are naturally sequential.
- **Add constraints**: Use `@minItems` and `@maxItems` to document and enforce expectations about array size.
- **Keep arrays homogeneous**: Arrays should contain items of the same type.
- **Consider performance**: Be mindful of potential performance implications of large arrays in APIs.
- **Document expectations**: If specific semantics are attached to array positions, document them clearly.

### For Records

- **Use records for key-value mappings**: When data is naturally organized as key-value pairs.
- **Choose key types carefully**: Use string keys for simplicity and compatibility, or more specific types when needed.
- **Document key patterns**: If keys follow a pattern or naming convention, document it.
- **Consider validation**: Be aware that validating record keys can be challenging in some target platforms.
- **Be cautious with nested records**: Deeply nested records can be hard to work with and validate.

### General

- **Favor explicit models**: When the structure is known in advance, prefer explicit model properties over generic records.
- **Consider serialization**: Be aware of how arrays and records will be represented in target formats (JSON, XML, etc.).
- **Balance flexibility and specificity**: More specific types provide better validation and documentation, while generic collections offer more flexibility.

By effectively using array and record types, you can model a wide variety of collection-based data structures in your API definitions, from simple lists to complex nested mappings.
