// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Immutable;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Report;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Mgmt.Decorator.Transformer
{
    internal static class RenamePluralEnums
    {
        public static void Update()
        {
            ImmutableHashSet<string> enumsToKeepPlural = Configuration.MgmtConfiguration.KeepPluralEnums.ToImmutableHashSet();

            foreach (var schema in MgmtContext.CodeModel.AllSchemas)
            {
                if (schema is not SealedChoiceSchema && schema is not ChoiceSchema)
                    continue;
                string schemaName = schema.Language.Default.Name;
                if (enumsToKeepPlural.Contains(schemaName))
                {
                    MgmtReport.Instance.TransformSection.AddTransformLog(
                        new TransformItem(TransformTypeName.KeepPluralEnums, schemaName),
                        schema.GetOriginalName(), $"Keep Enum {schemaName} Plural");
                    continue;
                }
                schema.Language.Default.SerializedName ??= schemaName;
                schema.Language.Default.Name = schemaName.LastWordToSingular(inputIsKnownToBePlural: false);
            }
        }
    }
}
