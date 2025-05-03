---
title: "[API] Typekits"
---

# Typekits

## ArrayKit

### create

```ts
/**
 * Create an array type.
 */
$(program).array.create(elementType: Type): ArrayModelType;
```

### getElementType

```ts
/**
 * Get the element type of an array.
 */
$(program).array.getElementType(type: Model): Type;
```

### is

```ts
/**
 * Check if a type is an array.
 */
$(program).array.is(type: Entity): type is ArrayModelType;
```

## BuiltinKit

A kit of built-in types.

## EntityKit

### isAssignableTo

```ts
/**
 * Check if the source type can be assigned to the target.
 *
 * @param source - Source type
 *
 * @param target - Target type
 *
 * @param diagnosticTarget - Target for the diagnostic
 */
$(program).entity.isAssignableTo: Diagnosable<(source: Entity, target: Entity, diagnosticTarget?: Entity | Node) => boolean>;
```

### resolve

```ts
/**
 * Resolve a type reference string to a TypeSpec type. By default any diagnostics are ignored.
 *
 * Call `resolve.withDiagnostics("Type")` to get a tuple containing the resolved type and any diagnostics.
 */
$(program).entity.resolve: Diagnosable<(reference: string) => Entity | undefined>;
```

## EnumKit

A kit for working with enum types.

### create

```ts
/**
 * Build an enum type. The enum type will be finished (i.e. decorators are run).
 */
$(program).enum.create(desc: EnumDescriptor): Enum;
```

### createFromUnion

```ts
/**
 * Build an equivalent enum from the given union.
 *
 * @remarks
 *
 * Union variants which are not valid enum members are skipped. You can check if a union is a valid enum with {@link UnionKit.union}'s `isEnumValue`.
 *
 * Any API documentation will be rendered and preserved in the resulting enum. - No other decorators are copied from the union to the enum
 */
$(program).enum.createFromUnion(type: Union): Enum;
```

### is

```ts
/**
 * Check if `type` is an enum type.
 *
 * @param type - the type to check.
 */
$(program).enum.is(type: Entity): type is Enum;
```

## EnumMemberKit

A kit for working with enum members.

### create

```ts
/**
 * Create an enum member. The enum member will be finished (i.e. decorators are run).
 */
$(program).enumMember.create(desc: EnumMemberDescriptor): EnumMember;
```

### is

```ts
/**
 * Check if `type` is an enum member type.
 *
 * @param type - the type to check.
 */
$(program).enumMember.is(type: Entity): type is EnumMember;
```

## IntrinsicKit

### is

```ts
/**
 * Check if `entity` is an intrinsic type.
 *
 * @param entity - The `entity` to check.
 */
$(program).intrinsic.is(entity: Entity): entity is IntrinsicType;
```

## ModelKit

Utilities for working with models.

### create

```ts
/**
 * Create a model type.
 *
 * @param desc - The descriptor of the model.
 */
$(program).model.create(desc: ModelDescriptor): Model;
```

### getAdditionalPropertiesRecord

```ts
/**
 * Get the record representing additional properties, if there are additional properties. This method checks for additional properties in the following cases: 1. If the model is a Record type. 2. If the model extends a Record type. 3. If the model spreads a Record type.
 *
 * @param model - The model to get the additional properties type of.
 *
 * @returns The record representing additional properties, or undefined if there are none.
 */
$(program).model.getAdditionalPropertiesRecord(model: Model): Model | undefined;
```

### getDiscriminatedUnion

```ts
/**
 * Resolves a discriminated union for the given model from inheritance.
 *
 * @param type - Model to resolve the discriminated union for.
 */
$(program).model.getDiscriminatedUnion: Diagnosable<(model: Model) => DiscriminatedUnionLegacy | undefined>;
```

### getEffectiveModel

