// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class ConstructorProviderTests
    {
        [Test]
        public void ValidateScope()
        {
            MockHelpers.LoadMockGenerator();

            List<ParameterProvider> parameters = new List<ParameterProvider>
            {
                new ParameterProvider("intParam", $"intParam", typeof(int)),
                new ParameterProvider("stringParam", $"stringParam", typeof(string))
            };

            ConstructorProvider constructorProvider = new ConstructorProvider(
                new ConstructorSignature(
                    typeof(ConstructorProviderTests),
                    $"TestClass",
                    MethodSignatureModifiers.Public,
                    parameters,
                    Initializer: new ConstructorInitializer(false, parameters)),
                ThrowExpression(Null),
                new TestTypeProvider(),
                new XmlDocProvider());

            using var codeWriter = new CodeWriter();
            codeWriter.WriteConstructor(constructorProvider);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeWriter.ToString(false));
        }
    }
}
