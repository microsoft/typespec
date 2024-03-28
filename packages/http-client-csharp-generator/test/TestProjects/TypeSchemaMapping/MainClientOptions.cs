// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Azure.Core;

[assembly: CodeGenSuppressType(nameof(CustomNamespace.MainClientOptions.ServiceVersion))]
namespace CustomNamespace
{
    [CodeGenType("SchemaMappingClientOptions")]
    [CodeGenSuppress("LatestVersion")]
    internal partial class MainClientOptions
    {
        private const ServiceVersion LatestVersion = ServiceVersion.V1_0_2;

        /// <summary> The version of the service to use. </summary>
        public enum ServiceVersion
        {
            /// <summary> Service version "1.0.0". </summary>
            V1_0_0 = 0,
            /// <summary> Service version "1.0.1". </summary>
            V1_0_1 = 1,
            /// <summary> Service version "1.0.2". </summary>
            V1_0_2 = 2,
        }
    }
}
