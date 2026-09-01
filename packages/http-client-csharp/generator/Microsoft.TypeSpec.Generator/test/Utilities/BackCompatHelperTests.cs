// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Utilities;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    public class BackCompatHelperTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        // Detection: a nullable value-type parameter that became non-nullable qualifies.
        [Test]
        public void HasRelaxedNullableValueTypeParametersOnlyMatchesNullableToNonNullableValueType()
        {
            var typeFactory = CodeModelGenerator.Instance.TypeFactory;
            ParameterProvider Param(string name, InputType type) => typeFactory.CreateParameter(InputFactory.QueryParameter(name, type, isRequired: true))!;
            MethodSignature Sig(params ParameterProvider[] parameters) => new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", parameters);

            var previous = Sig(Param("value", new InputNullableType(InputPrimitiveType.Int32)), Param("flag", InputPrimitiveType.Boolean));
            var current = Sig(Param("value", InputPrimitiveType.Int32), Param("flag", InputPrimitiveType.Boolean));

            Assert.IsTrue(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(previous, current));
        }

        // Detection guards: only the nullable-value-type -> non-nullable direction on the same underlying
        // type qualifies. Reference-type nullability, the widening direction, a different underlying type,
        // and an unchanged signature must all be rejected.
        [Test]
        public void HasRelaxedNullableValueTypeParametersOnlyRejectsOtherChanges()
        {
            var typeFactory = CodeModelGenerator.Instance.TypeFactory;
            MethodSignature Sig(InputType parameterType) => new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"",
                [typeFactory.CreateParameter(InputFactory.QueryParameter("value", parameterType, isRequired: true))!]);

            // Reference-type nullability cannot form distinct overloads (string? and string collide).
            Assert.IsFalse(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(
                Sig(new InputNullableType(InputPrimitiveType.String)), Sig(InputPrimitiveType.String)));

            // The widening direction (non-nullable -> nullable) is not handled.
            Assert.IsFalse(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(
                Sig(InputPrimitiveType.Int32), Sig(new InputNullableType(InputPrimitiveType.Int32))));

            // A different underlying value type is not a nullability-only change.
            Assert.IsFalse(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(
                Sig(new InputNullableType(InputPrimitiveType.Int32)), Sig(InputPrimitiveType.Int64)));

            // An unchanged signature has no nullability change.
            Assert.IsFalse(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(
                Sig(InputPrimitiveType.Int32), Sig(InputPrimitiveType.Int32)));

            // A ref/out parameter cannot be forwarded through .Value, so a nullability change on one is
            // rejected rather than producing an un-compilable shim (ref int? -> ref int).
            MethodSignature RefSig(CSharpType parameterType) => new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"",
                [new ParameterProvider("value", $"", parameterType, isRef: true)]);
            Assert.IsFalse(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(
                RefSig(new CSharpType(typeof(int), isNullable: true)), RefSig(new CSharpType(typeof(int)))));
        }

        // Detection: a nullable parameter that changed from optional to required (same type) qualifies.
        [Test]
        public void IsSingleNullableParameterOptionalToRequiredMatchesOptionalToRequiredNullable()
        {
            var typeFactory = CodeModelGenerator.Instance.TypeFactory;
            ParameterProvider Opt(string name, InputType type) => typeFactory.CreateParameter(InputFactory.QueryParameter(name, type, isRequired: false))!;
            ParameterProvider Req(string name, InputType type) => typeFactory.CreateParameter(InputFactory.QueryParameter(name, type, isRequired: true))!;
            MethodSignature Sig(params ParameterProvider[] parameters) => new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", parameters);

            var previous = Sig(Opt("value", new InputNullableType(InputPrimitiveType.Int32)), Opt("flag", InputPrimitiveType.Boolean));
            var current = Sig(Req("value", new InputNullableType(InputPrimitiveType.Int32)), Opt("flag", InputPrimitiveType.Boolean));

            Assert.IsTrue(BackCompatHelper.IsSingleNullableParameterOptionalToRequired(previous, current));
        }

        // Detection guards (parameter types are assumed already equal): a non-nullable parameter, an
        // unchanged optionality, and a drop that would be ambiguous must all be rejected.
        [Test]
        public void IsSingleNullableParameterOptionalToRequiredRejectsOtherChanges()
        {
            var typeFactory = CodeModelGenerator.Instance.TypeFactory;
            ParameterProvider Opt(string name, InputType type) => typeFactory.CreateParameter(InputFactory.QueryParameter(name, type, isRequired: false))!;
            ParameterProvider Req(string name, InputType type) => typeFactory.CreateParameter(InputFactory.QueryParameter(name, type, isRequired: true))!;
            MethodSignature Sig(params ParameterProvider[] parameters) => new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", parameters);

            // A non-nullable parameter becoming required is not in scope (only nullable parameters qualify).
            Assert.IsFalse(BackCompatHelper.IsSingleNullableParameterOptionalToRequired(
                Sig(Opt("value", InputPrimitiveType.Int32)), Sig(Req("value", InputPrimitiveType.Int32))));

            // Unchanged optionality has nothing to restore.
            Assert.IsFalse(BackCompatHelper.IsSingleNullableParameterOptionalToRequired(
                Sig(Opt("value", new InputNullableType(InputPrimitiveType.Int32))), Sig(Opt("value", new InputNullableType(InputPrimitiveType.Int32)))));

            // Dropping the parameter would be ambiguous when another parameter shares its underlying type.
            Assert.IsFalse(BackCompatHelper.IsSingleNullableParameterOptionalToRequired(
                Sig(Opt("a", new InputNullableType(InputPrimitiveType.Int32)), Opt("b", new InputNullableType(InputPrimitiveType.Int32))),
                Sig(Req("a", new InputNullableType(InputPrimitiveType.Int32)), Opt("b", new InputNullableType(InputPrimitiveType.Int32)))));
        }
    }
}
