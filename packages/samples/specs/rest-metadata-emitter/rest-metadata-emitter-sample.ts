import {
  EmitContext,
  getService,
  getTypeName,
  isArrayModelType,
  joinPaths,
  listServices,
  Model,
  ModelProperty,
  Namespace,
  Program,
  projectProgram,
  Type,
} from "@typespec/compiler";
import {
  createMetadataInfo,
  getHttpService,
  getVisibilitySuffix,
  HttpOperation,
  HttpOperationBody,
  HttpOperationMultipartBody,
  HttpOperationResponse,
  resolveRequestVisibility,
  Visibility,
} from "@typespec/http";
import { buildVersionProjections } from "@typespec/versioning";
import assert from "assert";

export async function $onEmit(context: EmitContext): Promise<void> {
  // Keep track of current indentation, will increase by two spaces for each
  // `indent` call and decrease by two spaces for each unindent call.
  let indentation = "";

  // The output in progress of this emitter in a string. Will get written to output file
  // by `writeOutputFile`.
  let content = "";

  emitAllServiceVersions();
  await writeOutputFile();

  /** Enumerate all services and versions thereof and emit them. */
  function emitAllServiceVersions() {
    const services = listServices(context.program);
    for (const service of services) {
      const versionProjections = buildVersionProjections(context.program, service.type);
      for (const versionProjection of versionProjections) {
        const projectedProgram = projectProgram(context.program, versionProjection.projections);
        const serviceNamespace = projectedProgram.projector.projectedTypes.get(service.type);
        assert.strictEqual(serviceNamespace?.kind, "Namespace" as const);
        const details = getService(projectedProgram, serviceNamespace);
        emitService(
          projectedProgram,
          serviceNamespace,
          details?.title,
          versionProjection.version ?? details?.version,
        );
      }
    }
  }

  /** Emit a single version of a single service. */
  function emitService(
    program: Program,
    serviceNamespace: Namespace,
    title: string | undefined,
    version: string | undefined,
  ): void {
    const [service] = getHttpService(program, serviceNamespace);

    // Create MetadataInfo for the program, which will allow us to reason
    // about metadata applicability and visibility.
    const metadataInfo = createMetadataInfo(program);

    // Keep track of all models that are used in the service, and the
    // visibilities that they are used with.
    const models = new Map<Model, Set<Visibility>>();

    writeLine("");
    writeLine(`service: ${getTypeName(service.namespace)}`);
    indent();
    if (title) {
      writeLine(`title: ${title}`);
    }
    if (version) {
      writeLine(`version: ${version}`);
    }
    writeLine("ops:");
    indent();
    for (const operation of service.operations) {
      emitOperation(operation);
    }
    unindent();

    writeLine("models:");
    indent();
    emitModels();
    unindent();

    writeLine("");

    function emitOperation(operation: HttpOperation) {
      writeLine(`op: ${operation.verb.toUpperCase()} ${operation.path}`);
      indent();
      emitRequest(program, operation);
      emitResponses(operation.responses);
      unindent();
    }

    function emitRequest(program: Program, operation: HttpOperation) {
      const parameters = operation.parameters;
      if (parameters.parameters.length === 0 && !parameters.body) {
        // no request data
        return;
      }

      // Map the verb to a visibility for the request.
      const visibility = resolveRequestVisibility(program, operation.operation, operation.verb);

      writeLine("request:");
      indent();
      for (const parameter of parameters.parameters) {
        writeLine(
          `${parameter.type} ${parameter.name}: ${getTypeReference(
            parameter.param.type,
            visibility,
          )}`,
        );
      }

      if (parameters.body) {
        writeLine(`body: ${getTypeReference(parameters.body.type, visibility)}`);
      }
      unindent();
    }

    function emitResponses(responses: HttpOperationResponse[]) {
      for (const response of responses) {
        for (const content of response.responses) {
          writeLine(`response: ${response.statusCode}${getContentTypeRemark(content.body)}`);
          indent();

          // NOTE: For response data, the visibility to apply is always Read.
          const visibility = Visibility.Read;

          if (content.headers) {
            for (const [name, property] of Object.entries(content.headers)) {
              writeLine(`header ${name}: ${getTypeReference(property.type, visibility)}`);
            }
          }

          if (content.body) {
            writeLine(`body: ${getTypeReference(content.body.type, visibility)}`);
          }

          unindent();
        }
      }
    }

    function emitModels(): void {
      for (const [model, visibilities] of models) {
        writeLine(`model: ${getTypeName(model)}`);
        indent();
        for (const [name, property] of model.properties) {
          writeLine(
            `${name}: ${getTypeName(property.type)}${getPropertyVisibilityRemark(
              property,
              visibilities,
            )}`,
          );
        }
        unindent();
      }
    }

    function getTypeReference(type: Type, visibility: Visibility): string {
      // Use getEffectivePayloadType to recover a named type when a model is
      // anonymous but consists entirely of properties sourced from a named
      // model.
      type = metadataInfo.getEffectivePayloadType(type, visibility);

      // Recursively record all models that are referenced by this type with
      // this visibility.
      switch (type.kind) {
        case "Union":
          for (const [_, variant] of type.variants) {
            getTypeReference(variant.type, visibility);
          }
          break;
        case "Model":
          if (isArrayModelType(program, type)) {
            // When a model appears in an array, we add the special Item to include
            // all metadata in payload.
            visibility |= Visibility.Item;
            getTypeReference(type.indexer.value, visibility);
            break;
          }
          let isNew = false;
          const seen = models.get(type);
          if (seen) {
            isNew = !seen.has(visibility);
            seen.add(visibility);
          } else {
            isNew = true;
            models.set(type, new Set([visibility]));
          }
          if (isNew) {
            for (const [_, property] of type.properties) {
              getTypeReference(property.type, visibility);
            }
          }
          break;
      }

      return `${getTypeName(type)}${getVisibilityReferenceRemark(type, visibility)}`;
    }

    function getPropertyVisibilityRemark(
      property: ModelProperty,
      visibilities: Set<Visibility>,
    ): string {
      const remarks: string[] = [];

      if (property.type.kind === "Model" && isArrayModelType(program, property.type)) {
        remarks.push("+Item on element visibility");
      }

      const inPayloadVisibilities = [];
      for (const visibility of visibilities) {
        if (metadataInfo.isPayloadProperty(property, visibility)) {
          inPayloadVisibilities.push(visibility);
        }
      }

      if (inPayloadVisibilities.length === 0) {
        // If it's never in the payload, it is only ever communicated in
        // metadata: header/path/query param, or status code.
        remarks.push("Metadata only");
      } else if (inPayloadVisibilities.length === visibilities.size) {
        // it's always in the payload, common case.
      } else {
        // it's in the payload for certain visibilities only.
        remarks.push(`${inPayloadVisibilities.map(getVisibilitySuffix).join(",")} only`);
      }

      return remarks.length === 0 ? "" : ` (${remarks.join(", ")})`;
    }

    function getContentTypeRemark(
      body: HttpOperationBody | HttpOperationMultipartBody | undefined,
    ) {
      const ct = body?.contentTypes;
      if (!ct || ct.length === 0 || (ct.length === 1 && ct[0] === "application/json")) {
        return "";
      }
      return ` (${ct.join(", ")})`;
    }

    function getVisibilityReferenceRemark(type: Type, visibility: Visibility): string {
      if (!metadataInfo.isTransformed(type, visibility)) {
        // type is unchanged by this visibility, no need to mention it.
        return "";
      }
      return ` (${getVisibilitySuffix(visibility)})`;
    }
  }

  function indent(): void {
    indentation += "  ";
  }

  function unindent(): void {
    indentation = indentation.slice(0, -2);
  }

  function writeLine(text: string): void {
    content += indentation + text + "\n";
  }

  async function writeOutputFile() {
    if (!context.program.compilerOptions.noEmit) {
      const path = joinPaths(context.emitterOutputDir, "rest-emitter-sample-output.txt");
      await context.program.host.mkdirp(context.emitterOutputDir);
      await context.program.host.writeFile(path, content);
    }
  }
}
