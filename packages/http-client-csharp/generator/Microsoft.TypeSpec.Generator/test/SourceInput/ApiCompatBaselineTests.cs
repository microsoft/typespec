// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.SourceInput
{
    public class ApiCompatBaselineTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void EmptyBaselineSuppressesNothing()
        {
            var baseline = ApiCompatBaseline.Empty;

            Assert.IsTrue(baseline.IsEmpty);
            Assert.IsFalse(baseline.IsTypeSuppressed("Some.Type"));
            Assert.IsFalse(baseline.IsMemberSuppressed("Some.Type", "Member", 0));
        }

        [Test]
        public void ParsesTypesMustExist()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            Assert.IsTrue(baseline.IsTypeSuppressed("Azure.AI.Projects.Agents.ProjectsAgentProtocol"));
            Assert.IsFalse(baseline.IsTypeSuppressed("Azure.AI.Projects.Agents.SomethingElse"));
        }

        [Test]
        public void TypeSuppressionImpliesAllMembersSuppressed()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            Assert.IsTrue(baseline.IsMemberSuppressed("Azure.AI.Projects.Agents.ProjectsAgentProtocol", "AnyMember", 3));
        }

        [Test]
        public void ParsesMembersMustExistMethod()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            Assert.IsTrue(baseline.IsMemberSuppressed(
                "Azure.AI.Projects.Agents.ProjectsAgentsModelFactory",
                "ProtocolVersionRecord",
                2));
            // Different arity should not match.
            Assert.IsFalse(baseline.IsMemberSuppressed(
                "Azure.AI.Projects.Agents.ProjectsAgentsModelFactory",
                "ProtocolVersionRecord",
                1));
            // Different declaring type should not match.
            Assert.IsFalse(baseline.IsMemberSuppressed(
                "Azure.AI.Projects.Agents.OtherFactory",
                "ProtocolVersionRecord",
                2));
        }

        [Test]
        public void ParsesParameterlessMember()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.Foo", "Reset", 0));
        }

        [Test]
        public void ParsesConstructor()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.Foo", ".ctor", 2));
        }

        [Test]
        public void ParsesPropertyAccessorOntoOwner()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.Foo", "Kind", 0));
            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.Foo", "Kind", 1));
        }

        [Test]
        public void CountsGenericParametersAsSingleArgument()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.Foo", "Configure", 2));
        }

        [Test]
        public void ParsesMembersMustExistField()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // A removed field/enum member has no parameter list; it is recorded with arity 0.
            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.Foo", "LegacyField", 0));
        }

        [Test]
        public void ParsesEnumValuesMustMatch()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // An accepted enum value difference suppresses back-compat handling for that member.
            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.CapacityLevel", "FiftyThousand", 0));
            // A different member on the same enum must not match.
            Assert.IsFalse(baseline.IsMemberSuppressed("Ns.CapacityLevel", "OneHundred", 0));
        }

        [Test]
        public void IgnoresUnknownRulesAndMalformedLines()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile();

            Assert.IsTrue(baseline.IsEmpty);
        }

        [Test]
        public void IsMethodRemovalSuppressedDistinguishesOverloadsByParameterType()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // The baseline accepts removal of Get(string). Only that overload is suppressed; a Get(int)
            // overload with the same arity must NOT be treated as suppressed.
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed("Ns.Overloads", "Get", [new CSharpType(typeof(string))]));
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Overloads", "Get", [new CSharpType(typeof(int))]));

            // A different declaring type or member name must not match.
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Other", "Get", [new CSharpType(typeof(string))]));
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Overloads", "Set", [new CSharpType(typeof(string))]));
        }

        [Test]
        public void IsMethodRemovalSuppressedMatchesGenericParameterTypes()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // Ns.Foo.Configure(IDictionary<string, int>, string) is suppressed; the query builds the same
            // canonical signature from CSharpType parameters (including nested generic arguments).
            var dictionary = new CSharpType(typeof(IDictionary<,>), new CSharpType(typeof(string)), new CSharpType(typeof(int)));
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed(
                "Ns.Foo",
                "Configure",
                [dictionary, new CSharpType(typeof(string))]));

            // Same arity but different generic argument types must not match.
            var wrongDictionary = new CSharpType(typeof(IDictionary<,>), new CSharpType(typeof(string)), new CSharpType(typeof(string)));
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed(
                "Ns.Foo",
                "Configure",
                [wrongDictionary, new CSharpType(typeof(string))]));
        }

        [Test]
        public void IsMethodRemovalSuppressedHonorsTypeSuppression()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // The whole type is suppressed via TypesMustExist, so any method on it is suppressed
            // regardless of parameter types.
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed(
                "Azure.AI.Projects.Agents.ProjectsAgentProtocol",
                "AnyMethod",
                [new CSharpType(typeof(int))]));
        }

        [Test]
        public void IsMethodRemovalSuppressedMatchesNullableValueTypeParameter()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // Ns.Types.WithNullable(System.Nullable<System.Int32>) is suppressed. A nullable value type
            // is rendered as System.Nullable<T> on both sides.
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithNullable", [new CSharpType(typeof(int?))]));

            // The non-nullable int overload is a different signature and must not match.
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithNullable", [new CSharpType(typeof(int))]));
        }

        [Test]
        public void IsMethodRemovalSuppressedMatchesArrayParameter()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // Ns.Types.WithArray(System.String[]) is suppressed.
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithArray", [new CSharpType(typeof(string[]))]));

            // A non-array string parameter is a different signature.
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithArray", [new CSharpType(typeof(string))]));

            // An array of a different element type must not match.
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithArray", [new CSharpType(typeof(int[]))]));
        }

        [Test]
        public void IsMethodRemovalSuppressedMatchesGenericListParameter()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // Ns.Types.WithList(System.Collections.Generic.List<System.String>) is suppressed.
            var listOfString = new CSharpType(typeof(List<>), new CSharpType(typeof(string)));
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithList", [listOfString]));

            // The same generic definition with a different argument type must not match.
            var listOfInt = new CSharpType(typeof(List<>), new CSharpType(typeof(int)));
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithList", [listOfInt]));
        }

        [Test]
        public void IsMethodRemovalSuppressedMatchesNestedGenericParameter()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // Ns.Types.WithNestedGeneric(IList<IDictionary<string, int>>) is suppressed; nested generic
            // arguments are rendered recursively on both sides.
            var nested = new CSharpType(
                typeof(IList<>),
                new CSharpType(typeof(IDictionary<,>), new CSharpType(typeof(string)), new CSharpType(typeof(int))));
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithNestedGeneric", [nested]));

            // A difference in the innermost argument type must not match.
            var wrongNested = new CSharpType(
                typeof(IList<>),
                new CSharpType(typeof(IDictionary<,>), new CSharpType(typeof(string)), new CSharpType(typeof(string))));
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithNestedGeneric", [wrongNested]));
        }

        [Test]
        public void IsMethodRemovalSuppressedMatchesMultipleParametersInOrder()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // Ns.Types.WithMany(int, string, bool) is suppressed.
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed(
                "Ns.Types",
                "WithMany",
                [new CSharpType(typeof(int)), new CSharpType(typeof(string)), new CSharpType(typeof(bool))]));

            // The same types in a different order are a different signature.
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed(
                "Ns.Types",
                "WithMany",
                [new CSharpType(typeof(string)), new CSharpType(typeof(int)), new CSharpType(typeof(bool))]));

            // A different parameter count must not match.
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed(
                "Ns.Types",
                "WithMany",
                [new CSharpType(typeof(int)), new CSharpType(typeof(string))]));
        }

        [Test]
        public void IsMethodRemovalSuppressedMatchesParameterlessOverload()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // Ns.Foo.Reset() has no parameters; the canonical signature is empty on both sides.
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed("Ns.Foo", "Reset", []));

            // The parameterless overload must not match an overload that takes an argument.
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Foo", "Reset", [new CSharpType(typeof(int))]));
        }

        [Test]
        public void IsMethodRemovalSuppressedMatchesEnumParameter()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // Ns.Types.WithEnum(Sample.Models.MyKind) is suppressed. The enum's output type is produced
            // by the TypeFactory from the input enum and renders as its fully-qualified name.
            var kindInput = InputFactory.Int32Enum("myKind", [("One", 1), ("Two", 2)]);
            var kind = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(kindInput);
            Assert.IsNotNull(kind);
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithEnum", [kind!]));

            // A different (framework) type must not match.
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithEnum", [new CSharpType(typeof(int))]));
        }

        [Test]
        public void IsMethodRemovalSuppressedMatchesNullableEnumParameter()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // Ns.Types.WithNullableEnum(System.Nullable<Sample.Models.MyKind>) is suppressed. A nullable
            // enum renders as System.Nullable<Sample.Models.MyKind>.
            var kindInput = InputFactory.Int32Enum("myKind", [("One", 1), ("Two", 2)]);
            var nullableKind = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(new InputNullableType(kindInput));
            Assert.IsNotNull(nullableKind);
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithNullableEnum", [nullableKind!]));

            // The non-nullable enum overload is a different signature.
            var kind = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(kindInput);
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithNullableEnum", [kind!]));
        }

        [Test]
        public void IsMethodRemovalSuppressedMatchesModelParameter()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // Ns.Types.WithModel(Sample.Models.MyModel) is suppressed. The model's output type is produced
            // by the TypeFactory and renders as its fully-qualified name.
            var model = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(InputFactory.Model("myModel"));
            Assert.IsNotNull(model);
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithModel", [model!]));

            // A different model type must not match.
            var otherModel = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(InputFactory.Model("otherModel"));
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithModel", [otherModel!]));
        }

        [Test]
        public void IsMethodRemovalSuppressedMatchesDictionaryWithModelValue()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "Baseline");

            // Ns.Types.WithDictionary(Dictionary<string, Sample.Models.MyModel>) is suppressed. The model
            // appears as a generic argument and is rendered recursively.
            var model = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(InputFactory.Model("myModel"));
            Assert.IsNotNull(model);
            var dictionaryOfModel = new CSharpType(typeof(Dictionary<,>), new CSharpType(typeof(string)), model!);
            Assert.IsTrue(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithDictionary", [dictionaryOfModel]));

            // A dictionary with a different value type must not match.
            var dictionaryOfInt = new CSharpType(typeof(Dictionary<,>), new CSharpType(typeof(string)), new CSharpType(typeof(int)));
            Assert.IsFalse(baseline.IsMethodRemovalSuppressed("Ns.Types", "WithDictionary", [dictionaryOfInt]));
        }

        [Test]
        public void ReferencesSuppressedTypeMatchesDirectType()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "SuppressedString");

            Assert.IsTrue(baseline.ReferencesSuppressedType(new CSharpType(typeof(string))));
            Assert.IsFalse(baseline.ReferencesSuppressedType(new CSharpType(typeof(int))));
        }

        [Test]
        public void ReferencesSuppressedTypeMatchesNestedGenericArgument()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile(method: "SuppressedString");

            // IList<string> -- the suppressed type is nested as a generic argument.
            var listOfString = new CSharpType(typeof(IList<>), new CSharpType(typeof(string)));
            Assert.IsTrue(baseline.ReferencesSuppressedType(listOfString));

            var listOfInt = new CSharpType(typeof(IList<>), new CSharpType(typeof(int)));
            Assert.IsFalse(baseline.ReferencesSuppressedType(listOfInt));
        }

        [Test]
        public void ReferencesSuppressedTypeReturnsFalseForNullOrEmptyBaseline()
        {
            Assert.IsFalse(ApiCompatBaseline.Empty.ReferencesSuppressedType(new CSharpType(typeof(string))));
            Assert.IsFalse(ApiCompatBaseline.Empty.ReferencesSuppressedType(null));
        }
    }
}
