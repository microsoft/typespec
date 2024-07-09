// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Primitives;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.OutputTypes
{
    internal class ScmKnownParametersTests
    {
        [OneTimeSetUp]
        public void OneTimeSetup()
        {
            var mockPlugin = new Mock<ClientModelPlugin>(new Mock<GeneratorContext>().Object);
            mockPlugin.Setup(p => p.TypeFactory).Returns(new MockTypeFactory());
            // initialize the singleton instance of the plugin
            _ = mockPlugin.Object;
        }

        [Test]
        public void TestTokenAuth()
        {
            var result = ScmKnownParameters.TokenAuth;
            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Type);
            Assert.IsTrue(result.Type.Equals(new CSharpType(typeof(int))));
        }

        [TestCase]
        public void TestMatchConditionsParameter()
        {
            var result = ScmKnownParameters.MatchConditionsParameter;
            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Type);
            Assert.IsTrue(result.Type.Equals(new CSharpType(typeof(int))));
        }
    }
}
