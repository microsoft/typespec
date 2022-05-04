import { paramMessage, createCadlLibrary, setDecoratorNamespace, validateDecoratorTarget, validateDecoratorParamType, validateDecoratorParamCount, isKey, isErrorType, getKeyName, isErrorModel, isIntrinsic, getIntrinsicModelName, isVoidType, getDoc, $list, getServiceNamespace } from '@cadl-lang/compiler';

const libDefinition = {
    name: "@cadl-lang/rest",
    diagnostics: {
        "produces-namespace-only": {
            severity: "error",
            messages: {
                default: "The @produces decorator can only be applied to namespaces.",
            },
        },
        "consumes-namespace-only": {
            severity: "error",
            messages: {
                default: "The @consumes decorator can only be applied to namespaces.",
            },
        },
        "http-verb-duplicate": {
            severity: "error",
            messages: {
                default: paramMessage `HTTP verb already applied to ${"entityName"}`,
            },
        },
        "http-verb-wrong-type": {
            severity: "error",
            messages: {
                default: paramMessage `Cannot use @${"verb"} on a ${"entityKind"}`,
            },
        },
        "http-verb-missing-with-body": {
            severity: "error",
            messages: {
                default: paramMessage `Operation ${"operationName"} has a body but doesn't specify a verb.`,
            },
        },
        "operation-resource-wrong-type": {
            severity: "error",
            messages: {
                default: paramMessage `Cannot register resource operation "${"operation"}" on a ${"kind"}`,
            },
        },
        "not-key-type": {
            severity: "error",
            messages: {
                default: "Cannot copy keys from a non-key type (KeysOf<T> or ParentKeysOf<T>)",
            },
        },
        "resource-missing-key": {
            severity: "error",
            messages: {
                default: paramMessage `Type '${"modelName"}' is used as a resource and therefore must have a key. Use @key to designate a property as the key.`,
            },
        },
        "resource-missing-error": {
            severity: "error",
            messages: {
                default: paramMessage `Type '${"modelName"}' is used as an error and therefore must have the @error decorator applied.`,
            },
        },
        "duplicate-key": {
            severity: "error",
            messages: {
                default: paramMessage `More than one key found on model type ${"resourceName"}`,
            },
        },
        "duplicate-parent-key": {
            severity: "error",
            messages: {
                default: paramMessage `Resource type '${"resourceName"}' has a key property named '${"keyName"}' which is already used by parent type '${"parentName"}'.`,
            },
        },
        "missing-path-param": {
            severity: "error",
            messages: {
                default: paramMessage `Path contains parameter ${"param"} but wasn't found in given parameters`,
            },
        },
        "duplicate-body": {
            severity: "error",
            messages: {
                default: "Operation has multiple @body parameters declared",
                duplicateUnannotated: "Operation has multiple unannotated parameters. There can only be one representing the body",
                bodyAndUnannotated: "Operation has a @body and an unannotated parameter. There can only be one representing the body",
            },
        },
        "duplicate-route-decorator": {
            severity: "error",
            messages: {
                operation: "@route was defined twice on this operation.",
                interface: "@route was defined twice on this interface.",
                namespace: "@route was defined twice on this namespace and has different values.",
            },
        },
        "operation-param-duplicate-type": {
            severity: "error",
            messages: {
                default: paramMessage `Param ${"paramName"} has multiple types: [${"types"}]`,
            },
        },
        "duplicate-operation": {
            severity: "error",
            messages: {
                default: paramMessage `Duplicate operation "${"operationName"}" routed at "${"verb"} ${"path"}".`,
            },
        },
        "status-code-invalid": {
            severity: "error",
            messages: {
                default: "statusCode value must be a numeric or string literal or union of numeric or string literals",
                value: "statusCode value must be a three digit code between 100 and 599",
            },
        },
        "content-type-string": {
            severity: "error",
            messages: {
                default: "contentType parameter must be a string literal or union of string literals",
            },
        },
        "duplicate-response": {
            severity: "error",
            messages: {
                default: paramMessage `Multiple return types for content type ${"contentType"} and status code ${"statusCode"}`,
            },
        },
        "content-type-ignored": {
            severity: "warning",
            messages: {
                default: "content-type header ignored because return type has no body",
            },
        },
    },
};
const restLib = createCadlLibrary(libDefinition);
const reportDiagnostic = restLib.reportDiagnostic;

var f0 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    restLib: restLib,
    reportDiagnostic: reportDiagnostic
});

