// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Output.Builders;

namespace AutoRest.CSharp.Mgmt.Decorator.Transformer
{
    internal static class FrameworkTypeUpdater
    {
        // max number of words to keep if trimming the property
        private const int MaxTrimmingPropertyWordCount = 2;

        public static void ValidateAndUpdate()
        {
            foreach (var schema in MgmtContext.CodeModel.AllSchemas)
            {
                if (schema is not ObjectSchema objSchema)
                    continue;

                foreach (var property in objSchema.Properties)
                {
                    if (property.CSharpName().EndsWith("Duration", StringComparison.Ordinal) && property.Schema.Type == AllSchemaTypes.String && property.Schema.Extensions?.Format == null)
                        throw new InvalidOperationException($"The {property.Language.Default.Name} property of {objSchema.Name} ends with \"Duration\" but does not use the duration format to be generated as TimeSpan type. Add \"format\": \"duration\" with directive in autorest.md for the property if it's ISO 8601 format like P1DT2H59M59S. Add \"x-ms-format\": \"{XMsFormat.DurationConstant}\" if it's the constant format like 1.2:59:59.5000000. If the property does not conform to a TimeSpan format, please use \"x-ms-client-name\" to rename the property for the client.");
                    else if (property.CSharpName().Equals("Type", StringComparison.Ordinal))
                    {
                        // Do not use property.SerializedName=="type" so that we can still use x-ms-client-name to override the auto-renaming here if there is some edge case.
                        if (objSchema.IsResourceData() || objSchema.CSharpName().Contains("NameAvailability", StringComparison.Ordinal))
                        {
                            property.Language.Default.Name = "resourceType";
                        }
                        else if (property.Schema.Name.EndsWith("Type", StringComparison.Ordinal) && property.Schema.Name.Length != 4)
                        {
                            property.Language.Default.Name = GetEnclosingTypeName(objSchema.Name, property.Schema.Name, property.Schema.Type);
                        }
                        else if (property.Schema.Name.EndsWith("Types", StringComparison.Ordinal) && property.Schema.Name.Length != 5)
                        {
                            property.Language.Default.Name = GetEnclosingTypeName(objSchema.Name, property.Schema.Name.TrimEnd('s'), property.Schema.Type);
                        }
                        else
                        {
                            throw new InvalidOperationException($"{objSchema.Name} has a property named \"Type\" which is not allowed. Please use \"x-ms-client-name\" to rename the property for the client.");
                        }
                    }
                }
            }
        }

        internal static string GetEnclosingTypeName(string parentName, string propertyTypeName, AllSchemaTypes type)
        {
            if (type == AllSchemaTypes.String)
            {
                // for string type property, return the original property name so that it's easier to identify the semantic meaning
                return propertyTypeName;
            }

            var propertyWords = propertyTypeName.SplitByCamelCaseAndGroup().ToArray();
            // we keep at most 2 words, if trim the property
            if (propertyWords.Length < MaxTrimmingPropertyWordCount)
            {
                return propertyTypeName;
            }

            var parentWords = parentName.SplitByCamelCaseAndGroup().ToArray();
            var commonPrefixes = new List<string>();
            for (int i = 0; i < parentWords.Length && i < propertyWords.Length; i++)
            {
                if (parentWords[i] == propertyWords[i])
                {
                    commonPrefixes.Add(parentWords[i]);
                }
                else
                {
                    break;
                };
            }

            if (commonPrefixes.Count == 0)
            {
                // if no common prefix, just return the original property name
                return propertyTypeName;
            }

            var newPropertyWords = propertyWords.TakeLast(propertyWords.Length - commonPrefixes.Count()).ToList();
            if (newPropertyWords.Count > MaxTrimmingPropertyWordCount)
            {
                commonPrefixes.AddRange(newPropertyWords.Take(newPropertyWords.Count - MaxTrimmingPropertyWordCount));
                newPropertyWords.RemoveRange(0, newPropertyWords.Count - MaxTrimmingPropertyWordCount);
            }

            // A property namne cannot start with number, so we need to shift another word from prefixes to new property.
            // The worst case is that new property is the original property. The loop should end eventually.
            while (newPropertyWords.Count < MaxTrimmingPropertyWordCount || int.TryParse(newPropertyWords.First(), out _))
            {
                newPropertyWords.Insert(0, commonPrefixes.Last());
                commonPrefixes.RemoveAt(commonPrefixes.Count - 1);
            }

            return String.Join("", newPropertyWords);
        }

    }
}
