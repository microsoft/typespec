// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class MethodSignatureHelperTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void ContainsSameParameters_SameParametersInSameOrder_ReturnsTrue()
        {
            var signature1 = CreateMethodSignature("Method1",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)),
                new ParameterProvider("param3", $"", typeof(bool)));

            var signature2 = CreateMethodSignature("Method2",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)),
                new ParameterProvider("param3", $"", typeof(bool)));

            Assert.IsTrue(MethodSignatureHelper.ContainsSameParameters(signature1, signature2));
        }

        [Test]
        public void ContainsSameParameters_SameParametersInDifferentOrder_ReturnsTrue()
        {
            var signature1 = CreateMethodSignature("Method1",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)),
                new ParameterProvider("param3", $"", typeof(bool)));

            var signature2 = CreateMethodSignature("Method2",
                new ParameterProvider("param3", $"", typeof(bool)),
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)));

            Assert.IsTrue(MethodSignatureHelper.ContainsSameParameters(signature1, signature2));
        }

        [Test]
        public void ContainsSameParameters_DifferentParameterCounts_ReturnsFalse()
        {
            var signature1 = CreateMethodSignature("Method1",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)));

            var signature2 = CreateMethodSignature("Method2",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)),
                new ParameterProvider("param3", $"", typeof(bool)));

            Assert.IsFalse(MethodSignatureHelper.ContainsSameParameters(signature1, signature2));
        }

        [Test]
        public void ContainsSameParameters_DifferentParameterTypes_ReturnsFalse()
        {
            var signature1 = CreateMethodSignature("Method1",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)));

            var signature2 = CreateMethodSignature("Method2",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(double)));

            Assert.IsFalse(MethodSignatureHelper.ContainsSameParameters(signature1, signature2));
        }

        [Test]
        public void ContainsSameParameters_DifferentParameterNames_ReturnsFalse()
        {
            var signature1 = CreateMethodSignature("Method1",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)));

            var signature2 = CreateMethodSignature("Method2",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("differentName", $"", typeof(int)));

            Assert.IsFalse(MethodSignatureHelper.ContainsSameParameters(signature1, signature2));
        }

        [Test]
        public void ContainsSameParameters_EmptyParameters_ReturnsTrue()
        {
            var signature1 = CreateMethodSignature("Method1");
            var signature2 = CreateMethodSignature("Method2");

            Assert.IsTrue(MethodSignatureHelper.ContainsSameParameters(signature1, signature2));
        }

        [Test]
        public void ContainsSameParameters_WithAttributes_SameName_ReturnsTrue()
        {
            var attribute = new AttributeStatement(typeof(ObsoleteAttribute));
            var signature1 = CreateMethodSignature("Method1",
                new ParameterProvider("param1", $"", typeof(string), attributes: [attribute]));

            var signature2 = CreateMethodSignature("Method2",
                new ParameterProvider("param1", $"", typeof(string), attributes: [attribute]));

            Assert.IsTrue(MethodSignatureHelper.ContainsSameParameters(signature1, signature2));
        }

        [Test]
        public void HaveSameParametersInSameOrder_SameOrder_ReturnsTrue()
        {
            var signature1 = CreateMethodSignature("Method1",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)),
                new ParameterProvider("param3", $"", typeof(bool)));

            var signature2 = CreateMethodSignature("Method2",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)),
                new ParameterProvider("param3", $"", typeof(bool)));

            Assert.IsTrue(MethodSignatureHelper.HaveSameParametersInSameOrder(signature1, signature2));
        }

        [Test]
        public void HaveSameParametersInSameOrder_DifferentOrder_ReturnsFalse()
        {
            var signature1 = CreateMethodSignature("Method1",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)),
                new ParameterProvider("param3", $"", typeof(bool)));

            var signature2 = CreateMethodSignature("Method2",
                new ParameterProvider("param2", $"", typeof(int)),
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param3", $"", typeof(bool)));

            Assert.IsFalse(MethodSignatureHelper.HaveSameParametersInSameOrder(signature1, signature2));
        }

        [Test]
        public void HaveSameParametersInSameOrder_DifferentCounts_ReturnsFalse()
        {
            var signature1 = CreateMethodSignature("Method1",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)));

            var signature2 = CreateMethodSignature("Method2",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)),
                new ParameterProvider("param3", $"", typeof(bool)));

            Assert.IsFalse(MethodSignatureHelper.HaveSameParametersInSameOrder(signature1, signature2));
        }

        [Test]
        public void HaveSameParametersInSameOrder_DifferentNamesButSameTypes_ReturnsFalse()
        {
            var signature1 = CreateMethodSignature("Method1",
                new ParameterProvider("param1", $"", typeof(string)),
                new ParameterProvider("param2", $"", typeof(int)));

            var signature2 = CreateMethodSignature("Method2",
                new ParameterProvider("differentName1", $"", typeof(string)),
                new ParameterProvider("differentName2", $"", typeof(int)));

            Assert.IsFalse(MethodSignatureHelper.HaveSameParametersInSameOrder(signature1, signature2));
        }

        [Test]
        public void HaveSameParametersInSameOrder_EmptyParameters_ReturnsTrue()
        {
            var signature1 = CreateMethodSignature("Method1");
            var signature2 = CreateMethodSignature("Method2");

            Assert.IsTrue(MethodSignatureHelper.HaveSameParametersInSameOrder(signature1, signature2));
        }

        [Test]
        public void HaveSameParametersInSameOrder_CaseInsensitiveNames_ReturnsTrue()
        {
            var signature1 = CreateMethodSignature("Method1",
                new ParameterProvider("ParamOne", $"", typeof(string)),
                new ParameterProvider("ParamTwo", $"", typeof(int)));

            var signature2 = CreateMethodSignature("Method2",
                new ParameterProvider("paramOne", $"", typeof(string)),
                new ParameterProvider("paramTwo", $"", typeof(int)));

            Assert.IsTrue(MethodSignatureHelper.HaveSameParametersInSameOrder(signature1, signature2));
        }

        [Test]
        public void BuildBackCompatMethodSignature_HideMethodFalse_PreservesDefaultValues()
        {
            var originalSignature = CreateMethodSignature("TestMethod",
                new ParameterProvider("param1", $"", typeof(string), defaultValue: Literal("default")),
                new ParameterProvider("param2", $"", typeof(int), defaultValue: Literal(42)));

            var backCompatSignature = MethodSignatureHelper.BuildBackCompatMethodSignature(originalSignature, hideMethod: false);

            Assert.AreEqual(2, backCompatSignature.Parameters.Count);
            Assert.IsNotNull(backCompatSignature.Parameters[0].DefaultValue);
            Assert.IsNotNull(backCompatSignature.Parameters[1].DefaultValue);
            Assert.AreEqual(0, backCompatSignature.Attributes.Count);
        }

        [Test]
        public void BuildBackCompatMethodSignature_HideMethodTrue_RemovesDefaultValues()
        {
            var originalSignature = CreateMethodSignature("TestMethod",
                new ParameterProvider("param1", $"", typeof(string), defaultValue: Literal("default")),
                new ParameterProvider("param2", $"", typeof(int), defaultValue: Literal(42)));

            var backCompatSignature = MethodSignatureHelper.BuildBackCompatMethodSignature(originalSignature, hideMethod: true);

            Assert.AreEqual(2, backCompatSignature.Parameters.Count);
            Assert.IsNull(backCompatSignature.Parameters[0].DefaultValue);
            Assert.IsNull(backCompatSignature.Parameters[1].DefaultValue);
        }

        [Test]
        public void BuildBackCompatMethodSignature_HideMethodTrue_AddsEditorBrowsableAttribute()
        {
            var originalSignature = CreateMethodSignature("TestMethod",
                new ParameterProvider("param1", $"", typeof(string)));

            var backCompatSignature = MethodSignatureHelper.BuildBackCompatMethodSignature(originalSignature, hideMethod: true);

            Assert.AreEqual(1, backCompatSignature.Attributes.Count);
            var attribute = backCompatSignature.Attributes[0];
            var attributeString = attribute.ToDisplayString();
            StringAssert.Contains("EditorBrowsableAttribute", attributeString);
            StringAssert.Contains("Never", attributeString);
        }

        [Test]
        public void BuildBackCompatMethodSignature_HideMethodFalse_DoesNotAddEditorBrowsableAttribute()
        {
            var originalSignature = CreateMethodSignature("TestMethod",
                new ParameterProvider("param1", $"", typeof(string)));

            var backCompatSignature = MethodSignatureHelper.BuildBackCompatMethodSignature(originalSignature, hideMethod: false);

            Assert.AreEqual(0, backCompatSignature.Attributes.Count);
        }

        [Test]
        public void BuildBackCompatMethodSignature_PreservesExistingAttributes()
        {
            var existingAttribute = new AttributeStatement(typeof(ObsoleteAttribute), Literal("Obsolete message"));
            var originalSignature = CreateMethodSignature("TestMethod",
                attributes: [existingAttribute],
                parameters: [new ParameterProvider("param1", $"", typeof(string))]);

            var backCompatSignature = MethodSignatureHelper.BuildBackCompatMethodSignature(originalSignature, hideMethod: true);

            // Should have existing attribute plus EditorBrowsable
            Assert.AreEqual(2, backCompatSignature.Attributes.Count);
        }

        [Test]
        public void BuildBackCompatMethodSignature_PreservesNameAndModifiers()
        {
            var originalSignature = CreateMethodSignature(
                "TestMethod",
                modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                returnType: typeof(string),
                parameters: [new ParameterProvider("param1", $"", typeof(int))]);

            var backCompatSignature = MethodSignatureHelper.BuildBackCompatMethodSignature(originalSignature, hideMethod: false);

            Assert.AreEqual("TestMethod", backCompatSignature.Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual, backCompatSignature.Modifiers);
            Assert.AreEqual(typeof(string), backCompatSignature.ReturnType?.FrameworkType);
        }

        [Test]
        public void BuildBackCompatMethodSignature_HideMethodTrue_WithMultipleParameters_RemovesAllDefaults()
        {
            var originalSignature = CreateMethodSignature("TestMethod",
                new ParameterProvider("param1", $"", typeof(string), defaultValue: Literal("default1")),
                new ParameterProvider("param2", $"", typeof(int), defaultValue: Literal(1)),
                new ParameterProvider("param3", $"", typeof(bool), defaultValue: Literal(true)),
                new ParameterProvider("param4", $"", typeof(double)));

            var backCompatSignature = MethodSignatureHelper.BuildBackCompatMethodSignature(originalSignature, hideMethod: true);

            Assert.AreEqual(4, backCompatSignature.Parameters.Count);
            foreach (var param in backCompatSignature.Parameters)
            {
                Assert.IsNull(param.DefaultValue);
            }
        }

        private static MethodSignature CreateMethodSignature(
            string name,
            params ParameterProvider[] parameters)
        {
            return new MethodSignature(
                name,
                $"",
                MethodSignatureModifiers.Public,
                null,
                $"",
                parameters);
        }

        private static MethodSignature CreateMethodSignature(
            string name,
            MethodSignatureModifiers modifiers = MethodSignatureModifiers.Public,
            Type? returnType = null,
            IReadOnlyList<AttributeStatement>? attributes = null,
            params ParameterProvider[] parameters)
        {
            return new MethodSignature(
                name,
                $"",
                modifiers,
                returnType != null ? new CSharpType(returnType) : null,
                $"",
                parameters,
                Attributes: attributes ?? []);
        }
    }
}