const headerFieldsKey = Symbol("headerFields");
function $header({ program }, entity, headerName) {
    if (!validateDecoratorTarget(program, entity, "@header", "ModelProperty")) {
        return;
    }
    if (headerName && !validateDecoratorParamType(program, entity, headerName, "String")) {
        return;
    }
    if (!headerName) {
        headerName = entity.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    }
    program.stateMap(headerFieldsKey).set(entity, headerName);
}
function getHeaderFieldName(program, entity) {
    return program.stateMap(headerFieldsKey).get(entity);
}
function isHeader(program, entity) {
    return program.stateMap(headerFieldsKey).has(entity);
}
const queryFieldsKey = Symbol("queryFields");
function $query({ program }, entity, queryKey) {
    if (!validateDecoratorTarget(program, entity, "@query", "ModelProperty")) {
        return;
    }
    if (queryKey && !validateDecoratorParamType(program, entity, queryKey, "String")) {
        return;
    }
    if (!queryKey && entity.kind === "ModelProperty") {
        queryKey = entity.name;
    }
    program.stateMap(queryFieldsKey).set(entity, queryKey);
}
function getQueryParamName(program, entity) {
    return program.stateMap(queryFieldsKey).get(entity);
}
function isQueryParam(program, entity) {
    return program.stateMap(queryFieldsKey).has(entity);
}
const pathFieldsKey = Symbol("pathFields");
function $path({ program }, entity, paramName) {
    if (!validateDecoratorTarget(program, entity, "@path", "ModelProperty")) {
        return;
    }
    if (paramName && !validateDecoratorParamType(program, entity, paramName, "String")) {
        return;
    }
    if (!paramName && entity.kind === "ModelProperty") {
        paramName = entity.name;
    }
    program.stateMap(pathFieldsKey).set(entity, paramName);
}
function getPathParamName(program, entity) {
    return program.stateMap(pathFieldsKey).get(entity);
}
function isPathParam(program, entity) {
    return program.stateMap(pathFieldsKey).has(entity);
}
const bodyFieldsKey = Symbol("bodyFields");
function $body({ program }, entity) {
    if (!validateDecoratorTarget(program, entity, "@body", "ModelProperty")) {
        return;
    }
    program.stateSet(bodyFieldsKey).add(entity);
}
function isBody(program, entity) {
    return program.stateSet(bodyFieldsKey).has(entity);
}
const statusCodeKey = Symbol("statusCode");
function $statusCode({ program }, entity) {
    if (!validateDecoratorTarget(program, entity, "@statusCode", "ModelProperty")) {
        return;
    }
    program.stateSet(statusCodeKey).add(entity);
    const codes = [];
    if (entity.type.kind === "String") {
        if (validStatusCode(program, entity.type.value, entity)) {
            codes.push(entity.type.value);
        }
    }
    else if (entity.type.kind === "Number") {
        if (validStatusCode(program, String(entity.type.value), entity)) {
            codes.push(String(entity.type.value));
        }
    }
    else if (entity.type.kind === "Union") {
        for (const option of entity.type.options) {
            if (option.kind === "String") {
                if (validStatusCode(program, option.value, option)) {
                    codes.push(option.value);
                }
            }
            else if (option.kind === "Number") {
                if (validStatusCode(program, String(option.value), option)) {
                    codes.push(String(option.value));
                }
            }
            else {
                reportDiagnostic(program, { code: "status-code-invalid", target: entity });
            }
        }
    }
    else if (entity.type.kind === "TemplateParameter") ;
    else {
        reportDiagnostic(program, { code: "status-code-invalid", target: entity });
    }
    setStatusCode(program, entity, codes);
}
function setStatusCode(program, entity, codes) {
    program.stateMap(statusCodeKey).set(entity, codes);
}
// Check status code value: 3 digits with first digit in [1-5]
// Issue a diagnostic if not valid
function validStatusCode(program, code, entity) {
    const statusCodePatten = /[1-5][0-9][0-9]/;
    if (code.match(statusCodePatten)) {
        return true;
    }
    reportDiagnostic(program, {
        code: "status-code-invalid",
        target: entity,
        messageId: "value",
    });
    return false;
}
function isStatusCode(program, entity) {
    return program.stateMap(statusCodeKey).has(entity);
}
function getStatusCodes(program, entity) {
    var _a;
    return (_a = program.stateMap(statusCodeKey).get(entity)) !== null && _a !== void 0 ? _a : [];
}
// Note: these descriptions come from https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
function getStatusCodeDescription(statusCode) {
    switch (statusCode) {
        case "200":
            return "Ok";
        case "201":
            return "Created";
        case "202":
            return "Accepted";
        case "204":
            return "No Content";
        case "301":
            return "Moved Permanently";
        case "304":
            return "Not Modified";
        case "400":
            return "Bad Request";
        case "401":
            return "Unauthorized";
        case "403":
            return "Forbidden";
        case "404":
            return "Not Found";
        case "409":
            return "Conflict";
        case "412":
            return "Precondition Failed";
        case "503":
            return "Service Unavailable";
    }
    switch (statusCode.charAt(0)) {
        case "1":
            return "Informational";
        case "2":
            return "Successful";
        case "3":
            return "Redirection";
        case "4":
            return "Client Error";
        case "5":
            return "Server Error";
    }
    // Any valid HTTP status code is covered above.
    return undefined;
}
const operationVerbsKey = Symbol("operationVerbs");
function setOperationVerb(program, entity, verb) {
    if (entity.kind === "Operation") {
        if (!program.stateMap(operationVerbsKey).has(entity)) {
            program.stateMap(operationVerbsKey).set(entity, verb);
        }
        else {
            reportDiagnostic(program, {
                code: "http-verb-duplicate",
                format: { entityName: entity.name },
                target: entity,
            });
        }
    }
    else {
        reportDiagnostic(program, {
            code: "http-verb-wrong-type",
            format: { verb, entityKind: entity.kind },
            target: entity,
        });
    }
}
function getOperationVerb(program, entity) {
    return program.stateMap(operationVerbsKey).get(entity);
}
function $get({ program }, entity, ...args) {
    validateVerbNoArgs(program, entity, args);
    setOperationVerb(program, entity, "get");
}
function $put({ program }, entity, ...args) {
    validateVerbNoArgs(program, entity, args);
    setOperationVerb(program, entity, "put");
}
function $post({ program }, entity, ...args) {
    validateVerbNoArgs(program, entity, args);
    setOperationVerb(program, entity, "post");
}
function $patch({ program }, entity, ...args) {
    validateVerbNoArgs(program, entity, args);
    setOperationVerb(program, entity, "patch");
}
function $delete({ program }, entity, ...args) {
    validateVerbNoArgs(program, entity, args);
    setOperationVerb(program, entity, "delete");
}
function $head({ program }, entity, ...args) {
    validateVerbNoArgs(program, entity, args);
    setOperationVerb(program, entity, "head");
}
// TODO: replace with built-in decorator validation https://github.com/Azure/cadl-azure/issues/1022
function validateVerbNoArgs(program, target, args) {
    validateDecoratorParamCount(program, target, args, 0);
}
setDecoratorNamespace("Cadl.Http", $get, $put, $post, $delete, $patch, $header, $query, $path, $body, $statusCode);
function $plainData({ program }, entity) {
    if (!validateDecoratorTarget(program, entity, "@plainData", "Model")) {
        return;
    }
    const decoratorsToRemove = ["$header", "$body", "$query", "$path", "$statusCode"];
    const [headers, bodies, queries, paths, statusCodes] = [
        program.stateMap(headerFieldsKey),
        program.stateSet(bodyFieldsKey),
        program.stateMap(queryFieldsKey),
        program.stateMap(pathFieldsKey),
        program.stateMap(statusCodeKey),
    ];
    for (const property of entity.properties.values()) {
        // Remove the decorators so that they do not run in the future, for example,
        // if this model is later spread into another.
        property.decorators = property.decorators.filter((d) => !decoratorsToRemove.includes(d.decorator.name));
        // Remove the impact the decorators already had on this model.
        headers.delete(property);
        bodies.delete(property);
        queries.delete(property);
        paths.delete(property);
        statusCodes.delete(property);
    }
}
setDecoratorNamespace("Cadl.Http.Private", $plainData);

var f1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $header: $header,
    getHeaderFieldName: getHeaderFieldName,
    isHeader: isHeader,
    $query: $query,
    getQueryParamName: getQueryParamName,
    isQueryParam: isQueryParam,
    $path: $path,
    getPathParamName: getPathParamName,
    isPathParam: isPathParam,
    $body: $body,
    isBody: isBody,
    $statusCode: $statusCode,
    setStatusCode: setStatusCode,
    isStatusCode: isStatusCode,
    getStatusCodes: getStatusCodes,
    getStatusCodeDescription: getStatusCodeDescription,
    getOperationVerb: getOperationVerb,
    $get: $get,
    $put: $put,
    $post: $post,
    $patch: $patch,
    $delete: $delete,
    $head: $head,
    $plainData: $plainData
});