```ts
/**
 * If the input is anonymous (or the provided filter removes properties) and there exists a named model with the same set of properties (ignoring filtered properties), then return that named model. Otherwise, return the input unchanged.
 *
 * This can be used by emitters to find a better name for a set of properties after filtering. For example, given `{  @metadata prop: string} & SomeName`, and an emitter that wishes to discard properties marked with `@metadata`, the emitter can use this to recover that the best name for the remaining properties is `SomeName`.
 *
 * @param model - The input model
 *
 * @param filter - An optional filter to apply to the input model's properties.
 */
$(program).model.getEffectiveModel(model: Model, filter?: (property: ModelProperty) => boolean): Model;
```

### getProperties

```ts
/**
 * Gets all properties from a model, explicitly defined and implicitly defined.
 *
 * @param model - model to get the properties from
 */
$(program).model.getProperties(model: Model, options?: {
        includeExtended?: boolean;
    }): RekeyableMap<string, ModelProperty>;
```

### is

```ts
/**
 * Check if the given `type` is a model..
 *
 * @param type - The type to check.
 */
$(program).model.is(type: Entity): type is Model;
```

### isExpresion

```ts
/**
 * Check this is an anonyous model. Specifically, this checks if the model has a name.
 *
 * @param type - The model to check.
 */
$(program).model.isExpresion(type: Model): boolean;
```

## ModelPropertyKit

Utilities for working with model properties.

For many reflection operations, the metadata being asked for may be found on the model property or the type of the model property. In such cases, these operations will return the metadata from the model property if it exists, or the type of the model property if it exists.

### create

```ts
/**
 * Creates a modelProperty type.
 *
 * @param desc - The descriptor of the model property.
 */
$(program).modelProperty.create(desc: ModelPropertyDescriptor): ModelProperty;
```

### getEncoding

```ts
/**
 * Get the encoding of the model property or its type. The property's type must be a scalar.
 *
 * @param property - The model property to get the encoding for.
 */
$(program).modelProperty.getEncoding(property: ModelProperty): EncodeData | undefined;
```

### getFormat

```ts
/**
 * Get the format of the model property or its type. The property's type must be a string.
 *
 * @param property - The model property to get the format for.
 */
$(program).modelProperty.getFormat(property: ModelProperty): string | undefined;
```

### getVisibilityForClass

```ts
/**
 * Get the visibility of the model property.
 */
$(program).modelProperty.getVisibilityForClass(property: ModelProperty, visibilityClass: Enum): Set<EnumMember>;
```

### is

```ts
/**
 * Check if the given `type` is a model property.
 *
 * @param type - The type to check.
 */
$(program).modelProperty.is(type: Entity): type is ModelProperty;
```

## OperationKit

Utilities for working with operation properties.

### create

```ts
/**
 * Create an operation type.
 *
 * @param desc - The descriptor of the operation.
 */
$(program).operation.create(desc: OperationDescriptor): Operation;
```

### getPagingMetadata

```ts
/**
 * Get the paging operation's metadata for an operation.
 *
 * @param operation - operation to get the paging operation for
 */
$(program).operation.getPagingMetadata: Diagnosable<(operation: Operation) => PagingOperation | undefined>;
```

### is

```ts
/**
 * Check if the type is an operation.
 *
 * @param type - type to check
 */
$(program).operation.is(type: Entity): type is Operation;
```

## RecordKit

RecordKit provides utilities for working with Record Model types.

### create

```ts
/**
 * Create a Record Model type
 *
 * @param elementType - The type of the elements in the record
 */
$(program).record.create(elementType: Type): RecordModelType;
```

### getElementType

```ts
/**
 * Get the element type of a Record
 *
 * @param type - a Record Model type
 */
$(program).record.getElementType(type: Model): Type;
```

### is

```ts
/**
 * Check if the given `type` is a Record.
 *
 * @param type - The type to check.
 */
$(program).record.is(type: Entity): type is RecordModelType;
```

## TupleKit

### create

