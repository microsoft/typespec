// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class ConstructorProviderTests
    {
        [Test]
        public void ValidateScope()
        {
            MockHelpers.LoadMockPlugin();

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
