// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Configuration;

namespace Sample
{
    [Experimental("CUSTOM001")]
    public partial class BindingValue
    {
        public BindingValue(IConfigurationSection section)
        {
        }
    }

    public partial class TestClient
    {
#pragma warning disable CUSTOM001
        public TestClient(BindingValue value, string stable)
        {
        }
#pragma warning restore CUSTOM001
    }

    public partial class TestClientOptions
    {
#pragma warning disable CUSTOM001
        public BindingValue Value { get; set; }
#pragma warning restore CUSTOM001

        public string Stable { get; set; }
    }
}
