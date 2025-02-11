// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
import { FinalStateValue } from "@azure-tools/typespec-azure-core";
import { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";
import { Type } from "@typespec/compiler";
import { InputHttpOperationExample } from "./example-interfaces.js";
import { InputConstant, InputType } from "./type-interfaces.js";

export interface InputOperation {
  Name: string;
  ResourceName?: string;
  Summary?: string;
  Deprecated?: string;
  Doc?: string;
  Accessibility?: string;
  Parameters: InputParameter[];
  Responses: OperationResponse[];
  HttpMethod: RequestMethod;
  RequestBodyMediaType: BodyMediaType;
  Uri: string;
  Path: string;
  ExternalDocsUrl?: string;
  RequestMediaTypes?: string[];
  BufferResponse: boolean;
  LongRunning?: OperationLongRunning;
  Paging?: OperationPaging;
  GenerateProtocolMethod: boolean;
  GenerateConvenienceMethod: boolean;
  Examples?: InputHttpOperationExample[];
  CrossLanguageDefinitionId: string;
  Decorators?: DecoratorInfo[];
}

export interface InputParameter {
  Name: string;
  NameInRequest: string;
  Summary?: string;
  Doc?: string;
  Type: InputType;
  Location: RequestLocation;
  DefaultValue?: InputConstant;
  GroupedBy?: InputParameter;
  Kind: InputOperationParameterKind;
  IsRequired: boolean;
  IsApiVersion: boolean;
  IsResourceParameter: boolean;
  IsContentType: boolean;
  IsEndpoint: boolean;
  SkipUrlEncoding: boolean;
  Explode: boolean;
  ArraySerializationDelimiter?: string;
  HeaderCollectionPrefix?: string;
  Decorators?: DecoratorInfo[];
}

export enum InputOperationParameterKind {
  Method = "Method",
  Client = "Client",
  Constant = "Constant",
  Spread = "Spread",
}

export enum RequestMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
  TRACE = "TRACE",
  NONE = "",
}

export function parseHttpRequestMethod(method: string): RequestMethod {
  if (method.length === 3) {
    if (method.toLowerCase() === "get") return RequestMethod.GET;
    if (method.toLowerCase() === "put") return RequestMethod.PUT;
  } else if (method.length === 4) {
    if (method.toLowerCase() === "post") return RequestMethod.POST;
    if (method.toLowerCase() === "head") return RequestMethod.HEAD;
  } else {
    if (method.toLowerCase() === "patch") return RequestMethod.PATCH;
    if (method.toLowerCase() === "delete") return RequestMethod.DELETE;
    if (method.toLowerCase() === "options") return RequestMethod.OPTIONS;
    if (method.toLowerCase() === "trace") return RequestMethod.TRACE;
  }

  return RequestMethod.NONE;
}

export enum RequestLocation {
  None = "",
  Uri = "Uri",
  Path = "Path",
  Query = "Query",
  Header = "Header",
  Body = "Body",
}

export const requestLocationMap: { [key: string]: RequestLocation } = {
  path: RequestLocation.Path,
  query: RequestLocation.Query,
  header: RequestLocation.Header,
  body: RequestLocation.Body,
  uri: RequestLocation.Uri,
};

export interface OperationResponse {
  StatusCodes: number[];
  BodyType?: InputType;
  BodyMediaType: BodyMediaType;
  Headers: HttpResponseHeader[];
  ContentTypes?: string[];
  IsErrorResponse: boolean;
}

export interface HttpResponseHeader {
  Name: string;
  NameInResponse: string;
  Summary: string;
  Doc: string;
  Type: InputType;
}

export interface OperationPaging {
  NextLinkName?: string;
  ItemName?: string;
  NextLinkOperation?: InputOperation;
  NextLinkOperationRef?: (p: any) => void;
}

export interface OperationLongRunning {
  FinalStateVia: OperationFinalStateVia;
  FinalResponse: OperationResponse;
  ResultPath?: string;
}

export enum OperationFinalStateVia {
  AzureAsyncOperation,
  Location,
  OriginalUri,
  OperationLocation,
  CustomLink,
  CustomOperationReference,
  NoResult,
}

export function convertLroFinalStateVia(finalStateValue: FinalStateValue): OperationFinalStateVia {
  switch (finalStateValue) {
    case FinalStateValue.azureAsyncOperation:
      return OperationFinalStateVia.AzureAsyncOperation;
    // TODO: we don't have implementation of custom-link and custom-operation-reference yet
    // case FinalStateValue.customLink:
    //     return OperationFinalStateVia.CustomLink;

    // And right now some existing API specs are not correctly defined so that they are parsed
    // into `custom-operation-reference` which should be `operation-location`.
    // so let's fallback `custom-operation-reference` into `operation-location` as a work-around
    case FinalStateValue.customOperationReference:
      return OperationFinalStateVia.OperationLocation;
    case FinalStateValue.location:
      return OperationFinalStateVia.Location;
    case FinalStateValue.originalUri:
      return OperationFinalStateVia.OriginalUri;
    case FinalStateValue.operationLocation:
      return OperationFinalStateVia.OperationLocation;
    default:
      throw `Unsupported LRO final state value: ${finalStateValue}`;
  }
}

export enum BodyMediaType {
  None = "None",
  Binary = "Binary",
  Form = "Form",
  Json = "Json",
  Multipart = "Multipart",
  Text = "Text",
  Xml = "Xml",
}

export function typeToBodyMediaType(type: Type | undefined) {
  if (type === undefined) {
    return BodyMediaType.None;
  }

  if (type.kind === "Model") {
    return BodyMediaType.Json;
  } else if (type.kind === "String") {
    return BodyMediaType.Text;
  } else if (type.kind === "Scalar" && type.name === "bytes") {
    return BodyMediaType.Binary;
  }
  return BodyMediaType.None;
}

export enum CollectionFormat {
  CSV = "csv",
  Simple = "simple",
  SSV = "ssv",
  TSV = "tsv",
  Pipes = "pipes",
  Multi = "multi",
  Form = "form",
}

export const collectionFormatToDelimMap: {
  [key: string]: string | undefined;
} = {
  [CollectionFormat.CSV.toString()]: ",",
  [CollectionFormat.Simple.toString()]: ",", // csv and simple are used interchangeably
  [CollectionFormat.SSV.toString()]: " ",
  [CollectionFormat.TSV.toString()]: "\t",
  [CollectionFormat.Pipes.toString()]: "|",
  [CollectionFormat.Multi.toString()]: undefined,
  [CollectionFormat.Form.toString()]: undefined, // multi and form are used interchangeably
};
