// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Report;
using Azure.ResourceManager;

namespace AutoRest.CSharp.Mgmt.Decorator.Transformer
{
    internal static class CommonSingleWordModels
    {
        private static readonly HashSet<string> _schemasToChange = new HashSet<string>()
        {
            "Sku",
            "SkuName",
            "SkuTier",
            "SkuFamily",
            "SkuInformation",
            "Plan",
            "Usage",
            "Resource",
            "Kind",
            // Private endpoint definitions which are defined in swagger common-types/privatelinks.json and are used by RPs
            "PrivateEndpointConnection",
            "PrivateLinkResource",
            "PrivateLinkServiceConnectionState",
            "PrivateEndpointServiceConnectionStatus",
            "PrivateEndpointConnectionProvisioningState",
            // not defined in common-types, but common in various RP
            "PrivateLinkResourceProperties",
            "PrivateLinkServiceConnectionStateProperty",
            // internal, but could be public in the future, also make the names more consistent
            "PrivateEndpointConnectionListResult",
            "PrivateLinkResourceListResult"
        };

        public static void Update()
        {
            foreach (var schemaName in Configuration.MgmtConfiguration.PrependRPPrefix)
            {
                _schemasToChange.Add(schemaName);
            }
            foreach (var schema in MgmtContext.CodeModel.AllSchemas)
            {
                string serializedName = schema.Language.Default.SerializedName ?? schema.Language.Default.Name;
                if (_schemasToChange.Contains(serializedName))
                {
                    string oriName = schema.Language.Default.Name;
                    string prefix = MgmtContext.Context.DefaultNamespace.Equals(typeof(ArmClient).Namespace) ? "Arm" : MgmtContext.RPName;
                    string suffix = serializedName.Equals("Resource") ? "Data" : string.Empty;
                    schema.Language.Default.SerializedName ??= schema.Language.Default.Name;
                    schema.Language.Default.Name = prefix + serializedName + suffix;
                    MgmtReport.Instance.TransformSection.AddTransformLogForApplyChange(
                        new TransformItem(TransformTypeName.PrependRpPrefix, serializedName), schema.GetFullSerializedName(), "ApplyPrependRpPrefix", oriName, schema.Language.Default.Name);
                }
            }
        }
    }
}
