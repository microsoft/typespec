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
        protected override FormattableString Description => $"{ApiVersionEnumDescription}";

        protected override IReadOnlyList<EnumTypeMember> BuildEnumValues()
        {
            var customMembers = new HashSet<FieldProvider>(CustomCodeView?.Fields ?? []);
            List<EnumTypeMember> values = new(AllowedValues.Count);

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

            return BuildApiVersionEnumValuesForBackwardCompatibility(values);
        }

        private List<EnumTypeMember> BuildApiVersionEnumValuesForBackwardCompatibility(List<EnumTypeMember> currentApiVersions)
        {
            var lastContractFields = LastContractView?.Fields;
            if (lastContractFields == null || lastContractFields.Count == 0)
            {
                return currentApiVersions;
            }

            var currentVersionNames = new HashSet<string>(currentApiVersions.Select(v => v.Name), StringComparer.OrdinalIgnoreCase);
            var allMembers = new List<EnumTypeMember>(currentApiVersions.Count + lastContractFields.Count);
            allMembers.AddRange(currentApiVersions);

            bool addedPreviousApiVersion = false;
            foreach (var field in lastContractFields)
            {
                if (!currentVersionNames.Contains(field.Name))
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

            allMembers.Sort(static (x, y) => string.Compare(x.Name, y.Name, StringComparison.OrdinalIgnoreCase));
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

            // validate if any current version is also a date format, if so follow the same format
            if (previousVersionIsDateFormat)
            {
                EnumTypeMember? dateFormatVersion = currentApiVersions.FirstOrDefault(v => v.Value is string apiValue && IsDateFormat(apiValue));
                if (dateFormatVersion?.Value is string apiValue)
                {
                    string? versionPrefix = apiValue.StartsWith("v", StringComparison.InvariantCultureIgnoreCase)
                        ? apiValue[0].ToString()
                        : null;
                    char? separator = ExtractApiVersionSeparator(apiValue);
                    return (versionPrefix, separator);
                }
            }
            else
            {
                // If the previous version is not a date format, try to extract the prefix and separator from the first non-date format version
                EnumTypeMember? nonDateVersion = currentApiVersions.FirstOrDefault(v => v.Value is string apiValue && !IsDateFormat(apiValue));
                if (nonDateVersion?.Value is string currentVersionValue)
                {
                    string? versionPrefix = currentVersionValue.StartsWith("v", StringComparison.InvariantCultureIgnoreCase)
                        ? currentVersionValue[0].ToString()
                        : null;
                    char? separator = ExtractApiVersionSeparator(currentVersionValue);
                    return (versionPrefix, separator);
                }
            }

            return (null, null);
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
