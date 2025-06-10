// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using NuGet.Configuration;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public class TestNugetSettingSection : SettingSection
    {
        public TestNugetSettingSection(string name, IReadOnlyDictionary<string, string> attributes, IEnumerable<SettingItem> children)
            : base(name, attributes, children)
        {
        }

        public TestNugetSettingSection(string name, params SettingItem[] children)
            : base(name, attributes: null, children: new HashSet<SettingItem>(children))
        {
        }

        public override SettingBase Clone()
        {
            throw new NotImplementedException();
        }
    }
}