const resourceKeysKey = Symbol("resourceKeys");
const resourceTypeForKeyParamKey = Symbol("resourceTypeForKeyParam");
function setResourceTypeKey(program, resourceType, keyProperty) {
    program.stateMap(resourceKeysKey).set(resourceType, {
        resourceType,
        keyProperty,
    });
}
function getResourceTypeKey(program, resourceType) {
    // Look up the key first
    let resourceKey = program.stateMap(resourceKeysKey).get(resourceType);
    if (resourceKey) {
        return resourceKey;
    }
    // Try to find it in the resource type
    resourceType.properties.forEach((p) => {
        if (isKey(program, p)) {
            if (resourceKey) {
                reportDiagnostic(program, {
                    code: "duplicate-key",
                    format: {
                        resourceName: resourceType.name,
                    },
                    target: p,
                });
            }
            else {
                resourceKey = {
                    resourceType,
                    keyProperty: p,
                };
                // Cache the key for future queries
                setResourceTypeKey(program, resourceType, resourceKey.keyProperty);
            }
        }
    });
    return resourceKey;
}
function $resourceTypeForKeyParam({ program }, entity, resourceType) {
    if (!validateDecoratorTarget(program, entity, "@resourceTypeForKeyParam", "ModelProperty")) {
        return;
    }
    program.stateMap(resourceTypeForKeyParamKey).set(entity, resourceType);
}
function getResourceTypeForKeyParam(program, param) {
    return program.stateMap(resourceTypeForKeyParamKey).get(param);
}
function cloneKeyProperties(context, target, resourceType) {
    const { program } = context;
    // Add parent keys first
    const parentType = getParentResource(program, resourceType);
    if (parentType) {
        cloneKeyProperties(context, target, parentType);
    }
    const resourceKey = getResourceTypeKey(program, resourceType);
    if (resourceKey) {
        const { keyProperty } = resourceKey;
        const keyName = getKeyName(program, keyProperty);
        const newProp = program.checker.cloneType(keyProperty);
        newProp.name = keyName;
        newProp.decorators.push({
            decorator: $path,
            args: [],
        }, {
            decorator: $resourceTypeForKeyParam,
            args: [resourceType],
        });
        $path(context, newProp, undefined);
        target.properties.set(keyName, newProp);
    }
}
function $copyResourceKeyParameters(context, entity, filter) {
    if (!validateDecoratorTarget(context.program, entity, "@copyResourceKeyParameters", "Model")) {
        return;
    }
    const reportNoKeyError = () => reportDiagnostic(context.program, {
        code: "not-key-type",
        target: entity,
    });
    const templateArguments = entity.templateArguments;
    if (!templateArguments || templateArguments.length !== 1) {
        return reportNoKeyError();
    }
    if (templateArguments[0].kind !== "Model") {
        if (isErrorType(templateArguments[0])) {
            return;
        }
        return reportNoKeyError();
    }
    const resourceType = templateArguments[0];
    if (filter === "parent") {
        // Only copy keys of the parent type if there is one
        const parentType = getParentResource(context.program, resourceType);
        if (parentType) {
            cloneKeyProperties(context, entity, parentType);
        }
    }
    else {
        // Copy keys of the resource type and all parents
        cloneKeyProperties(context, entity, resourceType);
    }
}
const parentResourceTypesKey = Symbol("parentResourceTypes");
function getParentResource(program, resourceType) {
    return program.stateMap(parentResourceTypesKey).get(resourceType);
}
function $parentResource({ program }, entity, parentType) {
    if (!validateDecoratorTarget(program, parentType, "@parentResource", "Model")) {
        return;
    }
    program.stateMap(parentResourceTypesKey).set(entity, parentType);
    // Ensure that the parent resource type(s) don't have key name conflicts
    const keyNameSet = new Set();
    let currentType = entity;
    while (currentType) {
        const resourceKey = getResourceTypeKey(program, currentType);
        const keyName = getKeyName(program, resourceKey.keyProperty);
        if (keyNameSet.has(keyName)) {
            reportDiagnostic(program, {
                code: "duplicate-parent-key",
                format: {
                    resourceName: entity.name,
                    parentName: currentType.name,
                    keyName,
                },
                target: resourceKey.keyProperty,
            });
            return;
        }
        keyNameSet.add(keyName);
        currentType = getParentResource(program, currentType);
    }
}
setDecoratorNamespace("Cadl.Rest", $parentResource, $copyResourceKeyParameters);

var f4 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    setResourceTypeKey: setResourceTypeKey,
    getResourceTypeKey: getResourceTypeKey,
    $resourceTypeForKeyParam: $resourceTypeForKeyParam,
    getResourceTypeForKeyParam: getResourceTypeForKeyParam,
    $copyResourceKeyParameters: $copyResourceKeyParameters,
    getParentResource: getParentResource,
    $parentResource: $parentResource
});

const validatedMissingKey = Symbol("validatedMissing");
// Workaround for the lack of template constraints https://github.com/microsoft/cadl/issues/377
function $validateHasKey(context, target, value) {
    if (!validateDecoratorParamType(context.program, target, value, "Model")) {
        return;
    }
    if (context.program.stateSet(validatedMissingKey).has(value)) {
        return;
    }
    const resourceKey = getResourceTypeKey(context.program, value);
    if (resourceKey === undefined) {
        reportDiagnostic(context.program, {
            code: "resource-missing-key",
            format: { modelName: value.name },
            target: value,
        });
        context.program.stateSet(validatedMissingKey).add(value);
    }
}
const validatedErrorKey = Symbol("validatedError");
// Workaround for the lack of template constraints https://github.com/microsoft/cadl/issues/377
function $validateIsError(context, target, value) {
    if (!validateDecoratorParamType(context.program, target, value, "Model")) {
        return;
    }
    if (context.program.stateSet(validatedErrorKey).has(value)) {
        return;
    }
    const isError = isErrorModel(context.program, value);
    if (!isError) {
        reportDiagnostic(context.program, {
            code: "resource-missing-error",
            format: { modelName: value.name },
            target: value,
        });
        context.program.stateSet(validatedErrorKey).add(value);
    }
}

var f2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $validateHasKey: $validateHasKey,
    $validateIsError: $validateIsError
});

/**
 * Get the responses for a given operation.
 */
function getResponsesForOperation(program, operation) {
    const responseType = operation.returnType;
    const responses = {};
    if (responseType.kind === "Union") {
        for (const option of responseType.options) {
            if (isNullType(program, option)) {
                // TODO how should we treat this? https://github.com/microsoft/cadl/issues/356
                continue;
            }
            processResponseType(program, responses, option);
        }
    }
    else {
        processResponseType(program, responses, responseType);
    }
    return Object.values(responses);
}
function isNullType(program, type) {
    return isIntrinsic(program, type) && getIntrinsicModelName(program, type) === "null";
}
function processResponseType(program, responses, responseModel) {
    var _a;
    // Get explicity defined status codes
    const statusCodes = getResponseStatusCodes(program, responseModel);
    // Get explicitly defined content types
    const contentTypes = getResponseContentTypes(program, responseModel);
    // Get response headers
    const headers = getResponseHeaders(program, responseModel);
    // Get explicitly defined body
    let bodyModel = getResponseBody(program, responseModel);
    // If there is no explicit body, it should be conjured from the return type
    // if it is a primitive type or it contains more than just response metadata
    if (!bodyModel) {
        if (responseModel.kind === "Model") {
            if (isIntrinsic(program, responseModel)) {
                bodyModel = responseModel;
            }
            else {
                const isResponseMetadata = (p) => isHeader(program, p) || isStatusCode(program, p);
                const allProperties = (p) => {
                    return [...p.properties.values(), ...(p.baseModel ? allProperties(p.baseModel) : [])];
                };
                if (allProperties(responseModel).some((p) => !isResponseMetadata(p)) ||
                    responseModel.derivedModels.length > 0) {
                    bodyModel = responseModel;
                }
            }
        }
        else {
            // body is array or possibly something else
            bodyModel = responseModel;
        }
    }
    // If there is no explicit status code, check if it should be 204
    if (statusCodes.length === 0) {
        if (bodyModel === undefined || isVoidType(bodyModel)) {
            bodyModel = undefined;
            statusCodes.push("204");
        }
        else if (isErrorModel(program, responseModel)) {
            statusCodes.push("*");
        }
        else {
            statusCodes.push("200");
        }
    }
    // If there is a body but no explicit content types, use application/json
    if (bodyModel && contentTypes.length === 0) {
        contentTypes.push("application/json");
    }
    // Put them into currentEndpoint.responses
    for (const statusCode of statusCodes) {
        // the first model for this statusCode/content type pair carries the
        // description for the endpoint. This could probably be improved.
        const response = (_a = responses[statusCode]) !== null && _a !== void 0 ? _a : {
            statusCode: statusCode,
            type: responseModel,
            description: getResponseDescription(program, responseModel, statusCode),
            responses: [],
        };
        // check for duplicates
        for (const contentType of contentTypes) {
            if (response.responses.find((x) => { var _a; return (_a = x.body) === null || _a === void 0 ? void 0 : _a.contentTypes.includes(contentType); })) {
                reportDiagnostic(program, {
                    code: "duplicate-response",
                    format: { statusCode: statusCode.toString(), contentType },
                    target: responseModel,
                });
            }
        }
        if (bodyModel !== undefined) {
            response.responses.push({ body: { contentTypes: contentTypes, type: bodyModel }, headers });
        }
        else if (contentTypes.length > 0) {
            reportDiagnostic(program, {
                code: "content-type-ignored",
                target: responseModel,
            });
        }
        else {
            response.responses.push({ headers });
        }
        responses[statusCode] = response;
    }
}
/**
 * Get explicity defined status codes from response Model
 * Return is an array of strings, possibly empty, which indicates no explicitly defined status codes.
 * We do not check for duplicates here -- that will be done by the caller.
 */
