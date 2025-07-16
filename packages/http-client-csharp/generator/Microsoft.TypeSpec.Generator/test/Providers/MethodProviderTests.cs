// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class MethodProviderTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void CorrectUsingIsAppliedForImplicitOperatorMethod()
        {
            var enclosingType = new TestTypeProvider();
            var writer = new TypeProviderWriter(enclosingType);
            var file = writer.Write();
            StringAssert.Contains("using System.IO;", file.Content);
        }

        [Test]
        public void ImplicitOperatorMethodSignatureThrowsIfReturnTypeIsNull()
        {
            Assert.Throws<ArgumentNullException>(() => _ = new MethodSignature(
                "TestName",
                $"",
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Static |
                MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator,
                null,
                $"",
                [new ParameterProvider("input", $"", typeof(Stream))]));
        }

        [Test]
        public void ExplicitOperatorMethodSignatureDoesNotThrowIfReturnTypeIsNull()
        {
            // Explicit operator does not require specifying a return type because it is the enclosing type
            Assert.DoesNotThrow(() => _ = new MethodSignature(
                "TestName",
                $"",
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Static |
                MethodSignatureModifiers.Operator,
                null,
                $"",
                [new ParameterProvider("input", $"", typeof(Stream))]));
        }

        [Test]
        public void TestUpdate()
        {
            var typeProvider = new TestTypeProvider();
            var methodProvider = new MethodProvider(
                new MethodSignature("Test", $"", MethodSignatureModifiers.Public, null, $"", []),
                Throw(Null), typeProvider);
            // add the method to the type provider
            typeProvider.Update(methods: [methodProvider]);

            // now update the method and check if the type provider reflects the change
            var attributes = new List<AttributeStatement>
            {
                 new(typeof(ObsoleteAttribute)),
                 new(typeof(ObsoleteAttribute), Literal("This is obsolete")),
                 new(typeof(ExperimentalAttribute), Literal("001"))
            };
            methodProvider.Update(
                new MethodSignature(
                    "Updated",
                    $"",
                    MethodSignatureModifiers.Public,
                    null,
                    $"",
                    [new ParameterProvider("foo", $"Foo description", typeof(int))]),
                attributes: attributes);
            var updatedMethods = typeProvider.CanonicalView.Methods;
            Assert.IsNotNull(updatedMethods);
            Assert.AreEqual(1, updatedMethods!.Count);

            // Validate that the method name is updated
            var updatedMethod = updatedMethods[0];
            Assert.AreEqual("Updated", updatedMethod.Signature.Name);

            // Validate that the parameter description is updated
            var parameter = updatedMethod.Signature.Parameters[0];
            Assert.AreEqual("Foo description", parameter.Description.ToString());
            Assert.IsTrue(parameter.Type.Equals(typeof(int)));

            // Validate that the xml docs are updated
            Assert.IsNotNull(updatedMethod.XmlDocs);
            var xmlDocParamStatement = updatedMethod.XmlDocs!.Parameters[0];
            Assert.IsNotNull(xmlDocParamStatement);
            Assert.AreEqual(parameter, xmlDocParamStatement.Parameter);
            Assert.AreEqual("/// <param name=\"foo\"> Foo description. </param>\n", xmlDocParamStatement.ToDisplayString());

            // Validate that the attributes are updated
            Assert.IsNotNull(updatedMethod.Attributes);
            Assert.AreEqual(attributes.Count, updatedMethod.Attributes.Count);
            for (int i = 0; i < attributes.Count; i++)
            {
                Assert.AreEqual(attributes[i].Type, updatedMethod.Attributes[i].Type);
                Assert.IsTrue(updatedMethod.Attributes[i].Arguments.SequenceEqual(attributes[i].Arguments));
            }

            using var writer = new CodeWriter();
            writer.WriteMethod(updatedMethod);
            var expectedMethodString = "[global::System.ObsoleteAttribute]\n" +
                "[global::System.ObsoleteAttribute(\"This is obsolete\")]\n" +
                "[global::System.Diagnostics.CodeAnalysis.ExperimentalAttribute(\"001\")]\n" +
                "public void Updated(int foo)\n";
            Assert.IsTrue(writer.ToString(false).StartsWith(expectedMethodString));
        }

        [Test]
        public void TestAttributes()
        {
            var attributes = new List<AttributeStatement>
            {
                 new(typeof(ObsoleteAttribute)),
                 new(typeof(ObsoleteAttribute), Literal("This is obsolete")),
                 new(typeof(ExperimentalAttribute), Literal("001"))
            };
            var typeProvider = new TestTypeProvider();
            var method = new MethodProvider(
                new MethodSignature("Test", $"", MethodSignatureModifiers.Public, null, $"", []),
                Throw(Null),
                typeProvider,
                attributes: attributes);

            Assert.IsNotNull(method.Attributes);
            Assert.AreEqual(attributes.Count, method.Attributes.Count);
            for (int i = 0; i < attributes.Count; i++)
            {
                Assert.AreEqual(attributes[i].Type, method.Attributes[i].Type);
                Assert.IsTrue(method.Attributes[i].Arguments.SequenceEqual(attributes[i].Arguments));
            }

            // validate the attributes are written correctly
            using var writer = new CodeWriter();
            writer.WriteMethod(method);
            var expectedMethodString = "[global::System.ObsoleteAttribute]\n" +
                "[global::System.ObsoleteAttribute(\"This is obsolete\")]\n" +
                "[global::System.Diagnostics.CodeAnalysis.ExperimentalAttribute(\"001\")]\n" +
                "public void Test()\n";
            Assert.IsTrue(writer.ToString(false).StartsWith(expectedMethodString));
        }

        private class TestTypeProvider : TypeProvider
        {
            protected override string BuildRelativeFilePath() => $"{Name}.cs";

            protected override string BuildName() => "TestName";

            protected override string BuildNamespace() => "Test";

            public static readonly TypeProvider Empty = new TestTypeProvider();

            protected override MethodProvider[] BuildMethods()
            {
                return [new MethodProvider(
                    new MethodSignature(
                        Name,
                        $"",
                        MethodSignatureModifiers.Public | MethodSignatureModifiers.Static |
                        MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator,
                        new CSharpType(typeof(Stream)),
                        $"",
                        [new ParameterProvider("input", $"", Type, null)]),
                    Throw(Null),
                    this)];
            }

            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public;
        }

    }
}
