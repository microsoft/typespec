"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTypeSpecVitestConfig = void 0;
exports.default = ["packages/*/vite.config.[m]ts"];
/**
 * Default Config For all typespec projects using vitest.
 */
exports.defaultTypeSpecVitestConfig = {
    test: {
        environment: "node",
        isolate: false,
        coverage: {
            reporter: ["cobertura", "json", "text"],
        },
        outputFile: {
            junit: "./test-results.xml",
        },
        watchExclude: [],
    },
};
//# sourceMappingURL=vitest.workspace.js.map