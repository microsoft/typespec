// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Primitives
{
    internal class MethodSignatureComparerTests
    {
        public MethodSignatureComparerTests()
        {
            MockHelpers.LoadMockGenerator();
        }

        // Validates that a generated `==` operator (Name = "==") matches a customization
        // partial declaration where the Name comes from Roslyn's SymbolDisplay
        // (Name = "operator ==").
        [Test]
        public void EqualityOperator_GeneratedAndCustomization_MatchByNormalizedName()
        {
            var enumType = new CSharpType(typeof(int));
            var leftParam = new ParameterProvider("left", $"left", enumType);
            var rightParam = new ParameterProvider("right", $"right", enumType);
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Operator;

            // What ExtensibleEnumProvider produces for the generated `==` operator.
            var generated = new MethodSignature("==", null, modifiers, typeof(bool), null, [leftParam, rightParam]);

            // What NamedTypeSymbolProvider produces for the customization partial: Roslyn's
            // SymbolDisplay returns "operator ==" for an op_Equality method.
            var customization = new MethodSignature("operator ==", null, modifiers, typeof(bool), null, [leftParam, rightParam]);

            Assert.IsTrue(MethodSignatureBase.SignatureComparer.Equals(generated, customization));
            Assert.IsTrue(MethodSignatureBase.SignatureComparer.Equals(customization, generated));
        }

        // Validates that `==` and `!=` operators with the same signature shape are NOT
        // considered equal (regression guard for the operator-symbol differentiation).
        [Test]
        public void EqualityAndInequalityOperators_AreNotEqual()
        {
            var enumType = new CSharpType(typeof(int));
            var leftParam = new ParameterProvider("left", $"left", enumType);
            var rightParam = new ParameterProvider("right", $"right", enumType);
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Operator;

            var equality = new MethodSignature("==", null, modifiers, typeof(bool), null, [leftParam, rightParam]);
            var inequality = new MethodSignature("!=", null, modifiers, typeof(bool), null, [leftParam, rightParam]);

            Assert.IsFalse(MethodSignatureBase.SignatureComparer.Equals(equality, inequality));
        }

        // Validates that an implicit conversion operator from generated code (Name = "")
        // matches a customization partial (Name = return type name) when modifiers,
        // return type, and parameter types agree.
        [Test]
        public void ImplicitConversionOperator_GeneratedEmptyName_MatchesCustomizationReturnTypeName()
        {
            var enumType = new CSharpType(typeof(int));
            var valueParam = new ParameterProvider("value", $"value", typeof(string));
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator;

            // ExtensibleEnumProvider generates the implicit operator with Name = string.Empty.
            var generated = new MethodSignature(string.Empty, null, modifiers, enumType, null, [valueParam]);

            // NamedTypeSymbolProvider produces the customization partial with Name = return type name.
            var customization = new MethodSignature(enumType.Name, null, modifiers, enumType, null, [valueParam]);

            Assert.IsTrue(MethodSignatureBase.SignatureComparer.Equals(generated, customization));
            Assert.IsTrue(MethodSignatureBase.SignatureComparer.Equals(customization, generated));
        }

        // Implicit and explicit conversion operators with otherwise identical signatures must NOT be equal.
        [Test]
        public void ImplicitAndExplicitConversionOperators_AreNotEqual()
        {
            var enumType = new CSharpType(typeof(int));
            var valueParam = new ParameterProvider("value", $"value", typeof(string));

            var implicitOp = new MethodSignature(
                string.Empty,
                null,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator,
                enumType,
                null,
                [valueParam]);

            var explicitOp = new MethodSignature(
                enumType.Name,
                null,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Operator,
                enumType,
                null,
                [valueParam]);

            Assert.IsFalse(MethodSignatureBase.SignatureComparer.Equals(implicitOp, explicitOp));
        }

        // Conversion operators returning a nullable type and its non-nullable counterpart
        // must NOT be considered equal — `implicit operator T(string)` and
        // `implicit operator T?(string)` are distinct C# operators.
        [Test]
        public void ImplicitConversionOperators_NullableAndNonNullableReturnTypes_AreNotEqual()
        {
            var enumType = new CSharpType(typeof(int));
            var nullableEnumType = enumType.WithNullable(true);
            var valueParam = new ParameterProvider("value", $"value", typeof(string));
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator;

            var nonNullable = new MethodSignature(string.Empty, null, modifiers, enumType, null, [valueParam]);
            var nullable = new MethodSignature(string.Empty, null, modifiers, nullableEnumType, null, [valueParam]);

            Assert.IsFalse(MethodSignatureBase.SignatureComparer.Equals(nonNullable, nullable));
            Assert.IsFalse(MethodSignatureBase.SignatureComparer.Equals(nullable, nonNullable));
        }
    }
}

