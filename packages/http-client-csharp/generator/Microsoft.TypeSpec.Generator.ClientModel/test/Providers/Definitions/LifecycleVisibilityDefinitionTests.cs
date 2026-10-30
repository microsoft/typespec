// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions
{
    public class LifecycleVisibilityDefinitionTests
    {
        [Test]
        public void GeneratesInternalFlagsEnum()
        {
            MockHelpers.LoadMockGenerator();
            var file = new TypeProviderWriter(new LifecycleVisibilityDefinition()).Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [TestCase(InputVisibility.None)]
        [TestCase(InputVisibility.Create)]
        [TestCase(InputVisibility.Create | InputVisibility.Update)]
        [TestCase(InputVisibility.Read | InputVisibility.Update)]
        [TestCase(InputVisibility.All)]
        public void UsesNamedFlags(InputVisibility visibility)
        {
            MockHelpers.LoadMockGenerator();
            Assert.AreEqual(Helpers.GetExpectedFromFile(visibility.ToString()).TrimEnd(),
                LifecycleVisibilityDefinition.GetExpression(visibility).ToDisplayString());
        }

        [TestCase(32)]
        [TestCase(-1)]
        public void RejectsUnknownFlags(int visibility)
        {
            MockHelpers.LoadMockGenerator();
            Assert.Throws<ArgumentOutOfRangeException>(() =>
                LifecycleVisibilityDefinition.GetExpression((InputVisibility)visibility));
        }
    }
}
