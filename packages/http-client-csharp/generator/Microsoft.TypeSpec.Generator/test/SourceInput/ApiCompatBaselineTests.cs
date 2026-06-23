// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.SourceInput;
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
            var baseline = ApiCompatBaseline.Parse(new[]
            {
                "TypesMustExist : Type 'Azure.AI.Projects.Agents.ProjectsAgentProtocol' does not exist in the implementation but it does exist in the contract.",
            });

            Assert.IsTrue(baseline.IsTypeSuppressed("Azure.AI.Projects.Agents.ProjectsAgentProtocol"));
            Assert.IsFalse(baseline.IsTypeSuppressed("Azure.AI.Projects.Agents.SomethingElse"));
        }

        [Test]
        public void TypeSuppressionImpliesAllMembersSuppressed()
        {
            var baseline = ApiCompatBaseline.Parse(new[]
            {
                "TypesMustExist : Type 'Azure.AI.Projects.Agents.ProjectsAgentProtocol' does not exist in the implementation but it does exist in the contract.",
            });

            Assert.IsTrue(baseline.IsMemberSuppressed("Azure.AI.Projects.Agents.ProjectsAgentProtocol", "AnyMember", 3));
        }

        [Test]
        public void ParsesMembersMustExistMethod()
        {
            var baseline = ApiCompatBaseline.Parse(new[]
            {
                "MembersMustExist : Member 'public Azure.AI.Projects.Agents.ProtocolVersionRecord Azure.AI.Projects.Agents.ProjectsAgentsModelFactory.ProtocolVersionRecord(Azure.AI.Projects.Agents.ProjectsAgentProtocol, System.String)' does not exist in the implementation but it does exist in the contract.",
            });

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
            var baseline = ApiCompatBaseline.Parse(new[]
            {
                "MembersMustExist : Member 'public System.Void Ns.Foo.Reset()' does not exist in the implementation but it does exist in the contract.",
            });

            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.Foo", "Reset", 0));
        }

        [Test]
        public void ParsesConstructor()
        {
            var baseline = ApiCompatBaseline.Parse(new[]
            {
                "MembersMustExist : Member 'public Ns.Foo..ctor(Ns.Kind, System.String)' does not exist in the implementation but it does exist in the contract.",
            });

            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.Foo", ".ctor", 2));
        }

        [Test]
        public void ParsesPropertyAccessorOntoOwner()
        {
            var baseline = ApiCompatBaseline.Parse(new[]
            {
                "MembersMustExist : Member 'public Ns.Kind Ns.Foo.Kind.get()' does not exist in the implementation but it does exist in the contract.",
                "MembersMustExist : Member 'public System.Void Ns.Foo.Kind.set(Ns.Kind)' does not exist in the implementation but it does exist in the contract.",
            });

            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.Foo", "Kind", 0));
            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.Foo", "Kind", 1));
        }

        [Test]
        public void CountsGenericParametersAsSingleArgument()
        {
            var baseline = ApiCompatBaseline.Parse(new[]
            {
                "MembersMustExist : Member 'public System.Void Ns.Foo.Configure(System.Collections.Generic.IDictionary<System.String, System.Int32>, System.String)' does not exist in the implementation but it does exist in the contract.",
            });

            Assert.IsTrue(baseline.IsMemberSuppressed("Ns.Foo", "Configure", 2));
        }

        [Test]
        public void IgnoresUnknownRulesAndMalformedLines()
        {
            var baseline = ApiCompatBaseline.Parse(new[]
            {
                "CannotRemoveAttribute : Attribute 'System.Diagnostics.CodeAnalysis.ExperimentalAttribute' exists on 'Ns.Foo' in the contract but not the implementation.",
                "this line has no colon and should be ignored",
                "",
                "   ",
                "MembersMustExist : Member with no quotes should be ignored",
            });

            Assert.IsTrue(baseline.IsEmpty);
        }

        [Test]
        public void ReferencesSuppressedTypeMatchesDirectType()
        {
            var baseline = ApiCompatBaseline.Parse(new[]
            {
                "TypesMustExist : Type 'System.String' does not exist in the implementation but it does exist in the contract.",
            });

            Assert.IsTrue(baseline.ReferencesSuppressedType(new CSharpType(typeof(string))));
            Assert.IsFalse(baseline.ReferencesSuppressedType(new CSharpType(typeof(int))));
        }

        [Test]
        public void ReferencesSuppressedTypeMatchesNestedGenericArgument()
        {
            var baseline = ApiCompatBaseline.Parse(new[]
            {
                "TypesMustExist : Type 'System.String' does not exist in the implementation but it does exist in the contract.",
            });

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