```ts
/**
 * Creates a tuple type.
 *
 * @param values - The tuple values, if any.
 */
$(program).tuple.create(values?: Type[]): Tuple;
```

### is

```ts
/**
 * Check if a type is a tuple.
 */
$(program).tuple.is(type: Entity): type is Tuple;
```

## TypeTypekit

### clone

```ts
/**
 * Clones a type and adds it to the typekit's realm.
 *
 * @param type - Type to clone
 */
$(program).type.clone<T extends Type>(type: T): T;
```

### finishType

```ts
/**
 * Finishes a type, applying all the decorators.
 */
$(program).type.finishType(type: Type): void;
```

### getDoc

```ts
/**
 * Get the documentation of this type as specified by the `@doc` decorator or the JSDoc comment.
 *
 * @param type - The type to get the documentation for.
 */
$(program).type.getDoc(type: Type): string | undefined;
```

### getEncodedName

```ts
/**
 * Get the name of this type in the specified encoding.
 */
$(program).type.getEncodedName(type: Type & {
        name: string;
    }, encoding: string): string;
```

### getPlausibleName

```ts
/**
 * Get the plausible name of a type. If the type has a name, it will use it otherwise it will try generate a name based on the context. If the type can't get a name, it will return an empty string. If the type is a TemplateInstance, it will prefix the name with the template arguments.
 *
 * @param type - The scalar to get the name of.z
 */
$(program).type.getPlausibleName(type: Model | Union | Enum | Scalar): string;
```

### getSummary

```ts
/**
 * Get the summary of this type as specified by the `@summary` decorator.
 *
 * @param type - The type to get the summary for.
 */
$(program).type.getSummary(type: Type): string | undefined;
```

### inNamespace

```ts
/**
 * Checks if the given type is in the given namespace (directly or indirectly) by walking up the type's namespace chain.
 *
 * @param type - The type to check.
 *
 * @param namespace - The namespace to check membership against.
 *
 * @returns True if the type is in the namespace, false otherwise.
 */
$(program).type.inNamespace(type: Type, namespace: Namespace): boolean;
```

### is

```ts
/**
 * Checks if `entity` is a Type.
 *
 * @param entity - The entity to check.
 */
$(program).type.is(entity: Entity): entity is Type;
```

### isAssignableTo

```ts
/**
 * Check if the source type can be assigned to the target.
 *
 * @param source - Source type
 *
 * @param target - Target type
 *
 * @param diagnosticTarget - Target for the diagnostic
 */
$(program).type.isAssignableTo: Diagnosable<(source: Type, target: Entity, diagnosticTarget?: Entity | Node) => boolean>;
```

### isError

```ts
/**
 * Checks if a type is decorated with `@error`
 *
 * @param type - The type to check.
 */
$(program).type.isError(type: Type): type is Model;
```

### isNever

```ts
/**
 * Checks if the given type is a never type.
 */
$(program).type.isNever(type: Type): boolean;
```

### isUserDefined

```ts
/**
 * Checks if the given type is a user defined type. Non-user defined types are defined in the compiler or other libraries imported by the spec.
 *
 * @param type - The type to check.
 *
 * @returns True if the type is a user defined type, false otherwise.
 */
$(program).type.isUserDefined(type: Type): boolean;
```

### maxItems

```ts
/**
 * Gets the maximum number of items for an array type.
 *
 * @param type - type to get the maximum number of items for
 */
$(program).type.maxItems(type: Type): number | undefined;
```

### maxLength

```ts
/**
 * Gets the maximum length for a string type.
 *
 * @param type - type to get the maximum length for
 */
$(program).type.maxLength(type: Type): number | undefined;
```

### maxValue

```ts
/**
 * Gets the maximum value for a numeric or model property type.
 *
 * @param type - type to get the maximum value for
 */
$(program).type.maxValue(type: Type): number | undefined;
```

### maxValueExclusive

