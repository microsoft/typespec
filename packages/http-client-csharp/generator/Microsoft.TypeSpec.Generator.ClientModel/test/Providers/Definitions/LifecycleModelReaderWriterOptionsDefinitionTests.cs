// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions
{
    public class LifecycleModelReaderWriterOptionsDefinitionTests
    {
        [Test]
        public void UsesAnInternalVisibilityEnum()
        {
            MockHelpers.LoadMockGenerator();
            var provider = new LifecycleModelReaderWriterOptionsDefinition();
            var visibilityType = provider.Properties.Single().Type;

            Assert.IsTrue(visibilityType.IsEnum);
            Assert.IsFalse(visibilityType.IsPublic);
            Assert.AreEqual(visibilityType, provider.Constructors.Single().Signature.Parameters[0].Type);
            var isVisible = provider.Methods.Single();
            Assert.AreEqual(visibilityType, isVisible.Signature.Parameters[1].Type);
            Assert.IsTrue(isVisible.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static));
        }
    }
}
