// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions
{
    public class BinaryContentHelperDefinitionTests
    {
        [Test]
        public void FromObjectMethodIsCorrectlyDefined()
        {
            MockHelpers.LoadMockGenerator();

            var binaryContentHelper = new BinaryContentHelperDefinition();
            Assert.IsNotNull(binaryContentHelper.Methods);
            var fromObjectMethod = binaryContentHelper.Methods.Single(m => m.Signature.Name == "FromObject"
                && m.Signature.Parameters[0].Type.Equals(typeof(object)));
            Assert.IsNotNull(fromObjectMethod);
            Assert.IsNotNull(fromObjectMethod.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), fromObjectMethod.BodyStatements!.ToDisplayString());
        }

        [Test]
        public void FromObjectBinaryDataMethodIsCorrectlyDefined()
        {
            MockHelpers.LoadMockGenerator();

            var binaryContentHelper = new BinaryContentHelperDefinition();
            Assert.IsNotNull(binaryContentHelper.Methods);
            var fromObjectMethod = binaryContentHelper.Methods.Single(m => m.Signature.Name == "FromObject"
                                                                           && m.Signature.Parameters[0].Type.Equals(typeof(BinaryData)));
            Assert.IsNotNull(fromObjectMethod);
            Assert.IsNotNull(fromObjectMethod.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), fromObjectMethod.BodyStatements!.ToDisplayString());
        }
    }
}
