// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal sealed class ApiVersionEnumProvider : FixedEnumProvider
    {
        private const string ApiVersionEnumName = "ServiceVersion";
        private const string ApiVersionEnumDescription = "The version of the service to use.";

        public ApiVersionEnumProvider(InputEnumType input, TypeProvider? declaringType) : base(input, declaringType) { }

        protected override string BuildName() => ApiVersionEnumName;
        protected override FormattableString BuildDescription() => $"{ApiVersionEnumDescription}";

        protected override IReadOnlyList<EnumTypeMember> BuildEnumValues()
        {
            IReadOnlyList<FieldProvider> customFields = CustomCodeView?.Fields ?? [];
            List<EnumTypeMember> values = new(AllowedValues.Count);
            bool shouldUseCustomMembers = customFields.Count > 0
                && customFields.All(cm => cm.InitializationValue != null);

            if (shouldUseCustomMembers)
            {
                values = BuildCustomEnumMembers(customFields);
            }
            else
            {
                var customMembers = new HashSet<FieldProvider>(customFields);
                for (int i = 0; i < AllowedValues.Count; i++)
                {
                    var inputValue = AllowedValues[i];
                    var modifiers = FieldModifiers.Public | FieldModifiers.Static;
                    var name = inputValue.Name.ToApiVersionMemberName();

                    // check if the enum member was renamed in custom code
                    string? customMemberName = null;
                    foreach (var customMember in customMembers)
                    {
                        if (customMember.OriginalName == name)
                        {
                            customMemberName = customMember.Name;
                        }
                    }

                    if (customMemberName != null)
                    {
                        name = customMemberName;
                    }

                    ValueExpression? initializationValue = Literal(i + 1);
                    var field = new FieldProvider(
                        modifiers,
                        EnumUnderlyingType,
                        name,
                        this,
                        DocHelpers.GetFormattableDescription(inputValue.Summary, inputValue.Doc) ?? $"{name}",
                        initializationValue);

                    values.Add(new EnumTypeMember(name, field, inputValue.Value));
                }
            }

            return BuildApiVersionEnumValuesForBackwardCompatibility(values);
        }

        private List<EnumTypeMember> BuildCustomEnumMembers(IReadOnlyList<FieldProvider> customMembers)
        {
            List<EnumTypeMember> values = new(customMembers.Count);
            Dictionary<string, InputEnumTypeValue> allowedValues = AllowedValues.ToDictionary(av => av.Name.ToApiVersionMemberName());
            for (int i = 0; i < customMembers.Count; i++)
            {
                var member = customMembers[i];
                var modifiers = FieldModifiers.Public | FieldModifiers.Static;
                var field = new FieldProvider(
                    modifiers,
                    EnumUnderlyingType,
                    member.Name,
                    this,
                    $"",
                    member.InitializationValue);
                object? inputValue = allowedValues.TryGetValue(member.OriginalName ?? member.Name, out var enumValue)
                    ? enumValue.Value
                    : member.Name;
                values.Add(new EnumTypeMember(member.Name, field, inputValue));
            }

            return values;
        }

        private List<EnumTypeMember> BuildApiVersionEnumValuesForBackwardCompatibility(List<EnumTypeMember> currentApiVersions)
        {
            var lastContractFields = LastContractView?.Fields;
            if (lastContractFields == null || lastContractFields.Count == 0)
            {
                return currentApiVersions;
            }

            var currentVersionsLookup = currentApiVersions.ToDictionary(v => v.Name, StringComparer.OrdinalIgnoreCase);
            var allMembers = new List<EnumTypeMember>(currentApiVersions.Count + lastContractFields.Count);
            bool addedPreviousApiVersion = false;

            // First, add all missing backward compatibility versions in their original order
            foreach (var field in lastContractFields)
            {
                if (currentVersionsLookup.TryGetValue(field.Name, out var existingMember))
                {
                    allMembers.Add(existingMember);
                }
                else
                {
                    var (versionPrefix, versionSeparator) = ExtractVersionFormatInfo(field.Name, currentApiVersions);
                    string enumValue = field.Name.ToApiVersionValue(versionPrefix, versionSeparator);
                    allMembers.Add(new EnumTypeMember(field.Name, field, enumValue));
                    addedPreviousApiVersion = true;
                }
            }

            if (!addedPreviousApiVersion)
            {
                return currentApiVersions;
            }

            var processedNames = new HashSet<string>(lastContractFields.Select(f => f.Name), StringComparer.OrdinalIgnoreCase);
            // Then, add new versions in the wire order
            foreach (var currentVersion in currentApiVersions)
            {
                if (!processedNames.Contains(currentVersion.Name))
                {
                    allMembers.Add(currentVersion);
                }
            }

            for (int i = 0; i < allMembers.Count; i++)
            {
                var member = allMembers[i];
                var updatedField = new FieldProvider(
                    member.Field.Modifiers,
                    member.Field.Type,
                    member.Name,
                    member.Field.EnclosingType,
                    member.Field.Description,
                    Literal(i + 1));
                allMembers[i] = new EnumTypeMember(member.Name, updatedField, member.Value);
            }

            return allMembers;
        }

        private static (string? Prefix, char? Separator) ExtractVersionFormatInfo(string previousVersion, List<EnumTypeMember> currentApiVersions)
        {
            if (currentApiVersions.Count == 0)
            {
                return (null, null);
            }

            bool previousVersionIsDateFormat = IsDateFormat(previousVersion);
            string? versionPrefix = null;
            char? separator = null;

            // validate if any current version is also a date format, if so follow the same format
            if (previousVersionIsDateFormat)
            {
                EnumTypeMember? dateFormatVersion = currentApiVersions.FirstOrDefault(v => v.Value is string apiValue && IsDateFormat(apiValue));
                if (dateFormatVersion?.Value is string apiValue)
                {
                    versionPrefix = apiValue.StartsWith("v", StringComparison.InvariantCultureIgnoreCase)
                        ? apiValue[0].ToString()
                        : null;
                    separator = ExtractApiVersionSeparator(apiValue);
                }
            }
            else
            {
                // If the previous version is not a date format, try to extract the prefix and separator from the first non-date format version
                EnumTypeMember? nonDateVersion = currentApiVersions.FirstOrDefault(v => v.Value is string apiValue && !IsDateFormat(apiValue));
                if (nonDateVersion?.Value is string currentVersionValue)
                {
                    versionPrefix = currentVersionValue.StartsWith("v", StringComparison.InvariantCultureIgnoreCase)
                        ? currentVersionValue[0].ToString()
                        : null;
                    separator = ExtractApiVersionSeparator(currentVersionValue);
                }
            }

            if (!previousVersionIsDateFormat && versionPrefix == null && IsSingleDigitVersion(previousVersion))
            {
                versionPrefix = "v";
            }

            return (versionPrefix, separator);
        }

        private static bool IsSingleDigitVersion(string version)
        {
            return version.Length == 2
                && version.StartsWith("v", StringComparison.InvariantCultureIgnoreCase)
                && char.IsDigit(version[1]);
        }

        private static bool IsDateFormat(string version)
        {
            if (string.IsNullOrEmpty(version) || version.Length < 10)
            {
                return false;
            }

            // Common date formats found in API versions
            string[] formats =
            [
                "yyyy_MM_dd",
                "yyyy-MM-dd",
                "yyyy.MM.dd",
                "MM/dd/yyyy",
                "MM_dd_yyyy",
                "yyyy/MM/dd",
                "dd-MM-yyyy",
                "dd.MM.yyyy",
            ];

            int startIndex = version.StartsWith("v", StringComparison.InvariantCultureIgnoreCase) ? 1 : 0;
            // extract the date string
            version = version.Substring(startIndex, 10);
            foreach (var format in formats)
            {
                if (DateTime.TryParseExact(version, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                {
                    return true;
                }
            }

            return false;
        }

        private static char? ExtractApiVersionSeparator(string version)
        {
            if (string.IsNullOrEmpty(version))
                return null;

            char[] versionSeparators = ['-', '.', '_', '/'];
            int separatorIndex = version.IndexOfAny(versionSeparators);

            return separatorIndex >= 0 ? version[separatorIndex] : null;
        }
    }
}
