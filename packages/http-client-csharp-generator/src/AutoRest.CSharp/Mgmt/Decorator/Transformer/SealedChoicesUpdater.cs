// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Output.Builders;

namespace AutoRest.CSharp.Mgmt.Decorator.Transformer
{
    internal static class SealedChoicesUpdater
    {
        private static readonly List<string> EnumValuesShouldBePrompted = new()
        {
            "None", "NotSet", "Unknown", "NotSpecified", "Unspecified", "Undefined"
        };

        public static void UpdateSealChoiceTypes()
        {
            var wordCandidates = new List<string>(EnumValuesShouldBePrompted.Concat(Configuration.MgmtConfiguration.PromptedEnumValues));
            foreach (var schema in MgmtContext.CodeModel.AllSchemas)
            {
                if (schema is not SealedChoiceSchema choiceSchema)
                    continue;

                // rearrange the sequence in the choices
                choiceSchema.Choices = RearrangeChoices(choiceSchema.Choices, wordCandidates);
            }
        }

        internal static ICollection<ChoiceValue> RearrangeChoices(ICollection<ChoiceValue> originalValues, List<string> wordCandidates)
        {
            return originalValues.OrderBy(choice =>
            {
                var name = choice.CSharpName();
                var index = wordCandidates.IndexOf(name);
                return index >= 0 ? index : wordCandidates.Count;
            }).ToList();
        }
    }
}
