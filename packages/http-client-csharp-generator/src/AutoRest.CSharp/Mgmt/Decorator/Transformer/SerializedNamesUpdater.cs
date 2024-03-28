// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Output.Builders;

namespace AutoRest.CSharp.Mgmt.Decorator.Transformer
{
    internal static class SerializedNamesUpdater
    {
        public static void Update()
        {
            foreach (var schema in MgmtContext.CodeModel.AllSchemas)
            {
                switch (schema)
                {
                    case ChoiceSchema choiceSchema:
                        UpdateChoiceSchema(choiceSchema);
                        break;
                    case SealedChoiceSchema sealedSchema:
                        UpdateSealedChoiceSchema(sealedSchema);
                        break;
                    case ObjectSchema objectSchema:
                        UpdateObjectSchema(objectSchema);
                        break;
                }
            }
        }

        private static void UpdateChoiceSchema(ChoiceSchema choiceSchema)
        {
            // update the choice type, append the serialized name of this type to its original description
            choiceSchema.Language.Default.Description = $"{CreateDescription(choiceSchema)}\n{CreateSerializedNameDescription(choiceSchema.GetFullSerializedName())}";
            // update the choice values
            foreach (var choice in choiceSchema.Choices)
            {
                choice.Language.Default.Description = $"{CreateDescription(choice)}\n{CreateSerializedNameDescription(choiceSchema.GetFullSerializedName(choice))}";
            }
        }

        private static void UpdateSealedChoiceSchema(SealedChoiceSchema sealedChoiceSchema)
        {
            // update the sealed choice type, append the serialized name of this type to its original description
            sealedChoiceSchema.Language.Default.Description = $"{CreateDescription(sealedChoiceSchema)}\n{CreateSerializedNameDescription(sealedChoiceSchema.GetFullSerializedName())}";
            foreach (var choice in sealedChoiceSchema.Choices)
            {
                choice.Language.Default.Description = $"{CreateDescription(choice)}\n{CreateSerializedNameDescription(sealedChoiceSchema.GetFullSerializedName(choice))}";
            }
        }

        private static void UpdateObjectSchema(ObjectSchema objectSchema)
        {
            // update the sealed choice type, append the serialized name of this type to its original description
            objectSchema.Language.Default.Description = $"{CreateDescription(objectSchema)}\n{CreateSerializedNameDescription(objectSchema.GetFullSerializedName())}";
            foreach (var property in objectSchema.Properties)
            {
                var originalDescription = string.IsNullOrEmpty(property.Language.Default.Description) ? string.Empty : $"{property.Language.Default.Description}\n";
                property.Language.Default.Description = $"{originalDescription}{CreateSerializedNameDescription(objectSchema.GetFullSerializedName(property))}";
            }
        }

        private static string CreateDescription(Schema schema) => string.IsNullOrWhiteSpace(schema.Language.Default.Description) ?
                $"The {schema.Name}.":
                schema.Language.Default.Description;

        private static string CreateDescription(ChoiceValue choiceValue) => string.IsNullOrWhiteSpace(choiceValue.Language.Default.Description)
                ? choiceValue.Value
                : choiceValue.Language.Default.Description;

        private static string CreateSerializedNameDescription(string fullSerializedName) => $"Serialized Name: {fullSerializedName}";
    }
}