function getResponseStatusCodes(program, responseModel) {
    const codes = [];
    if (responseModel.kind === "Model") {
        if (responseModel.baseModel) {
            codes.push(...getResponseStatusCodes(program, responseModel.baseModel));
        }
        codes.push(...getStatusCodes(program, responseModel));
        for (const prop of responseModel.properties.values()) {
            if (isStatusCode(program, prop)) {
                codes.push(...getStatusCodes(program, prop));
            }
        }
    }
    return codes;
}
/**
 * Get explicity defined content-types from response Model
 * Return is an array of strings, possibly empty, which indicates no explicitly defined content-type.
 * We do not check for duplicates here -- that will be done by the caller.
 */
function getResponseContentTypes(program, responseModel) {
    const contentTypes = [];
    if (responseModel.kind === "Model") {
        if (responseModel.baseModel) {
            contentTypes.push(...getResponseContentTypes(program, responseModel.baseModel));
        }
        for (const prop of responseModel.properties.values()) {
            if (isHeader(program, prop) && getHeaderFieldName(program, prop) === "content-type") {
                contentTypes.push(...getContentTypes(program, prop));
            }
        }
    }
    return contentTypes;
}
function getContentTypes(program, param) {
    if (param.type.kind === "String") {
        return [param.type.value];
    }
    else if (param.type.kind === "Union") {
        const contentTypes = [];
        for (const option of param.type.options) {
            if (option.kind === "String") {
                contentTypes.push(option.value);
            }
            else {
                reportDiagnostic(program, {
                    code: "content-type-string",
                    target: param,
                });
                continue;
            }
        }
        return contentTypes;
    }
    reportDiagnostic(program, { code: "content-type-string", target: param });
    return [];
}
/**
 * Get response headers from response Model
 */
function getResponseHeaders(program, responseModel) {
    if (responseModel.kind === "Model") {
        const responseHeaders = responseModel.baseModel
            ? getResponseHeaders(program, responseModel.baseModel)
            : {};
        for (const prop of responseModel.properties.values()) {
            const headerName = getHeaderFieldName(program, prop);
            if (isHeader(program, prop) && headerName !== "content-type") {
                responseHeaders[headerName] = prop;
            }
        }
        return responseHeaders;
    }
    return {};
}
function getResponseBody(program, responseModel) {
    if (responseModel.kind === "Model") {
        const getAllBodyProps = (m) => {
            const bodyProps = [...m.properties.values()].filter((t) => isBody(program, t));
            if (m.baseModel) {
                bodyProps.push(...getAllBodyProps(m.baseModel));
            }
            return bodyProps;
        };
        const bodyProps = getAllBodyProps(responseModel);
        if (bodyProps.length > 0) {
            // Report all but first body as duplicate
            for (const prop of bodyProps.slice(1)) {
                reportDiagnostic(program, { code: "duplicate-body", target: prop });
            }
            return bodyProps[0].type;
        }
    }
    return undefined;
}
function getResponseDescription(program, responseModel, statusCode) {
    const desc = getDoc(program, responseModel);
    if (desc) {
        return desc;
    }
    return getStatusCodeDescription(statusCode);
}

var f5 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getResponsesForOperation: getResponsesForOperation,
    getContentTypes: getContentTypes
});

const producesTypesKey = Symbol("producesTypes");
function $produces({ program }, entity, ...contentTypes) {
    if (entity.kind !== "Namespace") {
        reportDiagnostic(program, { code: "produces-namespace-only", target: entity });
    }
    const values = getProduces(program, entity);
    program.stateMap(producesTypesKey).set(entity, values.concat(contentTypes));
}
function getProduces(program, entity) {
    return program.stateMap(producesTypesKey).get(entity) || [];
}
const consumesTypesKey = Symbol("consumesTypes");
function $consumes({ program }, entity, ...contentTypes) {
    if (entity.kind !== "Namespace") {
        reportDiagnostic(program, { code: "consumes-namespace-only", target: entity });
    }
    const values = getConsumes(program, entity);
    program.stateMap(consumesTypesKey).set(entity, values.concat(contentTypes));
}
function getConsumes(program, entity) {
    return program.stateMap(consumesTypesKey).get(entity) || [];
}
const discriminatorKey = Symbol("discriminator");
function $discriminator({ program }, entity, propertyName) {
    if (!validateDecoratorTarget(program, entity, "@discriminator", "Model")) {
        return;
    }
    program.stateMap(discriminatorKey).set(entity, propertyName);
}
function getDiscriminator(program, entity) {
    const propertyName = program.stateMap(discriminatorKey).get(entity);
    if (propertyName) {
        return { propertyName };
    }
    return undefined;
}
const segmentsKey = Symbol("segments");
function $segment({ program }, entity, name) {
    if (!validateDecoratorTarget(program, entity, "@segment", ["Model", "ModelProperty", "Operation"])) {
        return;
    }
    program.stateMap(segmentsKey).set(entity, name);
}
function $segmentOf(context, entity, resourceType) {
    if (resourceType.kind === "TemplateParameter") {
        // Skip it, this operation is in a templated interface
        return;
    }
    if (!validateDecoratorTarget(context.program, resourceType, "@segmentOf", "Model")) {
        return;
    }
    // Add path segment for resource type key (if it has one)
    const resourceKey = getResourceTypeKey(context.program, resourceType);
    if (resourceKey) {
        const keySegment = getSegment(context.program, resourceKey.keyProperty);
        if (keySegment) {
            $segment(context, entity, keySegment);
        }
    }
    else {
        // Does the model itself have a segment attached?
        const modelSegment = getSegment(context.program, resourceType);
        if (modelSegment) {
            $segment(context, entity, modelSegment);
        }
    }
}
function getSegment(program, entity) {
    return program.stateMap(segmentsKey).get(entity);
}
const resourceOperationsKey = Symbol("resourceOperations");
function setResourceOperation(program, entity, resourceType, operation) {
    if (resourceType.kind !== "Model" && resourceType.kind !== "TemplateParameter") {
        reportDiagnostic(program, {
            code: "operation-resource-wrong-type",
            format: { operation, kind: resourceType.kind },
            target: entity,
        });
        return;
    }
    // Only register operations when applied to real model types
    if (resourceType.kind === "Model") {
        program.stateMap(resourceOperationsKey).set(entity, {
            operation,
            resourceType,
        });
    }
}
function getResourceOperation(program, cadlOperation) {
    return program.stateMap(resourceOperationsKey).get(cadlOperation);
}
function $readsResource({ program }, entity, resourceType) {
    setResourceOperation(program, entity, resourceType, "read");
}
function $createsResource(context, entity, resourceType) {
    // Add path segment for resource type key
    $segmentOf(context, entity, resourceType);
    setResourceOperation(context.program, entity, resourceType, "create");
}
function $createsOrUpdatesResource({ program }, entity, resourceType) {
    setResourceOperation(program, entity, resourceType, "createOrUpdate");
}
function $updatesResource({ program }, entity, resourceType) {
    setResourceOperation(program, entity, resourceType, "update");
}
function $deletesResource({ program }, entity, resourceType) {
    setResourceOperation(program, entity, resourceType, "delete");
}
function $listsResource(context, entity, resourceType) {
    // Add the @list decorator too so that collection routes are generated correctly
    $list(context, entity, resourceType);
    // Add path segment for resource type key
    $segmentOf(context, entity, resourceType);
    setResourceOperation(context.program, entity, resourceType, "list");
}
function lowerCaseFirstChar(str) {
    return str[0].toLocaleLowerCase() + str.substring(1);
}
const actionsKey = Symbol("actions");
function $action(context, entity, name) {
    if (!validateDecoratorTarget(context.program, entity, "@action", "Operation")) {
        return;
    }
    // Generate the action name and add it as an operation path segment
    const action = lowerCaseFirstChar(name || entity.name);
    $segment(context, entity, action);
    context.program.stateMap(actionsKey).set(entity, action);
}
function getAction(program, operation) {
    return program.stateMap(actionsKey).get(operation);
}
setDecoratorNamespace("Cadl.Rest", $produces, $consumes, $segment, $segmentOf, $readsResource, $createsResource, $createsOrUpdatesResource, $updatesResource, $deletesResource, $listsResource, $action);

