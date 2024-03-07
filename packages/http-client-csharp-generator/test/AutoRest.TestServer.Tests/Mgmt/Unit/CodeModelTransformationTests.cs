// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.Decorator.Transformer;
using AutoRest.CSharp.Output.Builders;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.Unit
{
    internal class CodeModelTransformationTests
    {
        private static readonly List<string> EnumValuesShouldBePrompted = new()
        {
            "None",
            "NotSet",
            "Unknown",
            "NotSpecified",
            "Unspecified",
            "Undefined"
        };

        [TestCase]
        public void ValidateRearrangeChoicesWithNoneMatch()
        {
            var input = new[] { "A", "B", "C", "D" };
            var expected = new[] { "A", "B", "C", "D" };
            ValidateRearrangeChoices(expected, input);
        }

        [TestCase]
        public void ValidateRearrangeChoicesWithOneMatch()
        {
            var input = new[] { "A", "B", "C", "None" };
            var expected = new[] { "None", "A", "B", "C" };
            ValidateRearrangeChoices(expected, input);
        }

        [TestCase("ManagedServiceIdentity", "ManagedServiceIdentityType", AllSchemaTypes.Boolean, "IdentityType")]
        [TestCase("ManagedServiceIdentity", "ManagedServiceIdentity7Type", AllSchemaTypes.Boolean, "Identity7Type")]
        [TestCase("ManagedServiceIdentity", "ManagedServiceIdentity7Type", AllSchemaTypes.String, "ManagedServiceIdentity7Type")]
        [TestCase("ResourceTypeAliasPathMetadata", "ResourceTypeAliasPathTokenType", AllSchemaTypes.Boolean, "TokenType")]
        [TestCase("ResourceTypeAliasPathMetadata", "ResourceTypeAliasPathTokenType", AllSchemaTypes.String, "ResourceTypeAliasPathTokenType")]
        [TestCase("ResourceTypeAliasPathMetadata", "ResourceType", AllSchemaTypes.Boolean, "ResourceType")]
        [TestCase("ResourceTypeAliasPathMetadata", "ResourceType", AllSchemaTypes.String, "ResourceType")]
        [TestCase("ResourceTypeAliasPathMetadata", "ResourceTypeAlias", AllSchemaTypes.Boolean, "ResourceTypeAlias")]
        [TestCase("ResourceTypeAliasPathMetadata", "ResourceTypeAlias", AllSchemaTypes.String, "ResourceTypeAlias")]
        [TestCase("ResourceTypeAliasPathMetadata", "ResourceTypeAliasType", AllSchemaTypes.Boolean, "AliasType")]
        [TestCase("ResourceTypeAliasPathMetadata", "ResourceTypeAliasType", AllSchemaTypes.String, "ResourceTypeAliasType")]
        [TestCase("ResourceTypeAliasPathMetadata", "ResourceTypeAliasPath", AllSchemaTypes.Boolean, "AliasPath")]
        [TestCase("ResourceTypeAliasPathMetadata", "ResourceTypeAliasPath", AllSchemaTypes.String, "ResourceTypeAliasPath")]
        [TestCase("ResourceTypeAliasPathMetadata", "ManagedServiceIdentity7Type", AllSchemaTypes.Boolean, "ManagedServiceIdentity7Type")]
        [TestCase("ResourceTypeAliasPathMetadata", "ManagedServiceIdentityType", AllSchemaTypes.Boolean, "ManagedServiceIdentityType")]
        [TestCase("JitScheduling", "JitSchedulingType", AllSchemaTypes.Boolean, "SchedulingType")]
        [TestCase("JitScheduling", "JitSchedulingType", AllSchemaTypes.String, "JitSchedulingType")]
        [TestCase("JitSchedulingPolicyMaker", "JitSchedulingPolicyMakerType", AllSchemaTypes.Boolean, "MakerType")]
        [TestCase("JitSchedulingPolicyMaker", "JitSchedulingPolicyMakerType", AllSchemaTypes.String, "JitSchedulingPolicyMakerType")]
        [TestCase("JitScheduling", "JitSchedulingType", AllSchemaTypes.String, "JitSchedulingType")]
        [TestCase("JitSchedulingPolicy", "JitScheduling", AllSchemaTypes.Boolean, "JitScheduling")]
        [TestCase("JitSchedulingPolicy", "JitScheduling", AllSchemaTypes.String, "JitScheduling")]
        [TestCase("JitScheduling7AlertPolicy", "Scheduling7AlertPolicy", AllSchemaTypes.Boolean, "Scheduling7AlertPolicy")]
        [TestCase("JitScheduling7AlertPolicy", "Scheduling7AlertPolicy", AllSchemaTypes.String, "Scheduling7AlertPolicy")]
        [TestCase("Jit7SchedulingPolicy", "Jit7Scheduling", AllSchemaTypes.Boolean, "Jit7Scheduling")]
        [TestCase("Jit7SchedulingPolicy", "Jit7Scheduling", AllSchemaTypes.String, "Jit7Scheduling")]
        [TestCase("JitSchedulingPolicy", "Jit", AllSchemaTypes.Boolean, "Jit")]
        [TestCase("JitSchedulingPolicy", "Jit", AllSchemaTypes.String, "Jit")]
        [TestCase("JitSchedulingPolicy", "ManagedServiceIdentityType", AllSchemaTypes.Boolean, "ManagedServiceIdentityType")]
        [TestCase("JitSchedulingPolicy", "ManagedServiceIdentityType", AllSchemaTypes.String, "ManagedServiceIdentityType")]
        public void ValidateGetTypePropertyName(string parentName, string propertyTypeName, AllSchemaTypes type, string expected)
        {
            var typePropertyName = FrameworkTypeUpdater.GetEnclosingTypeName(parentName, propertyTypeName, type);
            Assert.AreEqual(expected, typePropertyName);
        }

        [TestCase]
        public void ValidateRearrangeChoicesWithMultipleMatches()
        {
            var input = new[] { "A", "B", "NotSet", "C", "None" };
            var expected = new[] { "None", "NotSet", "A", "B", "C" };
            ValidateRearrangeChoices(expected, input);
        }

        private static void ValidateRearrangeChoices(IEnumerable<string> expected, IEnumerable<string> input)
        {
            var choiceValues = input.Select(v => GetChoiceValue(v)).ToList();
            var results = SealedChoicesUpdater.RearrangeChoices(choiceValues, EnumValuesShouldBePrompted);
            CollectionAssert.AreEquivalent(expected, results.Select(c => c.CSharpName()));
        }

        private static ChoiceValue GetChoiceValue(string value)
        {
            return new ChoiceValue
            {
                Language = new Languages
                {
                    Default = new Language
                    {
                        Name = value
                    }
                }
            };
        }
    }
}
