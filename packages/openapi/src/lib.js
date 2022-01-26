"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
exports.__esModule = true;
exports.reportDiagnostic = exports.libDef = void 0;
var compiler_1 = require("@cadl-lang/compiler");
exports.libDef = {
    name: "@cadl-lang/openapi3",
    diagnostics: {
        "decorator-wrong-type": {
            severity: "error",
            messages: {
                "default": (0, compiler_1.paramMessage)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Cannot use @", " on a ", ""], ["Cannot use @", " on a ", ""])), "decorator", "entityKind"),
                modelsOperations: (0, compiler_1.paramMessage)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " decorator can only be applied to models and operation parameters."], ["", " decorator can only be applied to models and operation parameters."])), "decoratorName")
            }
        },
        "security-service-namespace": {
            severity: "error",
            messages: {
                "default": "Cannot add security details to a namespace other than the service namespace."
            }
        },
        "resource-namespace": {
            severity: "error",
            messages: {
                "default": "Resource goes on namespace"
            }
        },
        "path-query": {
            severity: "error",
            messages: {
                "default": "OpenAPI does not allow paths containing a query string."
            }
        },
        "duplicate-body": {
            severity: "error",
            messages: {
                "default": "Duplicate @body declarations on response type"
            }
        },
        "duplicate-response": {
            severity: "error",
            messages: {
                "default": (0, compiler_1.paramMessage)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Multiple return types for status code ", ""], ["Multiple return types for status code ", ""])), "statusCode")
            }
        },
        "content-type-ignored": {
            severity: "warning",
            messages: {
                "default": "content-type header ignored because return type has no body"
            }
        },
        "content-type-string": {
            severity: "error",
            messages: {
                "default": "contentType parameter must be a string literal or union of string literals"
            }
        },
        "status-code-invalid": {
            severity: "error",
            messages: {
                "default": "status-code header must be a numeric or string literal or union of numeric or string literals",
                value: "status-code value must be a specific code between 100 and 599, or nXX, or default"
            }
        },
        "invalid-schema": {
            severity: "error",
            messages: {
                "default": (0, compiler_1.paramMessage)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Couldn't get schema for type ", ""], ["Couldn't get schema for type ", ""])), "type")
            }
        },
        "union-null": {
            severity: "error",
            messages: {
                "default": "Cannot have a union containing only null types."
            }
        },
        "union-unsupported": {
            severity: "error",
            messages: {
                "default": "Unions are not supported unless all options are literals of the same type.",
                type: (0, compiler_1.paramMessage)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Type \"", "\" cannot be used in unions"], ["Type \"", "\" cannot be used in unions"])), "kind"),
                empty: "Empty unions are not supported for OpenAPI v3 - enums must have at least one value.",
                "null": "Unions containing multiple model types cannot be emitted to OpenAPI v2 unless the union is between one model type and 'null'."
            }
        },
        discriminator: {
            severity: "error",
            messages: {
                duplicate: (0, compiler_1.paramMessage)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Discriminator value \"", "\" defined in two different variants: ", " and ", ""], ["Discriminator value \"", "\" defined in two different variants: ", " and ", ""])), "val", "model1", "model2"),
                missing: "The discriminator property is not defined in a variant of a discriminated union.",
                required: "The discriminator property must be a required property.",
                type: "The discriminator property must be type 'string'."
            }
        },
        "discriminator-value": {
            severity: "warning",
            messages: {
                literal: "Each variant of a discriminated union should define the discriminator property with a string literal value."
            }
        },
        "invalid-default": {
            severity: "error",
            messages: {
                "default": (0, compiler_1.paramMessage)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Invalid type '", "' for a default value"], ["Invalid type '", "' for a default value"])), "type")
            }
        }
    }
};
exports.reportDiagnostic = (0, compiler_1.createCadlLibrary)(exports.libDef).reportDiagnostic;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
