// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using NUnit.Framework;
using Scenario = Microsoft.TypeSpec.Generator.Tests.StructuralTypeNameRuleOracleTests.Scenario;
using Violation = Microsoft.TypeSpec.Generator.Tests.StructuralTypeNameRuleOracleTests.Violation;

namespace Microsoft.TypeSpec.Generator.Tests
{
    [NonParallelizable]
    public class StructuralTypeNameRuleEvaluatorTests
    {
        private static readonly Dictionary<string, string> ExpectedSelections = new(StringComparer.Ordinal)
        {
            ["R1_AmbiguousImports"] = "A.Widget",
            ["R1_NearerTypeWinsOverImport"] = "System.DateTimeOffset",
            ["R1_TypeParameterCapturesImportedType"] = "System.DateTimeOffset",
            ["R2_DroppingOwnerSelectsOtherInner"] = "Outer.Inner",
            ["R2_IntermediateOwnerAmbiguityMustNotDisappear"] = "A.Outer.Inner",
            ["R3_NamespaceSegmentCapturedByType"] = "A.B.Widget",
            ["R4_ExistingNamespaceAlias"] = "System.DateTimeOffset",
            ["R4_AliasBindsAnotherType"] = "System.DateTimeOffset",
            ["R4_InvisibleSiblingAliasIsNotACandidate"] = "System.DateTimeOffset",
            ["R4_SameAliasSpellingInDifferentCompilation"] = "System.DateTimeOffset",
            ["R5_FirstSegmentCaptured"] = "global::A.B.Widget",
            ["R6_DroppingAritySelectsOtherDefinition"] = "Container<int>",
            ["R6_ChangingNullabilityArgumentRejected"] = "List<string>",
            ["R6_ChangingGenericArgumentRejected"] = "List<int>",
            ["R6_ChangingContainingConstructionRejected"] = "Outer<int>.Inner<string>",
            ["R7_LocalValueCapturesReceiver"] = "System.DateTimeOffset",
            ["R8_EqualNameofConstantIsInsufficient"] = "System.DateTimeOffset",
            ["R8_TypeAliasCannotChangeNameofConstant"] = "System.DateTimeOffset",
            ["R9_CrefTypeParameterCapture"] = "System.DateTimeOffset",
            ["R10_KeywordCannotBeEmittedUnescaped"] = "@event",
            ["R10_UnescapedAsyncReceiverRejected"] = "@await",
            ["R11_ExternalPartialCollisionAcrossFrameworks"] = "System.DateTimeOffset",
            ["R11_NameofConstraintInSecondConfiguration"] = "System.DateTimeOffset",
            // This prototype retains instead of mapping heterogeneous type chains.
            ["R11_ContainmentShapeChanges"] = "N.Inner<string>",
            ["R11_ProjectFlagMustNotBeAssumedAbsent"] = "System.DateTimeOffset"
        };

        public static IEnumerable<TestCaseData> SelectionCases()
        {
            foreach (var data in StructuralTypeNameRuleOracleTests.Scenarios())
            {
                var scenario = (Scenario)data.Arguments[0]!;
                if (!scenario.Id.StartsWith("R", StringComparison.Ordinal)) continue;
                var expected = ExpectedSelections.TryGetValue(scenario.Id, out var alternative) ? alternative : scenario.Candidate;
                yield return new TestCaseData(scenario, expected).SetName("Select_" + scenario.Id);
            }
        }

        [Test]
        public void ScopeAndMemberFactsAreSharedAcrossCandidateForms()
        {
            var scenario = new Scenario("SharedFacts", "using S = Other.Wrong; namespace Other.Wrong { public class Anchor {} } namespace A.B { public class Widget {} } class Consumer { class A {} private $TYPE$ Value; }",
                "global::A.B.Widget", "global::A.B.Widget", true);
            var input = StructuralTypeNameRuleOracleTests.Prepare(scenario, scenario.Original, new CSharpParseOptions());
            var selection = StructuralTypeNameRuleEvaluator.Evaluate(new[] { input });
            Assert.AreEqual("global::A.B.Widget", selection.Name.ToString());
            Assert.AreEqual(1, selection.ScopeSnapshots);
            Assert.AreEqual(5, selection.MemberSnapshots, "Five region/container fact views are shared; each requested member name is queried at most once");
            Assert.Greater(selection.CandidatesTried, selection.MemberSnapshots, "Multiple unsuccessful paths must reuse their container facts");
            new StructuralTypeNameRuleOracleTests().CandidateMeetsTheScenarioContract(scenario);
        }

