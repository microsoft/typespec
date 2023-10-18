import { paramMessage, createTypeSpecLibrary, typespecTypeToJson, getFriendlyName, isTemplateInstance, getTypeName, isGlobalNamespace, isService, getVisibility } from '@typespec/compiler';
import { setStatusCode } from '@typespec/http';

const libDef = {
    name: "@typespec/openapi",
    diagnostics: {
        "invalid-extension-key": {
            severity: "error",
            messages: {
                default: paramMessage `OpenAPI extension must start with 'x-' but was '${"value"}'`,
            },
        },
        "duplicate-type-name": {
            severity: "error",
            messages: {
                default: paramMessage `Duplicate type name: '${"value"}'. Check @friendlyName decorators and overlap with types in TypeSpec or service namespace.`,
                parameter: paramMessage `Duplicate parameter key: '${"value"}'. Check @friendlyName decorators and overlap with types in TypeSpec or service namespace.`,
            },
        },
    },
};
const { reportDiagnostic, createStateSymbol } = createTypeSpecLibrary(libDef);

const namespace = "TypeSpec.OpenAPI";
const operationIdsKey = createStateSymbol("operationIds");
/**
 * Set a specific operation ID.
 * @param context Decorator Context
 * @param entity Decorator target
 * @param opId Operation ID.
 */
function $operationId(context, entity, opId) {
    context.program.stateMap(operationIdsKey).set(entity, opId);
}
/**
 * @returns operationId set via the @operationId decorator or `undefined`
 */
function getOperationId(program, entity) {
    return program.stateMap(operationIdsKey).get(entity);
}
const openApiExtensionKey = createStateSymbol("openApiExtension");
function $extension(context, entity, extensionName, value) {
    if (!isOpenAPIExtensionKey(extensionName)) {
        reportDiagnostic(context.program, {
            code: "invalid-extension-key",
            format: { value: extensionName },
            target: entity,
        });
    }
    const [data, diagnostics] = typespecTypeToJson(value, entity);
    if (diagnostics.length > 0) {
        context.program.reportDiagnostics(diagnostics);
    }
    setExtension(context.program, entity, extensionName, data);
}
function setExtension(program, entity, extensionName, data) {
    var _a;
    const openApiExtensions = program.stateMap(openApiExtensionKey);
    const typeExtensions = (_a = openApiExtensions.get(entity)) !== null && _a !== void 0 ? _a : new Map();
    typeExtensions.set(extensionName, data);
    openApiExtensions.set(entity, typeExtensions);
}
function getExtensions(program, entity) {
    var _a;
    return (_a = program.stateMap(openApiExtensionKey).get(entity)) !== null && _a !== void 0 ? _a : new Map();
}
function isOpenAPIExtensionKey(key) {
    return key.startsWith("x-");
}
/**
 * The @defaultResponse decorator can be applied to a model. When that model is used
 * as the return type of an operation, this return type will be the default response.
 *
 */
const defaultResponseKey = createStateSymbol("defaultResponse");
function $defaultResponse(context, entity) {
    // eslint-disable-next-line deprecation/deprecation
    setStatusCode(context.program, entity, ["*"]);
    context.program.stateSet(defaultResponseKey).add(entity);
}
/**
 * Check if the given model has been mark as a default response.
 * @param program TypeSpec Program
 * @param entity Model to check.
 * @returns boolean.
 */
function isDefaultResponse(program, entity) {
    return program.stateSet(defaultResponseKey).has(entity);
}
const externalDocsKey = createStateSymbol("externalDocs");
/**
 * Allows referencing an external resource for extended documentation.
 * @param url The URL for the target documentation. Value MUST be in the format of a URL.
 * @param @optional description A short description of the target documentation.
 */
function $externalDocs(context, target, url, description) {
    const doc = { url };
    if (description) {
        doc.description = description;
    }
    context.program.stateMap(externalDocsKey).set(target, doc);
}
function getExternalDocs(program, entity) {
    return program.stateMap(externalDocsKey).get(entity);
}
const infoKey = createStateSymbol("info");
function $info(context, entity, model) {
    const [data, diagnostics] = typespecTypeToJson(model, context.getArgumentTarget(0));
    context.program.reportDiagnostics(diagnostics);
    context.program.stateMap(infoKey).set(entity, data);
}
function getInfo(program, entity) {
    return program.stateMap(infoKey).get(entity);
}

/**
 * Determines whether a type will be inlined in OpenAPI rather than defined
 * as a schema and referenced.
 *
 * All anonymous types (anonymous models, arrays, tuples, etc.) are inlined.
 *
 * Template instantiations are inlined unless they have a friendly name.
 *
 * A friendly name can be provided by the user using `@friendlyName`
 * decorator, or chosen by default in simple cases.
 */