```ts
/**
 * Gets the maximum value this numeric type should be, exclusive of the given value.
 *
 * @param type -
 */
$(program).type.maxValueExclusive(type: Type): number | undefined;
```

### minItems

```ts
/**
 * Gets the minimum number of items for an array type.
 *
 * @param type - type to get the minimum number of items for
 */
$(program).type.minItems(type: Type): number | undefined;
```

### minLength

```ts
/**
 * Gets the minimum length for a string type.
 *
 * @param type - type to get the minimum length for
 */
$(program).type.minLength(type: Type): number | undefined;
```

### minValue

```ts
/**
 * Gets the minimum value for a numeric or model property type.
 *
 * @param type - type to get the minimum value for
 */
$(program).type.minValue(type: Type): number | undefined;
```

### minValueExclusive

```ts
/**
 * Gets the minimum value this numeric type should be, exclusive of the given value.
 *
 * @param type - type to get the minimum value for
 */
$(program).type.minValueExclusive(type: Type): number | undefined;
```

### resolve

```ts
/**
 * Resolve a type reference to a TypeSpec type. By default any diagnostics are ignored.
 *
 * If a `kind` is provided, it will check if the resolved type matches the expected kind and throw an error if it doesn't.
 *
 * Call `type.resolve.withDiagnostics("reference")` to get a tuple containing the resolved type and any diagnostics.
 */
$(program).type.resolve: Diagnosable<(<K extends Type["kind"] | undefined>(reference: string, kind?: K) => K extends Type["kind"] ? Extract<Type, {
        kind: K;
    }> : undefined)>;
```

## UnionKit

Utilities for working with unions.

### create

```ts
/**
 * Create an anonymous union type from an array of types.
 *
 * @param children - The types to create a union from.
 *
 * Any API documentation will be rendered and preserved in the resulting union.
 *
 * No other decorators are copied from the enum to the union.
 */
$(program).union.create(children: Type[]): Union;
```

### createFromEnum

```ts
/**
 * Creates a union type from an enum.
 *
 * @remarks
 *
 * @param type - The enum to create a union from.
 *
 * For member without an explicit value, the member name is used as the value.
 *
 * Any API documentation will be rendered and preserved in the resulting union.
 *
 * No other decorators are copied from the enum to the union.
 */
$(program).union.createFromEnum(type: Enum): Union;
```

### filter

```ts
/**
 * Creates a union type with filtered variants.
 *
 * @param filterFn - Function to filter the union variants
 */
$(program).union.filter(union: Union, filterFn: (variant: UnionVariant) => boolean): Union;
```

### getDiscriminatedUnion

```ts
/**
 * Resolves a discriminated union for the given union.
 *
 * @param type - Union to resolve the discriminated union for.
 */
$(program).union.getDiscriminatedUnion: Diagnosable<(type: Union) => DiscriminatedUnion | undefined>;
```

### is

```ts
/**
 * Check if the given `type` is a union.
 *
 * @param type - The type to check.
 */
$(program).union.is(type: Entity): type is Union;
```

### isExpression

```ts
/**
 * Checks if an union is an expression (anonymous) or declared.
 *
 * @param type - Uniton to check if it is an expression
 */
$(program).union.isExpression(type: Union): boolean;
```

### isExtensible

```ts
/**
 * Check if a union is extensible. Extensible unions are unions which contain a variant that is a supertype of all the other types. This means that the subtypes of the common supertype are known example values, but others may be present.
 *
 * @param type - The union to check.
 */
$(program).union.isExtensible(type: Union): boolean;
```

### isValidEnum

```ts
/**
 * Check if the union is a valid enum. Specifically, this checks if the union has a name (since there are no enum expressions), and whether each of the variant types is a valid enum member value.
 *
 * @param type - The union to check.
 */
$(program).union.isValidEnum(type: Union): boolean;
```

## UnionVariantKit

Utilities for working with union variants.

