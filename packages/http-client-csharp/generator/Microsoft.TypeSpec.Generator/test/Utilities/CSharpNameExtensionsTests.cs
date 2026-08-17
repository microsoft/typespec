// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Utilities;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    public class CSharpNameExtensionsTests
    {
        [TestCase("CallbackUrl", "CallbackUri")]
        [TestCase("Url", "Uri")]
        [TestCase("CallbackUrlValue", "CallbackUrlValue")]
        [TestCase("CallbackUrls", "CallbackUrls")]
        [TestCase("CallbackURL", "CallbackURL")]
        [TestCase(null, null)]
        [TestCase("", "")]
        public void TestNormalizeCSharpUrlSuffix(string name, string expected)
        {
            Assert.AreEqual(expected, name.NormalizeCSharpUrlSuffix());
        }
    }
}