function shouldInline(program, type) {
    if (getFriendlyName(program, type)) {
        return false;
    }
    switch (type.kind) {
        case "Model":
            return !type.name || isTemplateInstance(type);
        case "Scalar":
            return program.checker.isStdType(type) || isTemplateInstance(type);
        case "Enum":
        case "Union":
            return !type.name;
        default:
            return true;
    }
}
/**
 * Gets the name of a type to be used in OpenAPI.
 *
 * For inlined types: this is the TypeSpec-native name written to `x-typespec-name`.
 *
 * For non-inlined types: this is either the friendly name or the TypeSpec-native name.
 *
 * TypeSpec-native names are shortened to exclude root `TypeSpec` namespace and service
 * namespace using the provided `TypeNameOptions`.
 */
function getOpenAPITypeName(program, type, options, existing) {
    var _a;
    const name = (_a = getFriendlyName(program, type)) !== null && _a !== void 0 ? _a : getTypeName(type, options);
    checkDuplicateTypeName(program, type, name, existing);
    return name;
}
function checkDuplicateTypeName(program, type, name, existing) {
    if (existing && existing[name]) {
        reportDiagnostic(program, {
            code: "duplicate-type-name",
            format: {
                value: name,
            },
            target: type,
        });
    }
}
/**
 * Gets the key that is used to define a parameter in OpenAPI.
 */
function getParameterKey(program, property, newParam, existingParams, options) {
    const parent = property.model;
    let key = getOpenAPITypeName(program, parent, options);
    if (parent.properties.size > 1) {
        key += `.${property.name}`;
    }
    if (existingParams[key]) {
        reportDiagnostic(program, {
            code: "duplicate-type-name",
            messageId: "parameter",
            format: {
                value: key,
            },
            target: property,
        });
    }
    return key;
}
/**
 * Resolve the OpenAPI operation ID for the given operation using the following logic:
 * - If @operationId was specified use that value
 * - If operation is defined at the root or under the service namespace return `<operation.name>`
 * - Otherwise(operation is under another namespace or interface) return `<namespace/interface.name>_<operation.name>`
 *
 * @param program TypeSpec Program
 * @param operation Operation
 * @returns Operation ID in this format `<name>` or `<group>_<name>`
 */
function resolveOperationId(program, operation) {
    const explicitOperationId = getOperationId(program, operation);
    if (explicitOperationId) {
        return explicitOperationId;
    }
    if (operation.interface) {
        return `${operation.interface.name}_${operation.name}`;
    }
    const namespace = operation.namespace;
    if (namespace === undefined ||
        isGlobalNamespace(program, namespace) ||
        isService(program, namespace)) {
        return operation.name;
    }
    return `${namespace.name}_${operation.name}`;
}
/**
 * Determines if a property is read-only, which is defined as being
 * decorated `@visibility("read")`.
 *
 * If there is more than 1 `@visibility` argument, then the property is not
 * read-only. For example, `@visibility("read", "update")` does not
 * designate a read-only property.
 */
function isReadonlyProperty(program, property) {
    const visibility = getVisibility(program, property);
    // note: multiple visibilities that include read are not handled using
    // readonly: true, but using separate schemas.
    return (visibility === null || visibility === void 0 ? void 0 : visibility.length) === 1 && visibility[0] === "read";
}

var f0 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $defaultResponse: $defaultResponse,
    $extension: $extension,
    $externalDocs: $externalDocs,
    $info: $info,
    $operationId: $operationId,
    checkDuplicateTypeName: checkDuplicateTypeName,
    getExtensions: getExtensions,
    getExternalDocs: getExternalDocs,
    getInfo: getInfo,
    getOpenAPITypeName: getOpenAPITypeName,
    getOperationId: getOperationId,
    getParameterKey: getParameterKey,
    isDefaultResponse: isDefaultResponse,
    isReadonlyProperty: isReadonlyProperty,
    namespace: namespace,
    resolveOperationId: resolveOperationId,
    setExtension: setExtension,
    shouldInline: shouldInline
});

