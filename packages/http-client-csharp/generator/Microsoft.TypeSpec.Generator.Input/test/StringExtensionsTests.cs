// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input.Extensions;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class StringExtensionsTests
    {
        // Existing behavior without preserveUnderscores (default)
        [TestCase("Tls_1_0", false, "Tls10")]
        [TestCase("hello_world", false, "HelloWorld")]
        [TestCase("_leading", false, "Leading")]
        [TestCase("trailing_", false, "Trailing")]
        [TestCase("UPPER_CASE", false, "UPPERCASE")]
        [TestCase("simple", false, "Simple")]
        [TestCase("", false, "")]
        [TestCase(null, false, null)]
        // New behavior with preserveUnderscores = true
        [TestCase("Tls_1_0", true, "Tls_1_0")]
        [TestCase("hello_world", true, "Hello_world")]
        [TestCase("_leading", true, "_leading")]
        [TestCase("trailing_", true, "Trailing_")]
        [TestCase("UPPER_CASE", true, "UPPER_CASE")]
        [TestCase("simple", true, "Simple")]
        [TestCase("", true, "")]
        [TestCase(null, true, null)]
        [TestCase("TLS_1_0", true, "TLS_1_0")]
        [TestCase("foo__bar", true, "Foo__bar")]
        public void TestToIdentifierNamePreserveUnderscores(string name, bool preserveUnderscores, string expected)
        {
            var result = name.ToIdentifierName(preserveUnderscores: preserveUnderscores);
            Assert.AreEqual(expected, result);
        }

        // Existing behavior of ToVariableName without preserveUnderscores
        [TestCase("HelloWorld", false, "helloWorld")]
        [TestCase("Tls_1_0", false, "tls10")]
        [TestCase("UPPER_CASE", false, "upperCASE")]
        // New behavior with preserveUnderscores = true
        [TestCase("HelloWorld", true, "helloWorld")]
        [TestCase("Tls_1_0", true, "tls_1_0")]
        [TestCase("UPPER_CASE", true, "uppeR_CASE")]
        public void TestToVariableNamePreserveUnderscores(string name, bool preserveUnderscores, string expected)
        {
            var result = name.ToVariableName(preserveUnderscores: preserveUnderscores);
            Assert.AreEqual(expected, result);
        }
    }
}
