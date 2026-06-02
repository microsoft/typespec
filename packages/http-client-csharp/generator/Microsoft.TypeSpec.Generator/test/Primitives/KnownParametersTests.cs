// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Primitives
{
    internal class KnownParametersTests
    {
        public KnownParametersTests()
        {
            MockHelpers.LoadMockGenerator();
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
