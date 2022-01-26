"use strict";
exports.__esModule = true;
exports.getExtensions = exports.$extension = exports.getRef = exports.$useRef = exports.getPageable = exports.$pageable = exports.getOperationId = exports.$operationId = void 0;
var lib_js_1 = require("./lib.js");
var operationIdsKey = Symbol();
function $operationId(program, entity, opId) {
    if (entity.kind !== "Operation") {
        (0, lib_js_1.reportDiagnostic)(program, {
            code: "decorator-wrong-type",
            format: { decorator: "operationId", entityKind: entity.kind },
            target: entity
        });
        return;
    }
    program.stateMap(operationIdsKey).set(entity, opId);
}
exports.$operationId = $operationId;
function getOperationId(program, entity) {
    return program.stateMap(operationIdsKey).get(entity);
}
exports.getOperationId = getOperationId;
var pageableOperationsKey = Symbol();
function $pageable(program, entity, nextLinkName) {
    if (nextLinkName === void 0) { nextLinkName = "nextLink"; }
    if (entity.kind !== "Operation") {
        (0, lib_js_1.reportDiagnostic)(program, {
            code: "decorator-wrong-type",
            format: { decorator: "pageable", entityKind: entity.kind },
            target: entity
        });
        return;
    }
    program.stateMap(pageableOperationsKey).set(entity, nextLinkName);
}
exports.$pageable = $pageable;
function getPageable(program, entity) {
    return program.stateMap(pageableOperationsKey).get(entity);
}
exports.getPageable = getPageable;
var refTargetsKey = Symbol();
function $useRef(program, entity, refUrl) {
    if (entity.kind === "Model" || entity.kind === "ModelProperty") {
        program.stateMap(refTargetsKey).set(entity, refUrl);
    }
    else {
        (0, lib_js_1.reportDiagnostic)(program, {
            code: "decorator-wrong-type",
            messageId: "modelsOperations",
            format: { decoratorName: "useRef" },
            target: entity
        });
    }
}
exports.$useRef = $useRef;
function getRef(program, entity) {
    return program.stateMap(refTargetsKey).get(entity);
}
exports.getRef = getRef;
var openApiExtensions = new Map();
function $extension(program, entity, extensionName, value) {
    var _a;
    var typeExtensions = (_a = openApiExtensions.get(entity)) !== null && _a !== void 0 ? _a : new Map();
    typeExtensions.set(extensionName, value);
    openApiExtensions.set(entity, typeExtensions);
}
exports.$extension = $extension;
function getExtensions(entity) {
    var _a;
    return (_a = openApiExtensions.get(entity)) !== null && _a !== void 0 ? _a : new Map();
}
exports.getExtensions = getExtensions;
