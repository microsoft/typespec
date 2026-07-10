// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.SourceInput
{
    public class ApiCompatBaselineTests
    {
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
