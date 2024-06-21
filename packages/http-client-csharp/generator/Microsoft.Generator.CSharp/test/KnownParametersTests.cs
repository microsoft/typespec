// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
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
        public void TestCancellationToken()
        {
            var result = KnownParameters.CancellationTokenParameter;
            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Type);
            Assert.IsTrue(result.Type.Equals(new CSharpType(typeof(CancellationToken))));
        }

        [TestCase]
        public void TestCancellationTokenEnumerator()
        {
            var result = KnownParameters.EnumeratorCancellationTokenParameter;
            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Type);
            Assert.IsTrue(result.Type.Equals(new CSharpType(typeof(CancellationToken))));
            Assert.IsTrue(result.Attributes.Any(statement => statement.Type.FrameworkType == typeof(EnumeratorCancellationAttribute)));
        }
    }
}
