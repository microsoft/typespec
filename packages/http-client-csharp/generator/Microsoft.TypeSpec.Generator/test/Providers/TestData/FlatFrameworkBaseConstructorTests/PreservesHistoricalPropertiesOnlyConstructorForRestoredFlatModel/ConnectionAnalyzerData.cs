// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Tests.Providers.NetworkFramework;

namespace Sample.Models
{
    // Minimal contract with the constructor shape reported for Network GA 1.17.0.
    // This is a provider-level stand-in, not the actual released assembly or an ApiCompat baseline.
    public class ConnectionAnalyzerData : TrackedResourceData
    {
        public ConnectionAnalyzerData(ConnectionAnalyzerProperties properties)
        {
            ArgumentNullException.ThrowIfNull(properties);
            Properties = properties;
        }

        public ConnectionAnalyzerProperties Properties { get; }
    }
}