Union variants are types that represent a single value within a union that can be one of several types.

### create

```ts
/**
 * Create a union variant.
 *
 * @param desc - The descriptor of the union variant.
 */
$(program).unionVariant.create(desc: UnionVariantDescriptor): UnionVariant;
```

### is

```ts
/**
 * Check if the given `type` is a union.
 *
 * @param type - The type to check.
 */
$(program).unionVariant.is(type: Entity): type is UnionVariant;
```

## ValueKit

### create

```ts
/**
 * Create a Value type from a JavaScript value.
 *
 * @param value - The JavaScript value to turn into a TypeSpec Value type.
 */
$(program).value.create(value: string | number | boolean): Value;
```

### createBoolean

```ts
/**
 * Create a boolean Value type from a JavaScript boolean value.
 *
 * @param value - The boolean value.
 */
$(program).value.createBoolean(value: boolean): BooleanValue;
```

### createNumeric

```ts
/**
 * Create a numeric Value type from a JavaScript number value.
 *
 * @param value - The numeric value.
 */
$(program).value.createNumeric(value: number): NumericValue;
```

### createString

```ts
/**
 * Create a string Value type from a JavaScript string value.
 *
 * @param value - The string value.
 */
$(program).value.createString(value: string): StringValue;
```

### is

```ts
/**
 * Check if `type` is a Value type.
 *
 * @param type - The type to check.
 */
$(program).value.is(type: Entity): type is Value;
```

### isArray

```ts
/**
 * Check if `type` is an array value type
 *
 * @param type - The type to check.
 */
$(program).value.isArray(type: Entity): type is ArrayValue;
```

### isAssignableTo

```ts
/**
 * Check if the source type can be assigned to the target.
 *
 * @param source - Source type
 *
 * @param target - Target type
 *
 * @param diagnosticTarget - Target for the diagnostic
 */
$(program).value.isAssignableTo: Diagnosable<(source: Value, target: Entity, diagnosticTarget?: Entity | Node) => boolean>;
```

### isBoolean

```ts
/**
 * Check if `type` is a boolean Value type.
 *
 * @param type - The type to check.
 */
$(program).value.isBoolean(type: Entity): type is BooleanValue;
```

### isEnum

```ts
/**
 * Check if `type` is an enum value type
 *
 * @param type - The type to check.
 */
$(program).value.isEnum(type: Entity): type is EnumValue;
```

### isNull

```ts
/**
 * Check if `type` is a null value Type.
 *
 * @param type - The type to check.
 */
$(program).value.isNull(type: Entity): type is NullValue;
```

### isNumeric

```ts
/**
 * Check if `type` is a numeric Value type.
 *
 * @param type - The type to check.
 */
$(program).value.isNumeric(type: Entity): type is NumericValue;
```

### isObject

```ts
/**
 * Check if `type` is an object value type
 *
 * @param type - The type to check.
 */
$(program).value.isObject(type: Entity): type is ObjectValue;
```

### isScalar

```ts
/**
 * Check if `type` is a scalar value type
 *
 * @param type - The type to check.
 */
$(program).value.isScalar(type: Entity): type is ScalarValue;
```

### isString

```ts
/**
 * Check if `type` is a string Value type.
 *
 * @param type - The type to check.
 */
$(program).value.isString(type: Entity): type is StringValue;
```

### resolve

```ts
/**
 * Resolve a value reference to a TypeSpec value. By default any diagnostics are ignored.
 *
 * If a `kind` is provided, it will check if the resolved value matches the expected kind and throw an error if it doesn't.
 *
 * Call `value.resolve.withDiagnostics("reference")` to get a tuple containing the resolved value and any diagnostics.
 */
$(program).value.resolve: Diagnosable<(<K extends Value["valueKind"] | undefined>(reference: string, kind?: K) => K extends Value["valueKind"] ? Extract<Value, {
        valueKind: K;
    }> : undefined)>;
```