        [Test]
        public void LookupFactsQueryOnlyRequestedNamesAndCacheAliasesSeparately()
        {
            var scenario = new Scenario("LazyFacts", "using System; using DTO = System.DateTimeOffset; class Consumer { private $TYPE$ Value; }",
                "global::System.DateTimeOffset", "DateTimeOffset", true);
            var input = StructuralTypeNameRuleOracleTests.Prepare(scenario, scenario.Original, new CSharpParseOptions());
            var facts = new StructuralTypeNameSelector.LookupFacts(input.Model, input.Reference!.SpanStart);
            var first = facts.Scope("DateTimeOffset", false);
            Assert.AreSame(first, facts.Scope("DateTimeOffset", false));
            Assert.AreEqual(1, first.Length);
            Assert.AreEqual(1, facts.RootQueries);
            var system = input.Compilation.GlobalNamespace.GetNamespaceMembers().Single(static ns => ns.Name == "System");
            var members = facts.Members(system, "DateTimeOffset", false);
            Assert.AreSame(members, facts.Members(system, "DateTimeOffset", false));
            Assert.AreEqual(1, members.Length);
            Assert.AreEqual(1, facts.MemberQueries);
            Assert.AreEqual("DTO", facts.Aliases().Single().Name);
            Assert.AreEqual("DTO", facts.Aliases().Single().Name);
            Assert.AreEqual(2, facts.RootQueries, "Alias discovery must not materialize the full visible scope");
        }

        [TestCase("T")]
        [TestCase("int")]
        public void NonNamedAndPredefinedInputsArePreservedWithoutLookup(string spelling)
        {
            var scenario = new Scenario("PreserveNonNamed", "class Consumer<T> { private $TYPE$ Value; }", spelling, spelling, true);
            var input = StructuralTypeNameRuleOracleTests.Prepare(scenario, spelling, new CSharpParseOptions());
            var selection = StructuralTypeNameRuleEvaluator.Evaluate(new[] { input });
            Assert.AreSame(input.Reference, selection.Name);
            Assert.AreEqual(0, selection.ScopeSnapshots);
            Assert.AreEqual(0, selection.MemberSnapshots);
            Assert.AreEqual(StructuralTypeNameSelector.Retention.UnsupportedInput, selection.Reason);
        }

        [TestCaseSource(nameof(SelectionCases))]
        public void SelectsExpectedStructuralNameAndPassesIndependentOracle(Scenario scenario, string expected)
        {
            // The evaluator receives ONLY the originals and scope facts. Neither
            // the manually supplied oracle candidate nor expected answer is input.
            var configurations = (scenario.Configurations ?? new[] { Array.Empty<string>() })
                .Select(symbols => StructuralTypeNameRuleOracleTests.Prepare(scenario, scenario.Original,
                    new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose, preprocessorSymbols: symbols))).ToArray();
            var selection = StructuralTypeNameRuleEvaluator.Evaluate(configurations);
            var spelling = selection.Name.ToString();
            Assert.AreEqual(expected, spelling);
            if (scenario.Id == "R11_ContainmentShapeChanges")
                Assert.AreEqual(StructuralTypeNameSelector.Retention.ConfigurationShape, selection.Reason);
            Assert.LessOrEqual(selection.ScopeSnapshots, 2 * configurations.Length, "At most one type and one expression scope snapshot per configuration");
            new StructuralTypeNameRuleOracleTests().CandidateMeetsTheScenarioContract(scenario with
            {
                Candidate = spelling,
                ExpectedSafe = true,
                RequiredViolation = Violation.None,
                ExpectedPerConfiguration = null
            });
        }
    }
}
