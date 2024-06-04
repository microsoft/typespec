// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class KnownParametersTests
    {
        private readonly string _mocksFolder = "Mocks";

        [OneTimeSetUp]
        public void OneTimeSetup()
        {
            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            // initialize the singleton instance of the plugin
            _ = new MockCodeModelPlugin(new GeneratorContext(Configuration.Load(configFilePath)));
        }


        [Test]
        public void TestTokenAuth()
        {
            var result = KnownParameters.TokenAuth;
            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Type);
            Assert.IsTrue(result.Type.Equals(new CSharpType(typeof(int))));
        }

        [TestCase]
        public void TestMatchConditionsParameter()
        {
            var result = KnownParameters.MatchConditionsParameter;
            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Type);
            Assert.IsTrue(result.Type.Equals(new CSharpType(typeof(int))));
        }

        [TestCase]
        public void TestRequestConditionsParameter()
        {
            var result = KnownParameters.RequestConditionsParameter;
            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Type);
            Assert.IsTrue(result.Type.Equals(new CSharpType(typeof(int))));
        }
    }
}
