import {
  ArrayModelType,
  IntrinsicScalarName,
  Model,
  ModelProperty,
  Program,
  Scalar,
  isArrayModelType,
  resolveEncodedName,
} from "@typespec/compiler";
import { ArrayBuilder, ObjectBuilder } from "@typespec/compiler/emitter-framework";
import { reportDiagnostic } from "./lib.js";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { getSchemaForStdScalars } from "./std-scalar-schemas.js";
import { OpenAPI3Schema, OpenAPI3XmlSchema } from "./types.js";

export interface XmlModule {
  attachXmlObjectForScalarOrModel(
    program: Program,
    type: Scalar | Model,
    emitObject: OpenAPI3Schema,
  ): void;

  attachXmlObjectForModelProperty(
    program: Program,
    options: ResolvedOpenAPI3EmitterOptions,
    prop: ModelProperty,
    emitObject: OpenAPI3Schema,
    ref?: Record<string, any>,
  ): void;
}

export async function resolveXmlModule(): Promise<XmlModule | undefined> {
  const xml = await tryImportXml();
  if (xml === undefined) return undefined;

  return {
    attachXmlObjectForScalarOrModel: (
      program: Program,
      type: Scalar | Model,
      emitObject: OpenAPI3Schema,
    ) => {
      const isXmlModel = isXmlModelChecker(program, type, []);
      if (!isXmlModel) {
        return;
      }

      const xmlObject: OpenAPI3XmlSchema = {};

      // Resolve XML name
      const xmlName = resolveEncodedName(program, type, "application/xml");
      if (xmlName !== type.name) {
        xmlObject.name = xmlName;
      }

      // Get and set XML namespace if present
      const currNs = xml.getNs(program, type);
      if (currNs) {
        xmlObject.prefix = currNs.prefix;
        xmlObject.namespace = currNs.namespace;
      }

      // Attach xml schema to emitObject if not empty
      if (Object.keys(xmlObject).length !== 0) {
        emitObject.xml = xmlObject;
      }
    },
    attachXmlObjectForModelProperty: (
      program: Program,
      options: ResolvedOpenAPI3EmitterOptions,
      prop: ModelProperty,
      emitObject: OpenAPI3Schema,
      refSchema: OpenAPI3Schema,
    ) => {
      if (!isXmlModelChecker(program, prop.model!, [])) return;

      const xmlObject: OpenAPI3XmlSchema = {};

      // Resolve XML name
      const xmlName = resolveEncodedName(program, prop, "application/xml");
      const jsonName = resolveEncodedName(program, prop, "application/json");
      if (xmlName !== prop.name && xmlName !== jsonName) {
        xmlObject.name = xmlName;
      }

      // Get and set XML namespace if present
      const currNs = xml.getNs(program, prop);
      if (currNs) {
        xmlObject.prefix = currNs.prefix;
        xmlObject.namespace = currNs.namespace;
      }

      // Set XML attribute if present
      const isAttribute = xml.isAttribute(program, prop);
      if (isAttribute) {
        if (prop.type?.kind === "Model") {
          reportDiagnostic(program, {
            code: "xml-attribute-invalid-property-type",
            format: { name: prop.name },
            target: prop,
          });

          emitObject.type = "string";
          delete refSchema.items;
        }
        xmlObject.attribute = true;
      }

      // Handle array wrapping if necessary
      const hasUnwrappedDecorator = xml.isUnwrapped(program, prop);
      const isArrayProperty = prop.type?.kind === "Model" && isArrayModelType(program, prop.type);
      if (!isArrayProperty && hasUnwrappedDecorator) {
        reportDiagnostic(program, {
          code: "xml-unwrapped-invalid-property-type",
          format: { name: prop.name },
          target: prop,
        });
      }

      if (isArrayProperty && refSchema.items && !isAttribute) {
        const propValue = (prop.type as ArrayModelType).indexer.value;
        const propXmlName = hasUnwrappedDecorator
          ? xmlName
          : resolveEncodedName(program, propValue as Scalar | Model, "application/xml");
        if (propValue.kind === "Scalar") {
          let scalarSchema: OpenAPI3Schema = {};
          const isStd = program.checker.isStdType(propValue);
          if (isStd) {
            scalarSchema = getSchemaForStdScalars(propValue, options);
          } else if (propValue.baseScalar) {
            scalarSchema = getSchemaForStdScalars(
              propValue.baseScalar as Scalar & { name: IntrinsicScalarName },
              options,
            );
          }
          scalarSchema.xml = { name: propXmlName };
          refSchema.items = scalarSchema;
        } else {
          refSchema.items = new ObjectBuilder({
            allOf: new ArrayBuilder(refSchema.items as any),
            xml: { name: propXmlName },
          });
        }

        // handel unwrapped decorator
        if (!hasUnwrappedDecorator) {
          xmlObject.wrapped = true;
        }
      }

      if (!isArrayProperty && !refSchema.type && !isAttribute) {
        emitObject.allOf = new ArrayBuilder(refSchema as any);
        xmlObject.name = xmlName;
      }

      if (isArrayProperty && hasUnwrappedDecorator) {
        // if wrapped is false, xml.name of the wrapping element is ignored.
        delete xmlObject.name;
      }

      // Attach xml schema to emitObject if not empty
      if (Object.keys(xmlObject).length !== 0) {
        emitObject.xml = xmlObject;
      }
    },
  };
}

function isXmlModelChecker(
  program: Program,
  model: Scalar | Model | ModelProperty,
  checked: string[],
): boolean {
  if (model.decorators && model.decorators.some((d) => d.definition?.namespace.name === "Xml")) {
    return true;
  }
  const xmlName = resolveEncodedName(program, model, "application/xml");
  if (xmlName && xmlName !== model.name) {
    return true;
  }

  if (model.kind === "ModelProperty") {
    const propModel = model.type as Scalar | Model;
    if (propModel && !checked.includes(propModel.name)) {
      checked.push(propModel.name);
      if (isXmlModelChecker(program, propModel, checked)) {
        return true;
      }
    }
  }

  if (model.kind === "Model") {
    for (const prop of model.properties.values()) {
      if (isXmlModelChecker(program, prop, checked)) {
        return true;
      }

      if (prop.type?.kind === "Model" && isArrayModelType(program, prop.type)) {
        const propValue = (prop.type as ArrayModelType).indexer.value;
        const propModel = propValue as Model;
        if (propModel && !checked.includes(propModel.name)) {
          checked.push(propModel.name);
          if (isXmlModelChecker(program, propModel, checked)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

async function tryImportXml(): Promise<typeof import("@typespec/xml") | undefined> {
  try {
    const module = await import("@typespec/xml");
    return module;
  } catch {
    return undefined;
  }
}
