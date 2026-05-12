/**
 * LRO (Long Running Operations) extension interfaces.
 *
 * These types extend the core service method types with LRO-specific metadata.
 * They depend on `@azure-tools/typespec-azure-core` and are NOT part of the
 * protocol-agnostic core package.
 *
 * In the final architecture, these live in `@azure-tools/typespec-client-generator-core`
 * and extend the core `SdkServiceMethod` union.
 */
import { FinalStateValue, LroMetadata, ParameterSource } from "@azure-tools/typespec-azure-core";

import type {
  SdkArrayType,
  SdkBuiltInType,
  SdkModelPropertyType,
  SdkModelType,
  SdkPagingServiceMethodOptions,
  SdkServiceMethodBase,
  SdkServiceOperation,
  SdkServiceResponseHeader,
} from "../interfaces.js";

// ============================================================================
// LRO Method Options
// ============================================================================

export interface SdkLroServiceMethodOptions {
  /** LRO info */
  lroMetadata: SdkLroServiceMetadata;
}

// ============================================================================
// LRO Metadata
// ============================================================================

export interface SdkLroServiceMetadata {
  __raw: LroMetadata;
  finalStateVia: FinalStateValue;
  pollingStep: SdkLroServicePollingStep;
  finalStep?: SdkLroServiceFinalStep;
  finalResponse?: SdkLroServiceFinalResponse;

  operation: SdkServiceOperation;
  logicalResult: SdkModelType;
  statusMonitorStep?: SdkNextOperationLink | SdkNextOperationReference;
  pollingInfo: SdkPollingOperationStep;
  envelopeResult: SdkModelType;
  logicalPath?: string;
  finalResult?: SdkModelType | SdkArrayType | SdkBuiltInType | "void";
  finalEnvelopeResult?: SdkModelType | SdkArrayType | SdkBuiltInType | "void";
  finalResultPath?: string;
}

// ============================================================================
// LRO Step Types
// ============================================================================

export interface SdkNextOperationReference extends SdkLogicalOperationStep {
  kind: "nextOperationReference";
  responseModel: SdkModelType;
  target: SdkOperationReference;
}

export interface SdkPollingOperationStep {
  kind: "pollingOperationStep";
  responseModel: SdkModelType;
  terminationStatus: SdkTerminationStatus;
  resultProperty?: SdkModelPropertyType;
  errorProperty?: SdkModelPropertyType;
}

export type SdkTerminationStatus = SdkHttpOperationStatus | SdkModelPropertyTerminationStatus;

interface SdkHttpOperationStatus {
  kind: "status-code";
}

interface SdkModelPropertyTerminationStatus {
  kind: "model-property";
  property: SdkModelPropertyType;
  succeededState: string[];
  failedState: string[];
  canceledState: string[];
}

export interface SdkNextOperationLink extends SdkLogicalOperationStep {
  kind: "nextOperationLink";
  responseModel: SdkModelType;
  target: SdkOperationLink;
}

export interface SdkLroServicePollingStep {
  responseBody?: SdkModelType;
}

export interface SdkOperationLink {
  kind: "link";
  location: "ResponseHeader" | "ResponseBody" | "Self";
  property: SdkModelPropertyType;
}

interface SdkLogicalOperationStep {
  responseModel?: SdkModelType | SdkBuiltInType;
}

export interface SdkPropertyMap {
  sourceKind: "RequestParameter" | "RequestBody" | "ResponseBody";
  source: SdkModelPropertyType;
  target: SdkModelPropertyType;
}

export interface SdkOperationReference {
  kind: "reference";
  operation: SdkServiceOperation;
  parameterMap?: Map<string, ParameterSource>;
  parameters?: Map<string, SdkPropertyMap>;
  link?: SdkOperationLink;
}

export type SdkLroServiceFinalStep =
  | SdkFinalOperationLink
  | SdkFinalOperationReference
  | SdkPollingSuccessProperty
  | SdkNoPollingSuccessProperty;

interface SdkFinalOperationLink extends SdkLogicalOperationStep {
  kind: "finalOperationLink";
  target: SdkOperationLink;
}

interface SdkFinalOperationReference extends SdkLogicalOperationStep {
  kind: "finalOperationReference";
  target: SdkOperationReference;
}

interface SdkPollingSuccessProperty extends SdkLogicalOperationStep {
  kind: "pollingSuccessProperty";
  responseModel: SdkModelType | SdkBuiltInType;
  target: SdkModelPropertyType;
  sourceProperty: SdkModelPropertyType | undefined;
}

interface SdkNoPollingSuccessProperty extends SdkLogicalOperationStep {
  kind: "noPollingResult";
  responseModel: undefined;
}

export interface SdkLroServiceFinalResponse {
  envelopeResult: SdkModelType | SdkArrayType | SdkBuiltInType;
  result: SdkModelType | SdkArrayType | SdkBuiltInType;
  resultSegments?: SdkModelPropertyType[];
}

// ============================================================================
// LRO Service Methods
// ============================================================================

/** Long running method. */
export interface SdkLroServiceMethod<TServiceOperation extends SdkServiceOperation>
  extends SdkServiceMethodBase<TServiceOperation>,
    SdkLroServiceMethodOptions {
  kind: "lro";
  __raw_lro_metadata: LroMetadata;
}

/** Long running method with paging. */
export interface SdkLroPagingServiceMethod<TServiceOperation extends SdkServiceOperation>
  extends SdkServiceMethodBase<TServiceOperation>,
    SdkLroServiceMethodOptions,
    SdkPagingServiceMethodOptions<TServiceOperation> {
  kind: "lropaging";
}

// ============================================================================
// Extended Service Method Union (Azure)
// ============================================================================

/**
 * Azure-specific service method variants (LRO).
 * The Azure extension defines the full union as:
 * `SdkCoreServiceMethod<T> | SdkLroServiceMethod<T> | SdkLroPagingServiceMethod<T>`
 */
export type SdkAzureServiceMethod<TServiceOperation extends SdkServiceOperation> =
  | SdkLroServiceMethod<TServiceOperation>
  | SdkLroPagingServiceMethod<TServiceOperation>;
