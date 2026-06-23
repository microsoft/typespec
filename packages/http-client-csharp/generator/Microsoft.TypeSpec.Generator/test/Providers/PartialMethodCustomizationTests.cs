// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class PartialMethodCustomizationTests
    {
        // A type whose namespace is empty, mimicking what Roslyn produces for an unresolved
        // (not-yet-generated) type referenced from a customer's partial declaration.
        private static CSharpType UnresolvedType(string name) =>
            new CSharpType(name, string.Empty, isValueType: false, isNullable: false, declaringType: null, args: [], isPublic: true, isStruct: false);

        // A type that carries a proper namespace, mimicking the generator's resolved type.
        private static CSharpType ResolvedType(string name, string ns) =>
            new CSharpType(name, ns, isValueType: false, isNullable: false, declaringType: null, args: [], isPublic: true, isStruct: false);

        [Test]
        public void BuildPartialSignature_UsesGeneratorReturnType()
        {
            var customReturnType = UnresolvedType("MyModel");
            var generatorReturnType = ResolvedType("MyModel", "Sample.Models");

            var customSignature = new MethodSignature(
                "DoStuff",
                $"",
                MethodSignatureModifiers.Public,
                customReturnType,
                $"",
                []);

            var result = PartialMethodCustomization.BuildPartialSignature(
                customSignature,
                [],
                generatorReturnType);

            Assert.IsTrue(result.Modifiers.HasFlag(MethodSignatureModifiers.Partial));
            // The return type should come from the generator (with its namespace), not from the
            // customer's parsed declaration (which has no namespace).
            Assert.AreEqual("Sample.Models", result.ReturnType!.Namespace);
            Assert.AreEqual("MyModel", result.ReturnType.Name);
        }

        [Test]
        public void BuildPartialSignature_FallsBackToCustomReturnTypeWhenNull()
        {
            var customReturnType = ResolvedType("MyModel", "Sample.Models");
            var customSignature = new MethodSignature(
                "DoStuff",
                $"",
                MethodSignatureModifiers.Public,
                customReturnType,
                $"",
                []);

            var result = PartialMethodCustomization.BuildPartialSignature(customSignature, []);

            Assert.AreSame(customReturnType, result.ReturnType);
        }

        [Test]
        public void RenameAndCloneParameters_KeepsGeneratorTypesAndCustomNames()
        {
            // Generator parameter: resolved type + generator name.
            var generatorParam = new ParameterProvider("content", $"", ResolvedType("ExecuteContent", "Sample.Models"));
            // Custom parameter: unresolved type (empty namespace) + customer-chosen name.
            var customParam = new ParameterProvider("body", $"", UnresolvedType("ExecuteContent"));

            IReadOnlyList<ParameterProvider> result = PartialMethodCustomization.RenameAndCloneParameters(
                [generatorParam],
                [customParam],
                removeDefaults: true);

            Assert.AreEqual(1, result.Count);
            // Name comes from the customer's declaration.
            Assert.AreEqual("body", result[0].Name);
            // Type (and its namespace) comes from the generator, not the unresolved custom type.
            Assert.AreEqual("Sample.Models", result[0].Type.Namespace);
            Assert.AreEqual("ExecuteContent", result[0].Type.Name);
        }
    }
}
