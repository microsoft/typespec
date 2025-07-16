// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    public class MethodProviderHelpersTests
    {
        [Test]
        public void BuildXmlDocsAddsCorrectExceptions()
        {
            var method = new MethodSignature(
                "Test",
                $"some description",
                MethodSignatureModifiers.Public,
                null,
                $"return description",
                [
                    new ParameterProvider("param1", $"description for param1", typeof(string), validation: ParameterValidationType.AssertNotNullOrEmpty),
                    new ParameterProvider("param2", $"description for param2", typeof(int?), validation: ParameterValidationType.AssertNotNull)
                ]);

            var xmlDocs = MethodProviderHelpers.BuildXmlDocs(method);

            Assert.AreEqual(2, xmlDocs.Exceptions.Count);
            Assert.AreEqual(
                "/// <exception cref=\"global::System.ArgumentNullException\"> <paramref name=\"param1\"/> or <paramref name=\"param2\"/> is null. </exception>\n",
                xmlDocs.Exceptions[0].ToDisplayString());
            Assert.AreEqual(
                "/// <exception cref=\"global::System.ArgumentException\"> <paramref name=\"param1\"/> is an empty string, and was expected to be non-empty. </exception>\n",
                xmlDocs.Exceptions[1].ToDisplayString());
        }
    }
}
