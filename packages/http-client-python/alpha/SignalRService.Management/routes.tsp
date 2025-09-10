// FIXME: Operations in this file are not detected as a resource operation, please confirm the conversion result manually

import "@azure-tools/typespec-azure-core";
import "@typespec/rest";
import "./models.tsp";
import "@azure-tools/typespec-azure-resource-manager";
import "@typespec/openapi";

using TypeSpec.Rest;
using TypeSpec.Http;
using Azure.ResourceManager;
using TypeSpec.OpenAPI;

namespace Microsoft.SignalRService;

#suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-interface-requires-decorator" "For backward compatibility"
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
interface SignalROperationGroup {
  /**
   * Checks that the resource name is valid and is not already in use.
   */
  @autoRoute
  checkNameAvailability is ArmProviderActionSync<
    Request = NameAvailabilityParameters,
    Response = NameAvailability,
    Scope = SubscriptionActionScope,
    Parameters = LocationParameter
  >;
}

#suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-interface-requires-decorator" "For backward compatibility"
interface UsagesOperationGroup {
  /**
   * List resource usage quotas by location.
   */
  @autoRoute
  @get
  @list
  @action("usages")
  list is ArmProviderActionSync<
    Response = SignalRUsageList,
    Scope = SubscriptionActionScope,
    Parameters = LocationParameter
  >;
}