const TypeSpecJSSources = {
"dist/src/index.js": f0,
};
const TypeSpecSources = {
  "package.json": "{\"name\":\"@typespec/openapi\",\"version\":\"0.49.0\",\"author\":\"Microsoft Corporation\",\"description\":\"TypeSpec library providing OpenAPI concepts\",\"homepage\":\"https://microsoft.github.io/typespec\",\"readme\":\"https://github.com/microsoft/typespec/blob/main/README.md\",\"license\":\"MIT\",\"repository\":{\"type\":\"git\",\"url\":\"git+https://github.com/microsoft/typespec.git\"},\"bugs\":{\"url\":\"https://github.com/microsoft/typespec/issues\"},\"keywords\":[\"typespec\"],\"type\":\"module\",\"main\":\"dist/src/index.js\",\"tspMain\":\"lib/main.tsp\",\"exports\":{\".\":\"./dist/src/index.js\",\"./testing\":\"./dist/src/testing/index.js\"},\"typesVersions\":{\"*\":{\"*\":[\"./dist/src/index.d.ts\"],\"testing\":[\"./dist/src/testing/index.d.ts\"]}},\"engines\":{\"node\":\">=16.0.0\"},\"scripts\":{\"clean\":\"rimraf ./dist ./temp\",\"build\":\"tsc -p . && npm run lint-typespec-library\",\"watch\":\"tsc -p . --watch\",\"lint-typespec-library\":\"tsp compile . --warn-as-error --import @typespec/library-linter --no-emit\",\"test\":\"mocha\",\"test-official\":\"c8 mocha --forbid-only --reporter mocha-multi-reporters\",\"lint\":\"eslint . --ext .ts --max-warnings=0\",\"lint:fix\":\"eslint . --fix --ext .ts\",\"regen-docs\":\"tspd doc .  --enable-experimental  --output-dir ../../docs/standard-library/openapi/reference\"},\"files\":[\"lib/*.tsp\",\"dist/**\",\"!dist/test/**\"],\"peerDependencies\":{\"@typespec/compiler\":\"workspace:~0.49.0\",\"@typespec/http\":\"workspace:~0.49.0\"},\"devDependencies\":{\"@types/mocha\":\"~10.0.1\",\"@types/node\":\"~18.11.9\",\"@typespec/compiler\":\"workspace:~0.49.0\",\"@typespec/http\":\"workspace:~0.49.0\",\"@typespec/rest\":\"workspace:~0.49.0\",\"@typespec/bundler\":\"workspace:~0.1.0-alpha.2\",\"@typespec/eslint-config-typespec\":\"workspace:~0.49.0\",\"@typespec/library-linter\":\"workspace:~0.49.0\",\"@typespec/eslint-plugin\":\"workspace:~0.49.0\",\"@typespec/tspd\":\"workspace:~0.46.0\",\"eslint\":\"^8.49.0\",\"mocha\":\"~10.2.0\",\"mocha-junit-reporter\":\"~2.2.1\",\"mocha-multi-reporters\":\"~1.5.1\",\"c8\":\"~8.0.1\",\"rimraf\":\"~5.0.1\",\"typescript\":\"~5.2.2\"}}",
  "../compiler/lib/main.tsp": "import \"./lib.tsp\";\nimport \"./decorators.tsp\";\nimport \"./reflection.tsp\";\nimport \"./projected-names.tsp\";\n",
  "../compiler/lib/lib.tsp": "namespace TypeSpec;\n\n/**\n * Represent a byte array\n */\nscalar bytes;\n\n/**\n * A numeric type\n */\nscalar numeric;\n\n/**\n * A whole number\n */\nscalar integer extends numeric;\n\n/**\n * A number with decimal value\n */\nscalar float extends numeric;\n\n/**\n * A 64-bit integer. (`-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`)\n */\nscalar int64 extends integer;\n\n/**\n * A 32-bit integer. (`-2,147,483,648` to `2,147,483,647`)\n */\nscalar int32 extends int64;\n\n/**\n * A 16-bit integer. (`-32,768` to `32,767`)\n */\nscalar int16 extends int32;\n\n/**\n * A 8-bit integer. (`-128` to `127`)\n */\nscalar int8 extends int16;\n\n/**\n * A 64-bit unsigned integer (`0` to `18,446,744,073,709,551,615`)\n */\nscalar uint64 extends integer;\n\n/**\n * A 32-bit unsigned integer (`0` to `4,294,967,295`)\n */\nscalar uint32 extends uint64;\n\n/**\n * A 16-bit unsigned integer (`0` to `65,535`)\n */\nscalar uint16 extends uint32;\n\n/**\n * A 8-bit unsigned integer (`0` to `255`)\n */\nscalar uint8 extends uint16;\n\n/**\n * An integer that can be serialized to JSON (`−9007199254740991 (−(2^53 − 1))` to `9007199254740991 (2^53 − 1)` )\n */\nscalar safeint extends int64;\n\n/**\n * A 32 bit floating point number. (`±1.5 x 10^−45` to `±3.4 x 10^38`)\n */\nscalar float64 extends float;\n\n/**\n * A 32 bit floating point number. (`±5.0 × 10^−324` to `±1.7 × 10^308`)\n */\nscalar float32 extends float64;\n\n/**\n * A decimal number with any length and precision.\n */\nscalar decimal extends numeric;\n\n/**\n * A 128-bit decimal number.\n */\nscalar decimal128 extends decimal;\n\n/**\n * A sequence of textual characters.\n */\nscalar string;\n\n/**\n * A date on a calendar without a time zone, e.g. \"April 10th\"\n */\nscalar plainDate;\n\n/**\n * A time on a clock without a time zone, e.g. \"3:00 am\"\n */\nscalar plainTime;\n\n/**\n * An instant in coordinated universal time (UTC)\"\n */\nscalar utcDateTime;\n\n/**\n * A date and time in a particular time zone, e.g. \"April 10th at 3:00am in PST\"\n */\nscalar offsetDateTime;\n\n/**\n * A duration/time period. e.g 5s, 10h\n */\nscalar duration;\n\n/**\n * Boolean with `true` and `false` values.\n */\nscalar boolean;\n\n/**\n * Represent a model\n */\n// Deprecated June 2023 sprint\n#deprecated \"object is deprecated. Please use {} for an empty model, `Record<unknown>` for a record with unknown property types, `unknown[]` for an array.\"\nmodel object {}\n\n/**\n * @dev Array model type, equivalent to `T[]`\n * @template T The type of the array elements\n */\n@indexer(integer, T)\nmodel Array<T> {}\n\n/**\n * @dev Model with string properties where all the properties have type `T`\n * @template T The type of the properties\n */\n@indexer(string, T)\nmodel Record<T> {}\n\n/**\n * Represent a URL string as described by https://url.spec.whatwg.org/\n */\nscalar url extends string;\n\n/**\n * Represents a collection of optional properties.\n * @template T An object whose spread properties are all optional.\n */\n@doc(\"The template for adding optional properties.\")\n@withOptionalProperties\nmodel OptionalProperties<T> {\n  ...T;\n}\n\n/**\n * Represents a collection of updateable properties.\n * @template T An object whose spread properties are all updateable.\n */\n@doc(\"The template for adding updateable properties.\")\n@withUpdateableProperties\nmodel UpdateableProperties<T> {\n  ...T;\n}\n\n/**\n * Represents a collection of omitted properties.\n * @template T An object whose properties are spread.\n * @template TKeys The property keys to omit.\n */\n@doc(\"The template for omitting properties.\")\n@withoutOmittedProperties(TKeys)\nmodel OmitProperties<T, TKeys extends string> {\n  ...T;\n}\n\n/**\n * Represents a collection of properties with default values omitted.\n * @template T An object whose spread property defaults are all omitted.\n */\n@withoutDefaultValues\nmodel OmitDefaults<T> {\n  ...T;\n}\n\n/**\n * Applies a visibility setting to a collection of properties.\n * @template T An object whose properties are spread.\n * @template Visibility The visibility to apply to all properties.\n */\n@doc(\"The template for setting the default visibility of key properties.\")\n@withDefaultKeyVisibility(Visibility)\nmodel DefaultKeyVisibility<T, Visibility extends valueof string> {\n  ...T;\n}\n",
  "../compiler/lib/decorators.tsp": "import \"../dist/src/lib/decorators.js\";\n\nusing TypeSpec.Reflection;\n\nnamespace TypeSpec;\n\n/**\n * Typically a short, single-line description.\n * @param summary Summary string.\n *\n * @example\n * ```typespec\n * @summary(\"This is a pet\")\n * model Pet {}\n * ```\n */\nextern dec summary(target: unknown, summary: valueof string);\n\n/**\n * Attach a documentation string.\n * @param doc Documentation string\n * @param formatArgs Record with key value pair that can be interpolated in the doc.\n *\n * @example\n * ```typespec\n * @doc(\"Represent a Pet available in the PetStore\")\n * model Pet {}\n * ```\n */\nextern dec doc(target: unknown, doc: valueof string, formatArgs?: {});\n\n/**\n * Attach a documentation string to describe the successful return types of an operation.\n * If an operation returns a union of success and errors it only describe the success. See `@errorsDoc` for error documentation.\n * @param doc Documentation string\n *\n * @example\n * ```typespec\n * @returnsDoc(\"Returns doc\")\n * op get(): Pet | NotFound;\n * ```\n */\nextern dec returnsDoc(target: Operation, doc: valueof string);\n\n/**\n * Attach a documentation string to describe the error return types of an operation.\n * If an operation returns a union of success and errors it only describe the errors. See `@errorsDoc` for success documentation.\n * @param doc Documentation string\n *\n * @example\n * ```typespec\n * @errorsDoc(\"Returns doc\")\n * op get(): Pet | NotFound;\n * ```\n */\nextern dec errorsDoc(target: Operation, doc: valueof string);\n\n/**\n * Mark this type as deprecated.\n *\n * NOTE: This decorator **should not** be used, use the `#deprecated` directive instead.\n *\n * @deprecated Use the `#deprecated` directive instead.\n * @param message Deprecation message.\n *\n * @example\n *\n * Use the `#deprecated` directive instead:\n *\n * ```typespec\n * #deprecated \"Use ActionV2\"\n * op Action<T>(): T;\n * ```\n */\n#deprecated \"@deprecated decorator is deprecated. Use the `#deprecated` directive instead.\"\nextern dec deprecated(target: unknown, message: valueof string);\n\n/**\n * Service options.\n */\nmodel ServiceOptions {\n  /**\n   * Title of the service.\n   */\n  title?: string;\n\n  /**\n   * Version of the service.\n   */\n  version?: string;\n}\n\n/**\n * Mark this namespace as describing a service and configure service properties.\n * @param options Optional configuration for the service.\n *\n * @example\n * ```typespec\n * @service\n * namespace PetStore;\n * ```\n *\n * @example Setting service title\n * ```typespec\n * @service({title: \"Pet store\"})\n * namespace PetStore;\n * ```\n *\n * @example Setting service version\n * ```typespec\n * @service({version: \"1.0\"})\n * namespace PetStore;\n * ```\n */\nextern dec service(target: Namespace, options?: ServiceOptions);\n\n/**\n * Specify that this model is an error type. Operations return error types when the operation has failed.\n *\n * @example\n * ```typespec\n * @error\n * model PetStoreError {\n *   code: string;\n *   message: string;\n * }\n * ```\n */\nextern dec error(target: Model);\n\n/**\n * Specify a known data format hint for this string type. For example `uuid`, `uri`, etc.\n * This differs from the `@pattern` decorator which is meant to specify a regular expression while `@format` accepts a known format name.\n * The format names are open ended and are left to emitter to interpret.\n *\n * @param format format name.\n *\n * @example\n * ```typespec\n * @format(\"uuid\")\n * scalar uuid extends string;\n * ```\n */\nextern dec format(target: string | bytes | ModelProperty, format: valueof string);\n\n/**\n * Specify the the pattern this string should respect using simple regular expression syntax.\n * The following syntax is allowed: alternations (`|`), quantifiers (`?`, `*`, `+`, and `{ }`), wildcard (`.`), and grouping parentheses.\n * Advanced features like look-around, capture groups, and references are not supported.\n *\n * @param pattern Regular expression.\n *\n * @example\n * ```typespec\n * @pattern(\"[a-z]+\")\n * scalar LowerAlpha extends string;\n * ```\n */\nextern dec pattern(target: string | bytes | ModelProperty, pattern: valueof string);\n\n/**\n * Specify the minimum length this string type should be.\n * @param value Minimum length\n *\n * @example\n * ```typespec\n * @minLength(2)\n * scalar Username extends string;\n * ```\n */\nextern dec minLength(target: string | ModelProperty, value: valueof integer);\n\n/**\n * Specify the maximum length this string type should be.\n * @param value Maximum length\n *\n * @example\n * ```typespec\n * @maxLength(20)\n * scalar Username extends string;\n * ```\n */\nextern dec maxLength(target: string | ModelProperty, value: valueof integer);\n\n/**\n * Specify the minimum number of items this array should have.\n * @param value Minimum number\n *\n * @example\n * ```typespec\n * @minItems(1)\n * model Endpoints is string[];\n * ```\n */\nextern dec minItems(target: unknown[] | ModelProperty, value: valueof integer);\n\n/**\n * Specify the maximum number of items this array should have.\n * @param value Maximum number\n *\n * @example\n * ```typespec\n * @maxItems(5)\n * model Endpoints is string[];\n * ```\n */\nextern dec maxItems(target: unknown[] | ModelProperty, value: valueof integer);\n\n/**\n * Specify the minimum value this numeric type should be.\n * @param value Minimum value\n *\n * @example\n * ```typespec\n * @minValue(18)\n * scalar Age is int32;\n * ```\n */\nextern dec minValue(target: numeric | ModelProperty, value: valueof numeric);\n\n/**\n * Specify the maximum value this numeric type should be.\n * @param value Maximum value\n *\n * @example\n * ```typespec\n * @maxValue(200)\n * scalar Age is int32;\n * ```\n */\nextern dec maxValue(target: numeric | ModelProperty, value: valueof numeric);\n\n/**\n * Specify the minimum value this numeric type should be, exclusive of the given\n * value.\n * @param value Minimum value\n *\n * @example\n * ```typespec\n * @minValueExclusive(0)\n * scalar distance is float64;\n * ```\n */\nextern dec minValueExclusive(target: numeric | ModelProperty, value: valueof numeric);\n\n/**\n * Specify the maximum value this numeric type should be, exclusive of the given\n * value.\n * @param value Maximum value\n *\n * @example\n * ```typespec\n * @maxValueExclusive(50)\n * scalar distance is float64;\n * ```\n */\nextern dec maxValueExclusive(target: numeric | ModelProperty, value: valueof numeric);\n\n/**\n * Mark this string as a secret value that should be treated carefully to avoid exposure\n *\n * @example\n * ```typespec\n * @secret\n * scalar Password is string;\n * ```\n */\nextern dec secret(target: string | ModelProperty);\n\n/**\n * Mark this operation as a `list` operation for resource types.\n * @deprecated Use the `listsResource` decorator in `@typespec/rest` instead.\n * @param listedType Optional type of the items in the list.\n */\nextern dec list(target: Operation, listedType?: Model);\n\n/**\n * Attaches a tag to an operation, interface, or namespace. Multiple `@tag` decorators can be specified to attach multiple tags to a TypeSpec element.\n * @param tag Tag value\n */\nextern dec tag(target: Namespace | Interface | Operation, tag: valueof string);\n\n/**\n * Specifies how a templated type should name their instances.\n * @param name name the template instance should take\n * @param formatArgs Model with key value used to interpolate the name\n *\n * @example\n * ```typespec\n * @friendlyName(\"{name}List\", T)\n * model List<T> {\n *   value: T[];\n *   nextLink: string;\n * }\n * ```\n */\nextern dec friendlyName(target: unknown, name: valueof string, formatArgs?: unknown);\n\n/**\n * Provide a set of known values to a string type.\n * @param values Known values enum.\n *\n * @example\n * ```typespec\n * @knownValues(KnownErrorCode)\n * scalar ErrorCode extends string;\n *\n * enum KnownErrorCode {\n *   NotFound,\n *   Invalid,\n * }\n * ```\n */\nextern dec knownValues(target: string | numeric | ModelProperty, values: Enum);\n\n/**\n * Mark a model property as the key to identify instances of that type\n * @param altName Name of the property. If not specified, the decorated property name is used.\n *\n * @example\n * ```typespec\n * model Pet {\n *   @key id: string;\n * }\n * ```\n */\nextern dec key(target: ModelProperty, altName?: valueof string);\n\n/**\n * Specify this operation is an overload of the given operation.\n * @param overloadbase Base operation that should be a union of all overloads\n *\n * @example\n * ```typespec\n * op upload(data: string | bytes, @header contentType: \"text/plain\" | \"application/octet-stream\"): void;\n * @overload(upload)\n * op uploadString(data: string, @header contentType: \"text/plain\" ): void;\n * @overload(upload)\n * op uploadBytes(data: bytes, @header contentType: \"application/octet-stream\"): void;\n * ```\n */\nextern dec overload(target: Operation, overloadbase: Operation);\n\n/**\n * Provide an alternative name for this type.\n * @param targetName Projection target\n * @param projectedName Alternative name\n *\n * @example\n * ```typespec\n * model Certificate {\n *   @projectedName(\"json\", \"exp\")\n *   expireAt: int32;\n * }\n * ```\n */\nextern dec projectedName(\n  target: unknown,\n  targetName: valueof string,\n  projectedName: valueof string\n);\n\n/**\n * Specify the property to be used to discriminate this type.\n * @param propertyName The property name to use for discrimination\n *\n * @example\n *\n * ```typespec\n * @discriminator(\"kind\")\n * union Pet{ cat: Cat, dog: Dog }\n *\n * model Cat {kind: \"cat\", meow: boolean}\n * model Dog {kind: \"dog\", bark: boolean}\n * ```\n *\n * ```typespec\n * @discriminator(\"kind\")\n * model Pet{ kind: string }\n *\n * model Cat extends Pet {kind: \"cat\", meow: boolean}\n * model Dog extends Pet  {kind: \"dog\", bark: boolean}\n * ```\n */\nextern dec discriminator(target: Model | Union, propertyName: valueof string);\n\n/**\n * Known encoding to use on utcDateTime or offsetDateTime\n */\nenum DateTimeKnownEncoding {\n  /**\n   * RFC 3339 standard. https://www.ietf.org/rfc/rfc3339.txt\n   * Encode to string.\n   */\n  rfc3339: \"rfc3339\",\n\n  /**\n   * RFC 7231 standard. https://www.ietf.org/rfc/rfc7231.txt\n   * Encode to string.\n   */\n  rfc7231: \"rfc7231\",\n\n  /**\n   * Encode to integer\n   */\n  unixTimestamp: \"unixTimestamp\",\n}\n\n/**\n * Known encoding to use on duration\n */\nenum DurationKnownEncoding {\n  /**\n   * ISO8601 duration\n   */\n  ISO8601: \"ISO8601\",\n\n  /**\n   * Encode to integer or float\n   */\n  seconds: \"seconds\",\n}\n\n/**\n * Known encoding to use on bytes\n */\nenum BytesKnownEncoding {\n  /**\n   * Encode to Base64\n   */\n  base64: \"base64\",\n\n  /**\n   * Encode to Base64 Url\n   */\n  base64url: \"base64url\",\n}\n\n/**\n * Specify how to encode the target type.\n * @param encoding Known name of an encoding.\n * @param encodedAs What target type is this being encoded as. Default to string.\n *\n * @example offsetDateTime encoded with rfc7231\n *\n * ```tsp\n * @encode(\"rfc7231\")\n * scalar myDateTime extends offsetDateTime;\n * ```\n *\n * @example utcDateTime encoded with unixTimestamp\n *\n * ```tsp\n * @encode(\"unixTimestamp\", int32)\n * scalar myDateTime extends unixTimestamp;\n * ```\n */\nextern dec encode(\n  target: Scalar | ModelProperty,\n  encoding: string | EnumMember,\n  encodedAs?: Scalar\n);\n\n/**\n * Indicates that a property is only considered to be present or applicable (\"visible\") with\n * the in the given named contexts (\"visibilities\"). When a property has no visibilities applied\n * to it, it is implicitly visible always.\n *\n * As far as the TypeSpec core library is concerned, visibilities are open-ended and can be arbitrary\n * strings, but  the following visibilities are well-known to standard libraries and should be used\n * with standard emitters that interpret them as follows:\n *\n * - \"read\": output of any operation.\n * - \"create\": input to operations that create an entity..\n * - \"query\": input to operations that read data.\n * - \"update\": input to operations that update data.\n * - \"delete\": input to operations that delete data.\n *\n * See also: [Automatic visibility](https://microsoft.github.io/typespec/standard-library/http/operations#automatic-visibility)\n *\n * @param visibilities List of visibilities which apply to this property.\n *\n * @example\n *\n * ```typespec\n * model Dog {\n *   // the service will generate an ID, so you don't need to send it.\n *   @visibility(\"read\") id: int32;\n *   // the service will store this secret name, but won't ever return it\n *   @visibility(\"create\", \"update\") secretName: string;\n *   // the regular name is always present\n *   name: string;\n * }\n * ```\n */\nextern dec visibility(target: ModelProperty, ...visibilities: valueof string[]);\n\n/**\n * Removes properties that are not considered to be present or applicable\n * (\"visible\") in the given named contexts (\"visibilities\"). Can be used\n * together with spread to effectively spread only visible properties into\n * a new model.\n *\n * See also: [Automatic visibility](https://microsoft.github.io/typespec/standard-library/http/operations#automatic-visibility)\n *\n * When using an emitter that applies visibility automatically, it is generally\n * not necessary to use this decorator.\n *\n * @param visibilities List of visibilities which apply to this property.\n *\n * @example\n * ```typespec\n * model Dog {\n *   @visibility(\"read\") id: int32;\n *   @visibility(\"create\", \"update\") secretName: string;\n *   name: string;\n * }\n *\n * // The spread operator will copy all the properties of Dog into DogRead,\n * // and @withVisibility will then remove those that are not visible with\n * // create or update visibility.\n * //\n * // In this case, the id property is removed, and the name and secretName\n * // properties are kept.\n * @withVisibility(\"create\", \"update\")\n * model DogCreateOrUpdate {\n *   ...Dog;\n * }\n *\n * // In this case the id and name properties are kept and the secretName property\n * // is removed.\n * @withVisibility(\"read\")\n * model DogRead {\n *   ...Dog;\n * }\n * ```\n */\nextern dec withVisibility(target: Model, ...visibilities: valueof string[]);\n\n/**\n * Set the visibility of key properties in a model if not already set.\n *\n * @param visibility The desired default visibility value. If a key property already has a `visibility` decorator then the default visibility is not applied.\n */\nextern dec withDefaultKeyVisibility(target: Model, visibility: valueof string);\n\n/**\n * Returns the model with non-updateable properties removed.\n */\nextern dec withUpdateableProperties(target: Model);\n\n/**\n * Returns the model with required properties removed.\n */\nextern dec withOptionalProperties(target: Model);\n\n/**\n * Returns the model with any default values removed.\n */\nextern dec withoutDefaultValues(target: Model);\n\n/**\n * Returns the model with the given properties omitted.\n * @param omit List of properties to omit\n */\nextern dec withoutOmittedProperties(target: Model, omit: string | Union);\n\n//---------------------------------------------------------------------------\n// Debugging\n//---------------------------------------------------------------------------\n\n/**\n * A debugging decorator used to inspect a type.\n * @param text Custom text to log\n */\nextern dec inspectType(target: unknown, text: valueof string);\n\n/**\n * A debugging decorator used to inspect a type name.\n * @param text Custom text to log\n */\nextern dec inspectTypeName(target: unknown, text: valueof string);\n\n/**\n * Sets which visibilities apply to parameters for the given operation.\n * @param visibilities List of visibility strings which apply to this operation.\n */\nextern dec parameterVisibility(target: Operation, ...visibilities: valueof string[]);\n\n/**\n * Sets which visibilities apply to the return type for the given operation.\n * @param visibilities List of visibility strings which apply to this operation.\n */\nextern dec returnTypeVisibility(target: Operation, ...visibilities: valueof string[]);\n",
  "../compiler/lib/reflection.tsp": "namespace TypeSpec.Reflection;\n\nmodel Enum {}\nmodel EnumMember {}\nmodel Interface {}\nmodel Model {}\nmodel ModelProperty {}\nmodel Namespace {}\nmodel Operation {}\nmodel Scalar {}\nmodel Union {}\nmodel UnionVariant {}\n",
  "../compiler/lib/projected-names.tsp": "// Set of projections consuming the @projectedName decorator\n#suppress \"projections-are-experimental\"\nprojection op#target {\n  to(targetName) {\n    if hasProjectedName(self, targetName) {\n      self::rename(getProjectedName(self, targetName));\n    };\n  }\n  from(targetName) {\n    if hasProjectedName(self, targetName) {\n      self::rename(self::projectionBase::name);\n    };\n  }\n}\n\n#suppress \"projections-are-experimental\"\nprojection interface#target {\n  to(targetName) {\n    if hasProjectedName(self, targetName) {\n      self::rename(getProjectedName(self, targetName));\n    };\n  }\n  from(targetName) {\n    if hasProjectedName(self, targetName) {\n      self::rename(self::projectionBase::name);\n    };\n  }\n}\n\n#suppress \"projections-are-experimental\"\nprojection model#target {\n  to(targetName) {\n    if hasProjectedName(self, targetName) {\n      self::rename(getProjectedName(self, targetName));\n    };\n\n    self::properties::forEach((p) => {\n      if hasProjectedName(p, targetName) {\n        self::renameProperty(p::name, getProjectedName(p, targetName));\n      };\n    });\n  }\n  from(targetName) {\n    if hasProjectedName(self, targetName) {\n      self::rename(self::projectionBase::name);\n    };\n\n    self::projectionBase::properties::forEach((p) => {\n      if hasProjectedName(p, targetName) {\n        self::renameProperty(getProjectedName(p, targetName), p::name);\n      };\n    });\n  }\n}\n\n#suppress \"projections-are-experimental\"\nprojection enum#target {\n  to(targetName) {\n    if hasProjectedName(self, targetName) {\n      self::rename(getProjectedName(self, targetName));\n    };\n\n    self::members::forEach((p) => {\n      if hasProjectedName(p, targetName) {\n        self::renameMember(p::name, getProjectedName(p, targetName));\n      };\n    });\n  }\n  from(targetName) {\n    if hasProjectedName(self, targetName) {\n      self::rename(self::projectionBase::name);\n    };\n\n    self::projectionBase::members::forEach((p) => {\n      if hasProjectedName(p, targetName) {\n        self::renameMember(getProjectedName(p, targetName), p::name);\n      };\n    });\n  }\n}\n\n#suppress \"projections-are-experimental\"\nprojection union#target {\n  to(targetName) {\n    if hasProjectedName(self, targetName) {\n      self::rename(getProjectedName(self, targetName));\n    };\n  }\n  from(targetName) {\n    if hasProjectedName(self, targetName) {\n      self::rename(self::projectionBase::name);\n    };\n  }\n}\n",
  "lib/main.tsp": "import \"../dist/src/index.js\";\nimport \"./decorators.tsp\";\n",
  "lib/decorators.tsp": "using TypeSpec.Reflection;\n\nnamespace TypeSpec.OpenAPI;\n\n/**\n * Specify the OpenAPI `operationId` property for this operation.\n *\n * @param operationId Operation id value.\n *\n * @example\n *\n * ```typespec\n * @operationId(\"download\")\n * op read(): string;\n * ```\n */\nextern dec operationId(target: Operation, operationId: valueof string);\n\n/**\n * Attach some custom data to the OpenAPI element generated from this type.\n *\n * @param key Extension key. Must start with `x-`\n * @param value Extension value.\n *\n * @example\n *\n * ```typespec\n * @extension(\"x-custom\", \"My value\")\n * @extension(\"x-pageable\", {nextLink: \"x-next-link\"})\n * op read(): string;\n * ```\n */\nextern dec extension(target: unknown, key: valueof string, value: unknown);\n\n/**\n * Specify that this model is to be treated as the OpenAPI `default` response.\n * This differs from the compiler built-in `@error` decorator as this does not necessarily represent an error.\n *\n * @example\n *\n * ```typespec\n * @defaultResponse\n * model PetStoreResponse is object;\n *\n * op listPets(): Pet[] | PetStoreResponse;\n * ```\n */\nextern dec defaultResponse(target: Model);\n\n/**\n * Specify the OpenAPI `externalDocs` property for this type.\n *\n * @param url Url to the docs\n * @param description Description of the docs\n *\n * @example\n * ```typespec\n * @externalDocs(\"https://example.com/detailed.md\", \"Detailed information on how to use this operation\")\n * op listPets(): Pet[];\n * ```\n */\nextern dec externalDocs(target: unknown, url: valueof string, description?: valueof string);\n\n/** Additional information for the OpenAPI document. */\nmodel AdditionalInfo {\n  /** A URL to the Terms of Service for the API. MUST be in the format of a URL. */\n  termsOfService?: url;\n\n  /** The contact information for the exposed API. */\n  contact?: Contact;\n\n  /** The license information for the exposed API. */\n  license?: License;\n}\n\n/** Contact information for the exposed API. */\nmodel Contact {\n  /** The identifying name of the contact person/organization. */\n  name?: string;\n\n  /** The URL pointing to the contact information. MUST be in the format of a URL. */\n  url?: url;\n\n  /** The email address of the contact person/organization. MUST be in the format of an email address. */\n  email?: string;\n}\n\n/** License information for the exposed API. */\nmodel License {\n  /** The license name used for the API. */\n  name: string;\n\n  /** A URL to the license used for the API. MUST be in the format of a URL. */\n  url?: url;\n}\n\n/**\n * Specify OpenAPI additional information.\n * The service `title` and `version` are already specified using `@service`.\n * @param additionalInfo Additional information\n */\nextern dec info(target: Namespace, additionalInfo: AdditionalInfo);\n"
};
const _TypeSpecLibrary_ = {
  jsSourceFiles: TypeSpecJSSources,
  typespecSourceFiles: TypeSpecSources,
};

export { $defaultResponse, $extension, $externalDocs, $info, $operationId, _TypeSpecLibrary_, checkDuplicateTypeName, getExtensions, getExternalDocs, getInfo, getOpenAPITypeName, getOperationId, getParameterKey, isDefaultResponse, isReadonlyProperty, namespace, resolveOperationId, setExtension, shouldInline };