var f6 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $produces: $produces,
    getProduces: getProduces,
    $consumes: $consumes,
    getConsumes: getConsumes,
    $discriminator: $discriminator,
    getDiscriminator: getDiscriminator,
    $segment: $segment,
    $segmentOf: $segmentOf,
    getSegment: getSegment,
    setResourceOperation: setResourceOperation,
    getResourceOperation: getResourceOperation,
    $readsResource: $readsResource,
    $createsResource: $createsResource,
    $createsOrUpdatesResource: $createsOrUpdatesResource,
    $updatesResource: $updatesResource,
    $deletesResource: $deletesResource,
    $listsResource: $listsResource,
    $action: $action,
    getAction: getAction
});

function $route({ program }, entity, path) {
    setRoute(program, entity, {
        path,
        isReset: false,
    });
}
function $routeReset({ program }, entity, path) {
    setRoute(program, entity, {
        path,
        isReset: true,
    });
}
const routeOptionsKey = Symbol("routeOptions");
function setRouteOptionsForNamespace(program, namespace, options) {
    program.stateMap(routeOptionsKey).set(namespace, options);
}
function getRouteOptionsForNamespace(program, namespace) {
    return program.stateMap(routeOptionsKey).get(namespace);
}
const routeContainerKey = Symbol("routeContainer");
function addRouteContainer(program, entity) {
    const container = entity.kind === "Operation" ? entity.interface || entity.namespace : entity;
    if (!container) {
        // Somehow the entity doesn't have a container.  This should only happen
        // when a type was created manually and not by the checker.
        throw new Error(`${entity.kind} is not or does not have a container`);
    }
    if (isUninstantiatedTemplateInterface(container)) {
        // Don't register uninstantiated template interfaces
        return;
    }
    program.stateSet(routeContainerKey).add(container);
}
const routesKey = Symbol("routes");
function setRoute(program, entity, details) {
    if (!validateDecoratorTarget(program, entity, "@route", ["Namespace", "Interface", "Operation"])) {
        return;
    }
    // Register the container of the operation as one that holds routed operations
    addRouteContainer(program, entity);
    const state = program.stateMap(routesKey);
    if (state.has(entity)) {
        if (entity.kind === "Operation" || entity.kind === "Interface") {
            reportDiagnostic(program, {
                code: "duplicate-route-decorator",
                messageId: entity.kind === "Operation" ? "operation" : "interface",
                target: entity,
            });
        }
        else {
            const existingValue = state.get(entity);
            if (existingValue.path !== details.path) {
                reportDiagnostic(program, {
                    code: "duplicate-route-decorator",
                    messageId: "namespace",
                    target: entity,
                });
            }
        }
    }
    else {
        state.set(entity, details);
    }
}
function getRoutePath(program, entity) {
    return program.stateMap(routesKey).get(entity);
}
function buildPath(pathFragments) {
    // Join all fragments with leading and trailing slashes trimmed
    const path = pathFragments
        .map((r) => r.replace(/(^\/|\/$)/g, ""))
        .filter((x) => x !== "")
        .join("/");
    return `/${path}`;
}
function addSegmentFragment(program, target, pathFragments) {
    // Don't add the segment prefix if it is meant to be excluded
    // (empty string means exclude the segment)
    const segment = getSegment(program, target);
    if (segment && segment !== "") {
        pathFragments.push(`/${segment}`);
    }
}
function getOperationParameters(program, operation) {
    const result = {
        parameters: [],
    };
    let unAnnotatedParam;
    for (const param of operation.parameters.properties.values()) {
        const queryParam = getQueryParamName(program, param);
        const pathParam = getPathParamName(program, param);
        const headerParam = getHeaderFieldName(program, param);
        const bodyParm = isBody(program, param);
        const defined = [
            ["query", queryParam],
            ["path", pathParam],
            ["header", headerParam],
            ["body", bodyParm],
        ].filter((x) => !!x[1]);
        if (defined.length >= 2) {
            reportDiagnostic(program, {
                code: "operation-param-duplicate-type",
                format: { paramName: param.name, types: defined.map((x) => x[0]).join(", ") },
                target: param,
            });
        }
        if (queryParam) {
            result.parameters.push({ type: "query", name: queryParam, param });
        }
        else if (pathParam) {
            result.parameters.push({ type: "path", name: pathParam, param });
        }
        else if (headerParam) {
            result.parameters.push({ type: "header", name: headerParam, param });
        }
        else if (bodyParm) {
            if (result.body === undefined) {
                result.body = param;
            }
            else {
                reportDiagnostic(program, { code: "duplicate-body", target: param });
            }
        }
        else {
            if (unAnnotatedParam === undefined) {
                unAnnotatedParam = param;
            }
            else {
                reportDiagnostic(program, {
                    code: "duplicate-body",
                    messageId: "duplicateUnannotated",
                    target: param,
                });
            }
        }
    }
    if (unAnnotatedParam !== undefined) {
        if (result.body === undefined) {
            result.body = unAnnotatedParam;
        }
        else {
            reportDiagnostic(program, {
                code: "duplicate-body",
                messageId: "bodyAndUnannotated",
                target: unAnnotatedParam,
            });
        }
    }
    return result;
}
function generatePathFromParameters(program, operation, pathFragments, parameters, options) {
    var _a, _b;
    const filteredParameters = [];
    for (const httpParam of parameters.parameters) {
        const { type, param } = httpParam;
        if (type === "path") {
            addSegmentFragment(program, param, pathFragments);
            const filteredParam = (_b = (_a = options.autoRouteOptions) === null || _a === void 0 ? void 0 : _a.routeParamFilter) === null || _b === void 0 ? void 0 : _b.call(_a, operation, param);
            if (filteredParam === null || filteredParam === void 0 ? void 0 : filteredParam.routeParamString) {
                pathFragments.push(`/${filteredParam.routeParamString}`);
                if ((filteredParam === null || filteredParam === void 0 ? void 0 : filteredParam.excludeFromOperationParams) === true) {
                    // Skip the rest of the loop so that we don't add the parameter to the final list
                    continue;
                }
            }
            else {
                // Add the path variable for the parameter
                if (param.type.kind === "String") {
                    pathFragments.push(`/${param.type.value}`);
                    continue; // Skip adding to the parameter list
                }
                else {
                    pathFragments.push(`/{${param.name}}`);
                }
            }
        }
        // Push all usable parameters to the filtered list
        filteredParameters.push(httpParam);
    }
    // Replace the original parameters with filtered set
    parameters.parameters = filteredParameters;
    // Add the operation's own segment if present
    addSegmentFragment(program, operation, pathFragments);
}
function getPathForOperation(program, operation, routeFragments, options) {
    const parameters = getOperationParameters(program, operation);
    const pathFragments = [...routeFragments];
    const routePath = getRoutePath(program, operation);
    if (isAutoRoute(program, operation)) {
        // The operation exists within an @autoRoute scope, generate the path.  This
        // mutates the pathFragments and parameters lists that are passed in!
        generatePathFromParameters(program, operation, pathFragments, parameters, options);
    }
    else {
        // Prepend any explicit route path
        if (routePath) {
            pathFragments.push(routePath.path);
        }
        // Pull out path parameters to verify what's in the path string
        const paramByName = new Map(parameters.parameters
            .filter(({ type }) => type === "path")
            .map(({ param }) => [param.name, param]));
        // Find path parameter names used in all route fragments
        const declaredPathParams = pathFragments.flatMap((f) => { var _a, _b; return (_b = (_a = f.match(/\{\w+\}/g)) === null || _a === void 0 ? void 0 : _a.map((s) => s.slice(1, -1))) !== null && _b !== void 0 ? _b : []; });
        // For each param in the declared path parameters (e.g. /foo/{id} has one, id),
        // delete it because it doesn't need to be added to the path.
        for (const declaredParam of declaredPathParams) {
            const param = paramByName.get(declaredParam);
            if (!param) {
                reportDiagnostic(program, {
                    code: "missing-path-param",
                    format: { param: declaredParam },
                    target: operation,
                });
                continue;
            }
            paramByName.delete(declaredParam);
        }
        // Add any remaining declared path params
        for (const param of paramByName.keys()) {
            pathFragments.push(`{${param}}`);
        }
    }
    return {
        path: buildPath(pathFragments),
        pathFragment: routePath === null || routePath === void 0 ? void 0 : routePath.path,
        parameters,
    };
}
function getVerbForOperation(program, operation, parameters) {
    var _a, _b;
    const resourceOperation = getResourceOperation(program, operation);
    const verb = (_b = (_a = (resourceOperation && resourceOperationToVerb[resourceOperation.operation])) !== null && _a !== void 0 ? _a : getOperationVerb(program, operation)) !== null && _b !== void 0 ? _b : 
    // TODO: Enable this verb choice to be customized!
    (getAction(program, operation) ? "post" : undefined);
    if (verb !== undefined) {
        return verb;
    }
    if (parameters.body) {
        reportDiagnostic(program, {
            code: "http-verb-missing-with-body",
            format: { operationName: operation.name },
            target: operation,
        });
    }
    return "get";
}
function buildRoutes(program, container, routeFragments, visitedOperations, options) {
    // Get the route info for this container, if any
    const baseRoute = getRoutePath(program, container);
    const parentFragments = [...routeFragments, ...(baseRoute ? [baseRoute.path] : [])];
    // TODO: Allow overriding the existing resource operation of the same kind
    const operations = [];
    for (const [_, op] of container.operations) {
        // Skip previously-visited operations
        if (visitedOperations.has(op)) {
            continue;
        }
        const route = getPathForOperation(program, op, parentFragments, options);
        const verb = getVerbForOperation(program, op, route.parameters);
        const responses = getResponsesForOperation(program, op);
        operations.push({
            path: route.path,
            pathFragment: route.pathFragment,
            verb,
            container,
            groupName: container.name,
            parameters: route.parameters,
            operation: op,
            responses,
        });
    }
    // Build all child routes and append them to the list, but don't recurse in
    // the global scope because that could pull in unwanted operations
    if (container.kind === "Namespace" && container.name !== "") {
        const children = [
            ...container.namespaces.values(),
            ...container.interfaces.values(),
        ];
        const childRoutes = children.flatMap((child) => buildRoutes(program, child, parentFragments, visitedOperations, options));
        for (const child of childRoutes)
            [operations.push(child)];
    }
    return operations;
}
function getRoutesForContainer(program, container, visitedOperations, options) {
    var _a;
    const routeOptions = (_a = options !== null && options !== void 0 ? options : (container.kind === "Namespace" ? getRouteOptionsForNamespace(program, container) : {})) !== null && _a !== void 0 ? _a : {};
    return buildRoutes(program, container, [], visitedOperations, routeOptions);
}
function isUninstantiatedTemplateInterface(maybeInterface) {
    return (maybeInterface.kind === "Interface" &&
        maybeInterface.node.templateParameters &&
        maybeInterface.node.templateParameters.length > 0 &&
        (!maybeInterface.templateArguments || maybeInterface.templateArguments.length === 0));
}
function getAllRoutes(program, options) {
    let operations = [];
    const serviceNamespace = getServiceNamespace(program);
    const containers = [
        ...(serviceNamespace ? [serviceNamespace] : []),
        ...Array.from(program.stateSet(routeContainerKey)),
    ];
    const visitedOperations = new Set();
    for (const container of containers) {
        // Is this container a templated interface that hasn't been instantiated?
        if (isUninstantiatedTemplateInterface(container)) {
            // Skip template interface operations
            continue;
        }
        const newOps = getRoutesForContainer(program, container, visitedOperations, options);
        // Make sure we don't visit the same operations again
        newOps.forEach((o) => visitedOperations.add(o.operation));
        // Accumulate the new operations
        operations = [...operations, ...newOps];
    }
    validateRouteUnique(program, operations);
    return operations;
}
function validateRouteUnique(program, operations) {
    const grouped = new Map();
    for (const operation of operations) {
        const { verb, path } = operation;
        let map = grouped.get(path);
        if (map === undefined) {
            map = new Map();
            grouped.set(path, map);
        }
        let list = map.get(verb);
        if (list === undefined) {
            list = [];
            map.set(verb, list);
        }
        list.push(operation);
    }
    for (const [path, map] of grouped) {
        for (const [verb, routes] of map) {
            if (routes.length >= 2) {
                for (const route of routes) {
                    reportDiagnostic(program, {
                        code: "duplicate-operation",
                        format: { path, verb, operationName: route.operation.name },
                        target: route.operation,
                    });
                }
            }
        }
    }
}
// TODO: Make this overridable by libraries
const resourceOperationToVerb = {
    read: "get",
    create: "post",
    createOrUpdate: "put",
    update: "patch",
    delete: "delete",
    list: "get",
};
const autoRouteKey = Symbol("autoRoute");
function $autoRoute({ program }, entity) {
    if (!validateDecoratorTarget(program, entity, "@autoRoute", ["Namespace", "Interface", "Operation"])) {
        return;
    }
    // Register the container of the operation as one that holds routed operations
    addRouteContainer(program, entity);
    program.stateSet(autoRouteKey).add(entity);
}
function isAutoRoute(program, target) {
    // Loop up through parent scopes (interface, namespace) to see if
    // @autoRoute was used anywhere
    let current = target;
    while (current !== undefined) {
        if (program.stateSet(autoRouteKey).has(current)) {
            return true;
        }
        // Navigate up to the parent scope
        if (current.kind === "Namespace" || current.kind === "Interface") {
            current = current.namespace;
        }
        else if (current.kind === "Operation") {
            current = current.interface || current.namespace;
        }
    }
    return false;
}
setDecoratorNamespace("Cadl.Http", $route, $routeReset, $autoRoute);

