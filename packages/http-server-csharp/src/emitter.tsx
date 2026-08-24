import { Show, SourceDirectory } from "@alloy-js/core";
import { createCSharpNamePolicy, Namespace } from "@alloy-js/csharp";
import type { EmitContext } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { Experimental_ComponentOverrides, Output } from "@typespec/emitter-framework";
import { HttpCanonicalizer } from "@typespec/http-canonicalization";
import { Enums } from "./components/enums/enums.jsx";
import { Models } from "./components/models/models.jsx";
import { Csproj } from "./components/project/csproj.jsx";
import { AppSettings, LaunchSettings } from "./components/project/launch-settings.jsx";
import { ProgramCs } from "./components/project/program.jsx";
import { ControllersAndInterfaces } from "./components/render-root.jsx";
import { Documentation } from "./components/scaffolding/documentation.jsx";
import { MockHelpers, MockImplementations } from "./components/scaffolding/mock-scaffolding.jsx";
import { JsonConverters } from "./components/serialization/json-converters.jsx";
import { createServerScalarOverrides } from "./components/type-expression/type-expression.jsx";
import { EmitterOptions } from "./context/emitter-options-context.js";
import { OperationSources } from "./context/operation-source-context.js";
import { reportEmitterDiagnostics } from "./diagnostics.js";
import type { CSharpServiceEmitterOptions } from "./lib.js";
import { resolveOpenApiPath, writeOutputWithOverwrite } from "./output-writer.js";
import { resolveServiceTypes } from "./service-resolution.js";

/**
 * Main function to handle the emission process.
 * @param context - The context for the emission process.
 */
export async function $onEmit(context: EmitContext<CSharpServiceEmitterOptions>) {
  const tk = $(context.program);
  const canonicalizer = new HttpCanonicalizer(tk);
  const scalarOverrides = createServerScalarOverrides(tk);
  const options = context.options;
  const collectionType = options["collection-type"] ?? "array";
  const modelsOnly = options["output-type"] === "models";
  const emitMocks =
    !modelsOnly &&
    (options["emit-mocks"] === "mocks-only" || options["emit-mocks"] === "mocks-and-project-files");
  const emitProjectFiles = !modelsOnly && options["emit-mocks"] === "mocks-and-project-files";
  const useSwaggerUI = !modelsOnly && (options["use-swaggerui"] ?? false);

  // Resolve all service types in a single pass
  const resolution = resolveServiceTypes(context.program, tk, canonicalizer, {
    canonicalizeOperations: !modelsOnly,
  });
  const serviceName = resolution.serviceNamespaceName ?? "ServiceProject";
  const projectName = options["project-name"] ?? "ServiceProject";

  // Report diagnostic warnings (pre-pass before rendering)
  reportEmitterDiagnostics(
    context.program,
    resolution.interfaces,
    resolution.canonicalOpsMap,
    resolution.declarationNamespaces,
  );

  // Resolve OpenAPI path for SwaggerUI
  let openApiPath: string | undefined = options["openapi-path"];
  if (!openApiPath && useSwaggerUI) {
    openApiPath = await resolveOpenApiPath(context);
  }
  const effectiveUseSwaggerUI = useSwaggerUI && !!openApiPath;

  // Collect interface names for mock registration
  const interfaceNames = resolution.interfaces.map((iface) => iface.name);
  const interfaceRegistrations = resolution.interfaces.map(
    (iface) => `I${iface.name}, ${iface.name}`,
  );

  const httpPort = options["http-port"] ?? 5000;
  const httpsPort = options["https-port"] ?? 7000;

  const output = (
    <Output program={context.program} namePolicy={createCSharpNamePolicy()}>
      <Experimental_ComponentOverrides overrides={scalarOverrides}>
        <EmitterOptions.Provider value={{ collectionType, serviceNamespace: serviceName }}>
          <OperationSources.Provider value={resolution.canonicalOperationSourceMap}>
            <SourceDirectory path=".">
              <Namespace name={serviceName}>
                <SourceDirectory path="generated">
                  <SourceDirectory path="models">
                    <Models
                      models={resolution.models}
                      serviceNamespace={resolution.serviceNamespace}
                    />
                    <Enums
                      enums={resolution.enums}
                      unionEnums={resolution.unionEnums}
                      serviceNamespace={resolution.serviceNamespace}
                    />
                  </SourceDirectory>
                  <Show when={!modelsOnly}>
                    <ControllersAndInterfaces
                      interfaces={resolution.interfaces}
                      canonicalOpsMap={resolution.canonicalOpsMap}
                    />
                  </Show>
                </SourceDirectory>
                <Show when={!modelsOnly}>
                  <ProgramCs
                    hasMocks={emitMocks}
                    useSwaggerUI={effectiveUseSwaggerUI}
                    openApiPath={openApiPath}
                  />
                </Show>
                <Show when={emitMocks}>
                  <MockImplementations
                    interfaces={resolution.interfaces}
                    canonicalOpsMap={resolution.canonicalOpsMap}
                  />
                </Show>
                <Show when={emitProjectFiles}>
                  <Csproj projectName={projectName} useSwaggerUI={useSwaggerUI} />
                  <LaunchSettings httpPort={httpPort} httpsPort={httpsPort} />
                  <AppSettings />
                </Show>
                <Show when={!modelsOnly}>
                  <Documentation
                    interfaceNames={emitMocks ? interfaceNames : []}
                    useSwaggerUI={useSwaggerUI}
                  />
                </Show>
              </Namespace>
              <SourceDirectory path="generated">
                <JsonConverters />
              </SourceDirectory>
              <Show when={emitMocks}>
                <MockHelpers interfaceRegistrations={interfaceRegistrations} />
              </Show>
            </SourceDirectory>
          </OperationSources.Provider>
        </EmitterOptions.Provider>
      </Experimental_ComponentOverrides>
    </Output>
  );

  const overwrite = options.overwrite ?? false;
  await writeOutputWithOverwrite(context.program, output, context.emitterOutputDir, overwrite);
}
