import "./main.tsp";
import "@azure-tools/typespec-client-generator-core";

using Azure.ClientGenerator.Core;
using Azure.ResourceManager.MethodSubscriptionId;

// Scenario 1: Two subscription resources - move all subscriptionId parameters to method level
@@clientLocation(TwoSubscriptionResourcesMethodLevel.GetSubscriptionResource1BaseParameter.subscriptionId,
  TwoSubscriptionResourcesMethodLevel.SubscriptionResource1Operations.get
);

@@clientLocation(TwoSubscriptionResourcesMethodLevel.PutSubscriptionResource1BaseParameter.subscriptionId,
  TwoSubscriptionResourcesMethodLevel.SubscriptionResource1Operations.put
);

@@clientLocation(TwoSubscriptionResourcesMethodLevel.DeleteSubscriptionResource1BaseParameter.subscriptionId,
  TwoSubscriptionResourcesMethodLevel.SubscriptionResource1Operations.delete
);

@@clientLocation(TwoSubscriptionResourcesMethodLevel.GetSubscriptionResource2BaseParameter.subscriptionId,
  TwoSubscriptionResourcesMethodLevel.SubscriptionResource2Operations.get
);

@@clientLocation(TwoSubscriptionResourcesMethodLevel.PutSubscriptionResource2BaseParameter.subscriptionId,
  TwoSubscriptionResourcesMethodLevel.SubscriptionResource2Operations.put
);

@@clientLocation(TwoSubscriptionResourcesMethodLevel.DeleteSubscriptionResource2BaseParameter.subscriptionId,
  TwoSubscriptionResourcesMethodLevel.SubscriptionResource2Operations.delete
);

// Scenario 2: Mixed placement - only move subscriptionId for subscription resource operations to method level
@@clientLocation(MixedSubscriptionPlacement.GetSubscriptionResourceBaseParameter.subscriptionId,
  MixedSubscriptionPlacement.SubscriptionResourceOperations.get
);

@@clientLocation(MixedSubscriptionPlacement.PutSubscriptionResourceBaseParameter.subscriptionId,
  MixedSubscriptionPlacement.SubscriptionResourceOperations.put
);

@@clientLocation(MixedSubscriptionPlacement.DeleteSubscriptionResourceBaseParameter.subscriptionId,
  MixedSubscriptionPlacement.SubscriptionResourceOperations.delete
);