var f7 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $route: $route,
    $routeReset: $routeReset,
    setRouteOptionsForNamespace: setRouteOptionsForNamespace,
    getRoutePath: getRoutePath,
    getOperationParameters: getOperationParameters,
    getRoutesForContainer: getRoutesForContainer,
    getAllRoutes: getAllRoutes,
    $autoRoute: $autoRoute,
    isAutoRoute: isAutoRoute
});

var f3 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    http: f1,
    internalDecorators: f2,
    resource: f4,
    rest: f6,
    route: f7,
    setResourceTypeKey: setResourceTypeKey,
    getResourceTypeKey: getResourceTypeKey,
    $resourceTypeForKeyParam: $resourceTypeForKeyParam,
    getResourceTypeForKeyParam: getResourceTypeForKeyParam,
    $copyResourceKeyParameters: $copyResourceKeyParameters,
    getParentResource: getParentResource,
    $parentResource: $parentResource,
    getResponsesForOperation: getResponsesForOperation,
    getContentTypes: getContentTypes,
    $produces: $produces,
    getProduces: getProduces,
    $consumes: $consumes,
    getConsumes: getConsumes,
    $discriminator: $discriminator,
    getDiscriminator: getDiscriminator,
    $segment: $segment,
    $segmentOf: $segmentOf,
    getSegment: getSegment,
    setResourceOperation: setResourceOperation,
    getResourceOperation: getResourceOperation,
    $readsResource: $readsResource,
    $createsResource: $createsResource,
    $createsOrUpdatesResource: $createsOrUpdatesResource,
    $updatesResource: $updatesResource,
    $deletesResource: $deletesResource,
    $listsResource: $listsResource,
    $action: $action,
    getAction: getAction,
    $route: $route,
    $routeReset: $routeReset,
    setRouteOptionsForNamespace: setRouteOptionsForNamespace,
    getRoutePath: getRoutePath,
    getOperationParameters: getOperationParameters,
    getRoutesForContainer: getRoutesForContainer,
    getAllRoutes: getAllRoutes,
    $autoRoute: $autoRoute,
    isAutoRoute: isAutoRoute
});

