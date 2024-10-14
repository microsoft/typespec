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
import { getNs, isAttribute, isUnwrapped } from "@typespec/xml";
import { reportDiagnostic } from "./lib.js";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { getSchemaForStdScalars } from "./std-scalar-schemas.js";
import { OpenAPI3Schema, OpenAPI3XmlSchema } from "./types.js";

const B = {
  array: <T>(items: T[]): ArrayBuilder<T> => {
    const builder = new ArrayBuilder<T>();
    for (const item of items) {
      builder.push(item);
    }
    return builder;
  },
} as const;

export function attachXmlObjectForScalarOrModel(
  program: Program,
  prop: Scalar | Model,
  emitObject: OpenAPI3Schema,
) {
  const xmlObject: OpenAPI3XmlSchema = {};

  // Resolve XML name
  const xmlName = resolveEncodedName(program, prop, "application/xml");
  if (xmlName !== prop.name) {
    xmlObject.name = xmlName;
  }

  // Get and set XML namespace if present
  const currNs = getNs(program, prop);
  if (currNs) {
    xmlObject.prefix = currNs.prefix;
    xmlObject.namespace = currNs.namespace;
  }

  // Attach xml schema to emitObject if not empty
  if (Object.keys(xmlObject).length !== 0) {
    emitObject.xml = xmlObject;
  }
}

export function attachXmlObjectForModelProperty(
  program: Program,
  options: ResolvedOpenAPI3EmitterOptions,
  prop: ModelProperty,
  emitObject: OpenAPI3Schema,
  ref?: Record<string, any>,
) {
  const xmlObject: OpenAPI3XmlSchema = {};

  const isXmlModel = isXmlModelChecker(program, prop.model!, []);
  if (!isXmlModel) {
    return;
  }

  // Resolve XML name
  const xmlName = resolveEncodedName(program, prop, "application/xml");
  const jsonName = resolveEncodedName(program, prop, "application/json");
  if (xmlName !== prop.name && xmlName !== jsonName) {
    xmlObject.name = xmlName;
  }

  // Get and set XML namespace if present
  const currNs = getNs(program, prop);
  if (currNs) {
    xmlObject.prefix = currNs.prefix;
    xmlObject.namespace = currNs.namespace;
  }

  // Set XML attribute if present
  if (isAttribute(program, prop)) {
    if (prop.type?.kind === "Model") {
      reportDiagnostic(program, {
        code: "xml-attribute-invalid-property-type",
        format: { name: prop.name },
        target: prop,
      });
    } else {
      xmlObject.attribute = true;
    }
  }

  // Handle array wrapping if necessary
  const isArrayProperty = prop.type?.kind === "Model" && isArrayModelType(program, prop.type);
  const hasUnwrappedDecorator = isUnwrapped(program, prop);
  if (!isArrayProperty && hasUnwrappedDecorator) {
    reportDiagnostic(program, {
      code: "xml-unwrapped-invalid-property-type",
      format: { name: prop.name },
      target: prop,
    });
  }

  if (isArrayProperty && ref && ref.items) {
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
      ref.items = scalarSchema;
    } else {
      ref.items = new ObjectBuilder({
        allOf: B.array([ref.items]),
        xml: { name: propXmlName },
      });
    }

    // handel unwrapped decorator
    if (!hasUnwrappedDecorator) {
      xmlObject.wrapped = true;
    }
  }

  if (!isArrayProperty && ref && !ref.type) {
    emitObject.allOf = B.array([ref]);
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
}

export function isXmlModelChecker(
  program: Program,
  model: Scalar | Model | ModelProperty,
  checked: string[],
): boolean {
  const xmlName = resolveEncodedName(program, model, "application/xml");
  if (xmlName && xmlName !== model.name) {
    return true;
  }

  const currNs = getNs(program, model);
  if (currNs) {
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
      if (
        isAttribute(program, prop) ||
        isUnwrapped(program, prop) ||
        isXmlModelChecker(program, prop, checked)
      ) {
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
