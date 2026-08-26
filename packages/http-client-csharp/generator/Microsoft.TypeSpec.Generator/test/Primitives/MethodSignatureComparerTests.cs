// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

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

        // Two optional value-type parameters that differ only by nullability (int vs int?) are distinct under
        // the default comparer but equal under the relaxed comparer, since a caller that omits the parameter
        // can't disambiguate them (CS0121).
        [Test]
        public void OptionalValueTypeParameter_DiffersOnlyByNullability_EqualOnlyUnderRelaxedComparer()
        {
            var intParam = new ParameterProvider("value", $"value", new CSharpType(typeof(int)), defaultValue: Default);
            var nullableIntParam = new ParameterProvider("value", $"value", new CSharpType(typeof(int), isNullable: true), defaultValue: Default);
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static;

            var a = new MethodSignature("Create", null, modifiers, typeof(object), null, [intParam]);
            var b = new MethodSignature("Create", null, modifiers, typeof(object), null, [nullableIntParam]);

            Assert.IsFalse(MethodSignatureBase.SignatureComparer.Equals(a, b));
            Assert.IsTrue(MethodSignatureBase.SignatureComparerIgnoringOptionalValueTypeNullability.Equals(a, b));
        }

        // A value-type nullability difference on a REQUIRED parameter is a genuinely distinct, unambiguous
        // overload and stays distinct even under the relaxed comparer.
        [Test]
        public void RequiredValueTypeParameter_DiffersByNullability_NotEqualUnderEitherComparer()
        {
            var intParam = new ParameterProvider("value", $"value", new CSharpType(typeof(int)));
            var nullableIntParam = new ParameterProvider("value", $"value", new CSharpType(typeof(int), isNullable: true));
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static;

            var a = new MethodSignature("Create", null, modifiers, typeof(object), null, [intParam]);
            var b = new MethodSignature("Create", null, modifiers, typeof(object), null, [nullableIntParam]);

            Assert.IsFalse(MethodSignatureBase.SignatureComparer.Equals(a, b));
            Assert.IsFalse(MethodSignatureBase.SignatureComparerIgnoringOptionalValueTypeNullability.Equals(a, b));
        }

        // The relaxed comparer only loosens optional value-type parameter nullability — it still applies every
        // other signature check, e.g. it keeps distinguishing conversion operators by return type.
        [Test]
        public void RelaxedComparer_StillDistinguishesOperatorsByReturnType()
        {
            var enumType = new CSharpType(typeof(int));
            var valueParam = new ParameterProvider("value", $"value", typeof(string));
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator;

            var nonNullable = new MethodSignature(string.Empty, null, modifiers, enumType, null, [valueParam]);
            var nullable = new MethodSignature(string.Empty, null, modifiers, enumType.WithNullable(true), null, [valueParam]);

            Assert.IsFalse(MethodSignatureBase.SignatureComparerIgnoringOptionalValueTypeNullability.Equals(nonNullable, nullable));
        }
    }
}

