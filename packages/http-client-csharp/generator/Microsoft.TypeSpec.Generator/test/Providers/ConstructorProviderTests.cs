// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class ConstructorProviderTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void ValidateScope()
        {
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

        [Test]
        public void TestAttributes()
        {
            List<ParameterProvider> parameters = new List<ParameterProvider>
            {
                new ParameterProvider("intParam", $"intParam", typeof(int)),
                new ParameterProvider("stringParam", $"stringParam", typeof(string))
            };
            var attributes = new List<AttributeStatement>
            {
                 new(typeof(ObsoleteAttribute)),
                 new(typeof(ObsoleteAttribute), Literal("This is obsolete")),
                 new(typeof(ExperimentalAttribute), Literal("001"))
            };
            ConstructorProvider constructor = new ConstructorProvider(
              new ConstructorSignature(
                  typeof(ConstructorProviderTests),
                  $"TestClass",
                  MethodSignatureModifiers.Public,
                  parameters,
                  Initializer: new ConstructorInitializer(false, parameters)),
              ThrowExpression(Null),
              new TestTypeProvider(),
              new XmlDocProvider(),
              attributes: attributes);

            Assert.IsNotNull(constructor.Attributes);
            Assert.AreEqual(attributes.Count, constructor.Attributes.Count);
            for (int i = 0; i < attributes.Count; i++)
            {
                Assert.AreEqual(attributes[i].Type, constructor.Attributes[i].Type);
                Assert.IsTrue(constructor.Attributes[i].Arguments.SequenceEqual(attributes[i].Arguments));
            }

            // validate the attributes are written correctly
            using var writer = new CodeWriter();
            writer.WriteConstructor(constructor);
            var expectedString = "[global::System.ObsoleteAttribute]\n" +
                "[global::System.ObsoleteAttribute(\"This is obsolete\")]\n" +
                "[global::System.Diagnostics.CodeAnalysis.ExperimentalAttribute(\"001\")]\n" +
                "public ConstructorProviderTests(";
            var result = writer.ToString(false);
            Assert.IsTrue(result.StartsWith(expectedString));
        }
    }
}
