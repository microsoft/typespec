// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Tests.Providers.UpgradeFramework;

namespace Sample.Models
{
    public class Derived : NamedTrackedResource
    {
        public Derived(string name) : base(name) { }
    }
}