const CadlJSSources = {
"dist/src/diagnostics.js": f0,
"dist/src/http.js": f1,
"dist/src/internal-decorators.js": f2,
"dist/src/lib.js": f3,
"dist/src/resource.js": f4,
"dist/src/responses.js": f5,
"dist/src/rest.js": f6,
"dist/src/route.js": f7,
};
const CadlSources = {"lib/http.cadl":"import \"../dist/src/http.js\";\n\nnamespace Cadl.Http;\n\nusing Private;\n\n@doc(\"Http response with status code\")\nmodel Response<Status> {\n  @doc(\"The status code.\")\n  @statusCode\n  _: Status;\n}\n\n@doc(\"The request has succeeded.\")\nmodel OkResponse<Body> is Response<200> {\n  @doc(\"The reponse body.\")\n  @body\n  body: Body;\n}\n\n@doc(\"The Location header.\")\nmodel LocationHeader {\n  @doc(\"The Location header contains the URL where the status of the long running operation can be checked.\")\n  @header\n  location: string;\n}\n\n@doc(\"The request has succeeded and a new resource has been created as a result.\")\nmodel CreatedResponse is Response<201> {}\n\n@doc(\"The request has been received but not yet acted upon.\")\nmodel AcceptedResponse is Response<202> {}\n\n@doc(\"There is no content to send for this request, but the headers may be useful. \")\nmodel NoContentResponse is Response<204> {}\n\n@doc(\"The URL of the requested resource has been changed permanently. The new URL is given in the response.\")\nmodel MovedResponse is Response<301> {\n  ...LocationHeader;\n}\n\n@doc(\"This is used for caching purposes.\")\nmodel NotModifiedResponse is Response<304> {}\n\n@doc(\"The server could not understand the request due to invalid syntax.\")\nmodel UnauthorizedResponse is Response<401> {}\n\n@doc(\"The server can not find the requested resource.\")\nmodel NotFoundResponse is Response<404> {}\n\n@doc(\"This response is sent when a request conflicts with the current state of the server.\")\nmodel ConflictResponse is Response<409> {}\n\n// Produces a new model with the same properties as T, but with @query,\n// @header, @body, and @path decorators removed from all properties.\n//\n// ISSUE: Can't use @doc to document this as it leaks into OpenAPI output.\n// We probably need a way to do Cadl-developer-only docs that show in the\n// IDE but do not leak into output. https://github.com/microsoft/cadl/issues/131\n@plainData\nmodel PlainData<T> {\n  ...T;\n}\n","lib/resource.cadl":"import \"./http.cadl\";\nimport \"../dist/src/resource.js\";\nimport \"../dist/src/internal-decorators.js\";\n\nnamespace Cadl.Rest.Resource;\n\nusing Cadl.Http;\n\n@doc(\"The default error response for resource operations.\")\nmodel ResourceError {\n  @doc(\"The error code.\")\n  code: int32;\n\n  @doc(\"The error message.\")\n  message: string;\n}\n\n@doc(\"Dynamically gathers keys of the model type T.\")\n@copyResourceKeyParameters\nmodel KeysOf<T> {}\n\n@doc(\"Dynamically gathers parent keys of the model type T.\")\n@copyResourceKeyParameters(\"parent\")\nmodel ParentKeysOf<T> {}\n\n@doc(\"Represents operation parameters for resource TResource.\")\nmodel ResourceParameters<TResource> {\n  ...KeysOf<TResource>;\n}\n\n@doc(\"Represents collection operation parameters for resource TResource.\")\nmodel ResourceCollectionParameters<TResource> {\n  ...ParentKeysOf<TResource>;\n}\n\n@validateHasKey(TResource)\n@validateIsError(TError)\ninterface ResourceRead<TResource, TError> {\n  @autoRoute\n  @doc(\"Gets an instance of the resource.\")\n  @readsResource(TResource)\n  get(...ResourceParameters<TResource>): TResource | TError;\n}\n\n@doc(\"Resource create operation completed successfully.\")\nmodel ResourceCreatedResponse<T> {\n  ...CreatedResponse;\n  @body body: T;\n}\n\ninterface ResourceCreateOrUpdate<TResource, TError> {\n  @autoRoute\n  @doc(\"Creates or update a instance of the resource.\")\n  @createsOrUpdatesResource(TResource)\n  createOrUpdate(\n    ...ResourceParameters<TResource>,\n    @body resource: TResource\n  ): TResource | ResourceCreatedResponse<TResource> | TError;\n}\n\ninterface ResourceCreate<TResource, TError> {\n  @autoRoute\n  @doc(\"Creates a new instance of the resource.\")\n  @createsResource(TResource)\n  create(\n    ...ResourceCollectionParameters<TResource>,\n    @body resource: TResource\n  ): TResource | ResourceCreatedResponse<TResource> | TError;\n}\n\n@validateHasKey(TResource)\n@validateIsError(TError)\ninterface ResourceUpdate<TResource, TError> {\n  @autoRoute\n  @doc(\"Updates an existing instance of the resource.\")\n  @updatesResource(TResource)\n  update(\n    ...ResourceParameters<TResource>,\n    @body properties: OptionalProperties<UpdateableProperties<TResource>>\n  ): TResource | TError;\n}\n\n@doc(\"Resource deleted successfully.\")\nmodel ResourceDeletedResponse {\n  @doc(\"The status code.\")\n  @statusCode\n  _: 200;\n}\n\n@validateHasKey(TResource)\n@validateIsError(TError)\ninterface ResourceDelete<TResource, TError> {\n  @autoRoute\n  @doc(\"Deletes an existing instance of the resource.\")\n  @deletesResource(TResource)\n  delete(...ResourceParameters<TResource>): ResourceDeletedResponse | TError;\n}\n\n@doc(\"Paged response\")\nmodel Page<T> {\n  @doc(\"The items on this page\")\n  value: T[];\n\n  @doc(\"The link to the next page of items\")\n  nextLink?: string;\n}\n\ninterface ResourceList<TResource, TError> {\n  @autoRoute\n  @doc(\"Lists all instances of the resource.\")\n  @listsResource(TResource)\n  list(...ResourceCollectionParameters<TResource>): Page<TResource> | TError;\n}\n\n@validateHasKey(TResource)\n@validateIsError(TError)\ninterface ResourceInstanceOperations<TResource, TError>\n  mixes ResourceRead<TResource, TError>,\n    ResourceUpdate<TResource, TError>,\n    ResourceDelete<TResource, TError> {}\n\n@validateHasKey(TResource)\n@validateIsError(TError)\ninterface ResourceCollectionOperations<TResource, TError>\n  mixes ResourceCreate<TResource, TError>,\n    ResourceList<TResource, TError> {}\n\n@validateHasKey(TResource)\n@validateIsError(TError)\ninterface ResourceOperations<TResource, TError>\n  mixes ResourceInstanceOperations<TResource, TError>,\n    ResourceCollectionOperations<TResource, TError> {}\n\n@validateHasKey(TResource)\n@validateIsError(TError)\ninterface SingletonResourceRead<TSingleton, TResource, TError> {\n  @autoRoute\n  @doc(\"Gets the singleton resource.\")\n  @segmentOf(TSingleton)\n  @readsResource(TSingleton)\n  Get(...ResourceParameters<TResource>): TSingleton | TError;\n}\n\n@validateHasKey(TResource)\n@validateIsError(TError)\ninterface SingletonResourceUpdate<TSingleton, TResource, TError> {\n  @autoRoute\n  @doc(\"Updates the singleton resource.\")\n  @segmentOf(TSingleton)\n  @updatesResource(TSingleton)\n  Update(\n    ...ResourceParameters<TResource>,\n    @body properties: OptionalProperties<UpdateableProperties<TSingleton>>\n  ): TSingleton | TError;\n}\n\ninterface SingletonResourceOperations<TSingleton, TResource, TError>\n  mixes SingletonResourceRead<TSingleton, TResource, TError>,\n    SingletonResourceUpdate<TSingleton, TResource, TError> {}\n\n@validateHasKey(TResource)\n@validateIsError(TError)\ninterface ExtensionResourceRead<TExtension, TResource, TError> {\n  @autoRoute\n  @doc(\"Gets an instance of the extension resource.\")\n  @readsResource(TExtension)\n  Get(...ResourceParameters<TResource>, ...ResourceParameters<TExtension>): TExtension | TError;\n}\n\ninterface ExtensionResourceCreateOrUpdate<TExtension, TResource, TError> {\n  @autoRoute\n  @doc(\"Creates or update a instance of the extension resource.\")\n  @createsOrUpdatesResource(TExtension)\n  CreateOrUpdate(\n    ...ResourceParameters<TResource>,\n    ...ResourceParameters<TExtension>,\n    @body resource: TExtension\n  ): TExtension | ResourceCreatedResponse<TExtension> | TError;\n}\n\ninterface ExtensionResourceCreate<TExtension, TResource, TError> {\n  @autoRoute\n  @doc(\"Creates a new instance of the extension resource.\")\n  @createsResource(TExtension)\n  Create(\n    ...ResourceParameters<TResource>,\n    @body resource: TResource\n  ): TExtension | ResourceCreatedResponse<TExtension> | TError;\n}\n\ninterface ExtensionResourceUpdate<TExtension, TResource, TError> {\n  @autoRoute\n  @doc(\"Updates an existing instance of the extension resource.\")\n  @updatesResource(TExtension)\n  Update(\n    ...ResourceParameters<TResource>,\n    ...ResourceParameters<TExtension>,\n    @body properties: OptionalProperties<UpdateableProperties<TExtension>>\n  ): TExtension | TError;\n}\n\ninterface ExtensionResourceDelete<TExtension, TResource, TError> {\n  @autoRoute\n  @doc(\"Deletes an existing instance of the extension resource.\")\n  @deletesResource(TExtension)\n  Delete(\n    ...ResourceParameters<TResource>,\n    ...ResourceParameters<TExtension>\n  ): ResourceDeletedResponse | TError;\n}\n\ninterface ExtensionResourceList<TExtension, TResource, TError> {\n  @autoRoute\n  @doc(\"Lists all instances of the extension resource.\")\n  @listsResource(TExtension)\n  List(\n    ...ResourceParameters<TResource>,\n    ...ResourceCollectionParameters<TExtension>\n  ): Page<TExtension> | TError;\n}\n\ninterface ExtensionResourceInstanceOperations<TExtension, TResource, TError>\n  mixes ExtensionResourceRead<TExtension, TResource, TError>,\n    ExtensionResourceUpdate<TExtension, TResource, TError>,\n    ExtensionResourceDelete<TExtension, TResource, TError> {}\n\ninterface ExtensionResourceCollectionOperations<TExtension, TResource, TError>\n  mixes ExtensionResourceCreate<TExtension, TResource, TError>,\n    ExtensionResourceList<TExtension, TResource, TError> {}\n\ninterface ExtensionResourceOperations<TExtension, TResource, TError>\n  mixes ExtensionResourceInstanceOperations<TExtension, TResource, TError>,\n    ExtensionResourceCollectionOperations<TExtension, TResource, TError> {}\n","lib/rest.cadl":"import \"../dist/src/rest.js\";\nimport \"../dist/src/route.js\";\n\nimport \"./http.cadl\";\nimport \"./resource.cadl\";\n"};
const _CadlLibrary_ = {
  jsSourceFiles: CadlJSSources,
  cadlSourceFiles: CadlSources,
};

export { $action, $autoRoute, $consumes, $copyResourceKeyParameters, $createsOrUpdatesResource, $createsResource, $deletesResource, $discriminator, $listsResource, $parentResource, $produces, $readsResource, $resourceTypeForKeyParam, $route, $routeReset, $segment, $segmentOf, $updatesResource, _CadlLibrary_, getAction, getAllRoutes, getConsumes, getContentTypes, getDiscriminator, getOperationParameters, getParentResource, getProduces, getResourceOperation, getResourceTypeForKeyParam, getResourceTypeKey, getResponsesForOperation, getRoutePath, getRoutesForContainer, getSegment, f1 as http, f2 as internalDecorators, isAutoRoute, f4 as resource, f6 as rest, f7 as route, setResourceOperation, setResourceTypeKey, setRouteOptionsForNamespace };
