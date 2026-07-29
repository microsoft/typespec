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
import { reportEmitterDiagnostics } from "./diagnostics.js";
import { CSharpServiceEmitterOptions } from "./lib.js";
import { resolveOpenApiPath, writeOutputWithOverwrite } from "./output-writer.js";
import { resolveServiceTypes } from "./service-resolution.js";
import { getFreePort } from "./utils/port.js";

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
  const emitMocks =
    options["emit-mocks"] === "mocks-only" || options["emit-mocks"] === "mocks-and-project-files";
  const emitProjectFiles = options["emit-mocks"] === "mocks-and-project-files";
  const useSwaggerUI = options["use-swaggerui"] ?? false;

  // Resolve all service types in a single pass
  const resolution = resolveServiceTypes(context.program, tk, canonicalizer);
  const serviceName = resolution.serviceNamespaceName ?? "ServiceProject";
  const projectName = options["project-name"] ?? "ServiceProject";

  // Report diagnostic warnings (pre-pass before rendering)
  reportEmitterDiagnostics(context.program, resolution.interfaces, resolution.canonicalOpsMap);

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

  // Resolve ports for project files
  let httpPort = options["http-port"] ?? 5000;
  let httpsPort = options["https-port"] ?? 7000;
  if (emitProjectFiles) {
    if (!options["http-port"]) {
      httpPort = await getFreePort(5000, 5999);
    }
    if (!options["https-port"]) {
      httpsPort = await getFreePort(7000, 7999);
    }
  }

  const output = (
    <Output program={context.program} namePolicy={createCSharpNamePolicy()}>
      <Experimental_ComponentOverrides overrides={scalarOverrides}>
        <EmitterOptions.Provider value={{ collectionType, serviceNamespace: serviceName }}>
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
                <ControllersAndInterfaces
                  interfaces={resolution.interfaces}
                  canonicalOpsMap={resolution.canonicalOpsMap}
                />
              </SourceDirectory>
              <ProgramCs
                hasMocks={emitMocks}
                useSwaggerUI={effectiveUseSwaggerUI}
                openApiPath={openApiPath}
              />
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
              <Documentation
                interfaceNames={emitMocks ? interfaceNames : []}
                useSwaggerUI={useSwaggerUI}
              />
            </Namespace>
            <SourceDirectory path="generated">
              <JsonConverters />
            </SourceDirectory>
            <Show when={emitMocks}>
              <MockHelpers interfaceRegistrations={interfaceRegistrations} />
            </Show>
          </SourceDirectory>
        </EmitterOptions.Provider>
      </Experimental_ComponentOverrides>
    </Output>
  );

  const overwrite = options.overwrite ?? false;
  await writeOutputWithOverwrite(context.program, output, context.emitterOutputDir, overwrite);
}
