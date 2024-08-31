// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace TypeSpec.Generator.ClientModel.Tests.OutputTypes
{
    internal class ScmKnownParametersTests
    {
        [Test]
        public void TestTokenAuth()
        {
            MockHelpers.LoadMockPlugin(tokenCredentialType: () => typeof(int));

            var result = ClientModelPlugin.Instance.TypeFactory.TokenCredentialType();
            Assert.IsNotNull(result);
            Assert.AreEqual(new CSharpType(typeof(int)), result);
        }

        [TestCase]
        public void TestMatchConditionsParameter()
        {
            MockHelpers.LoadMockPlugin(matchConditionsType: () => typeof(int));

            var result = ClientModelPlugin.Instance.TypeFactory.MatchConditionsType();
            Assert.IsNotNull(result);
            Assert.AreEqual(new CSharpType(typeof(int)), result);
        }
    }
}
