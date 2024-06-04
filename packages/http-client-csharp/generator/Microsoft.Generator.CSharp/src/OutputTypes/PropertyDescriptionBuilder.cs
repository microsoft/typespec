// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    internal static class PropertyDescriptionBuilder
    {
        /// <summary>
        /// This method is used to create the description for the property.
        /// If the property is of type <see cref="BinaryData"/>, then an additional description will be appended.
        /// </summary>
        /// <param name="property"> The property for which the description is being constructed.</param>
        /// <param name="type">The CSharpType of the property.</param>
        /// <param name="serializationFormat">The serialization format of the property.</param>
        /// <param name="isPropertyReadOnly">Flag used to determine if the property <paramref name="property"/> is read-only.</param>
        /// <returns>The formatted property description string.</returns>
        internal static IReadOnlyList<FormattableString> BuildPropertyDescription(InputModelProperty property, CSharpType type, SerializationFormat serializationFormat, bool isPropertyReadOnly)
        {
            List<FormattableString> description = new List<FormattableString>();

            if (string.IsNullOrEmpty(property.Description))
            {
                description.Add(CreateDefaultPropertyDescription(property.Name, isPropertyReadOnly));
            }
            else
            {
                description.Add(FormattableStringHelpers.FromString(property.Description));
            }

            if (type.ContainsBinaryData)
            {
                description.AddRange(CreateBinaryDataExtraDescription(type, serializationFormat));
            }

            return description;
        }

        /// <summary>
        /// This method attempts to retrieve the description for each of the union type items. For items that are lists,
        /// the description will include details about the element type.
        /// For items that are literals, the description will include the literal value.
        /// </summary>
        /// <param name="unionItems">the list of union type items.</param>
        /// <returns>A list of FormattableString representing the description of each union item.
        /// </returns>
        internal static IReadOnlyList<FormattableString> GetUnionTypesDescriptions(IReadOnlyList<CSharpType> unionItems)
        {
            var values = new List<FormattableString>();

            foreach (CSharpType item in unionItems)
            {
                FormattableString description;

                if (item.IsLiteral && item.Literal != null)
                {
                    var literalValue = item.Literal;
                    if (item.FrameworkType == typeof(string))
                    {
                        description = $"<description>{literalValue:L}</description>";
                    }
                    else
                    {
                        description = $"<description>{literalValue}</description>";
                    }
                }
                else
                {
                    description = $"<description>{item:C}</description>";
                }

                values.Add(description);
            }

            return values.Distinct().ToList();
        }

        /// <summary>
        /// Creates a default property description based on the property name and if it is read only.
        /// </summary>
        internal static FormattableString CreateDefaultPropertyDescription(string name, bool isReadOnly)
        {
            string splitDeclarationName = string.Join(" ", StringExtensions.SplitByCamelCase(name)).ToLower();
            if (isReadOnly)
            {
                return $"Gets the {splitDeclarationName}.";
            }
            else
            {
                return $"Gets or sets the {splitDeclarationName}.";
            }
        }

        /// <summary>
        /// This method will construct an additional description for properties that are binary data. For properties whose values are union types,
        /// the description will include the types of values that are allowed.
        /// </summary>
        /// <param name="type">The CSharpType of the property.</param>
        /// <param name="serializationFormat">The serialization format of the property.</param>
        /// <returns>The formatted description string for the property.</returns>
        private static IReadOnlyList<FormattableString> CreateBinaryDataExtraDescription(CSharpType type, SerializationFormat serializationFormat)
        {
            string typeSpecificDesc;
            var unionTypes = GetUnionTypes(type);
            IReadOnlyList<FormattableString> unionTypeDescriptions = Array.Empty<FormattableString>();

            if (unionTypes.Any())
            {
                unionTypeDescriptions = GetUnionTypesDescriptions(unionTypes);
            }

            if (type.FrameworkType == typeof(BinaryData))
            {
                typeSpecificDesc = "this property";
                return ConstructBinaryDataDescription(typeSpecificDesc, serializationFormat, unionTypeDescriptions);
            }
            if (type.IsList)
            {
                typeSpecificDesc = "the element of this property";
                return ConstructBinaryDataDescription(typeSpecificDesc, serializationFormat, unionTypeDescriptions);
            }
            if (type.IsDictionary)
            {
                typeSpecificDesc = "the value of this property";
                return ConstructBinaryDataDescription(typeSpecificDesc, serializationFormat, unionTypeDescriptions);
            }

            return Array.Empty<FormattableString>();
        }

        // recursively get the union types if any.
        private static IReadOnlyList<CSharpType> GetUnionTypes(CSharpType type)
        {
            if (type.IsCollection)
            {
                return GetUnionTypes(type.ElementType);
            }
            else if (type.IsUnion)
            {
                return type.UnionItemTypes;
            }

            return Array.Empty<CSharpType>();
        }

        private static IReadOnlyList<FormattableString> ConstructBinaryDataDescription(string typeSpecificDesc, SerializationFormat serializationFormat, IReadOnlyList<FormattableString> unionTypeDescriptions)
        {
            List<FormattableString> result = new List<FormattableString>();
            List<FormattableString> unionTypesAdditionalDescription = new List<FormattableString>();

            if (unionTypeDescriptions.Count > 0)
            {
                unionTypesAdditionalDescription.Add($"<remarks>");
                unionTypesAdditionalDescription.Add($"Supported types:");
                unionTypesAdditionalDescription.Add($"<list type=\"bullet\">");
                foreach (FormattableString unionTypeDescription in unionTypeDescriptions)
                {
                    unionTypesAdditionalDescription.Add($"<item>");
                    unionTypesAdditionalDescription.Add(unionTypeDescription);
                    unionTypesAdditionalDescription.Add($"</item>");
                }
                unionTypesAdditionalDescription.Add($"</list>");
                unionTypesAdditionalDescription.Add($"</remarks>");
            }

            switch (serializationFormat)
            {
                case SerializationFormat.Bytes_Base64Url:
                case SerializationFormat.Bytes_Base64:
                    result.Add($"<para>");
                    result.Add($"To assign a byte[] to {typeSpecificDesc} use <see cref=\"{typeof(BinaryData)}.FromBytes(byte[])\"/>.");
                    result.Add($"The byte[] will be serialized to a Base64 encoded string.");
                    result.Add($"</para>");
                    result.Add($"<para>");
                    if (unionTypesAdditionalDescription.Count > 0)
                    {
                        result.AddRange(unionTypesAdditionalDescription);
                    }
                    result.Add($"Examples:");
                    result.Add($"<list type=\"bullet\">");
                    result.Add($"<item>");
                    result.Add($"<term>BinaryData.FromBytes(new byte[] {{ 1, 2, 3 }})</term>");
                    result.Add($"<description>Creates a payload of \"AQID\".</description>");
                    result.Add($"</item>");
                    result.Add($"</list>");
                    result.Add($"</para>");
                    break;
                default:
                    result.Add($"<para>");
                    result.Add($"To assign an object to {typeSpecificDesc} use <see cref=\"{typeof(BinaryData)}.FromObjectAsJson{{T}}(T, System.Text.Json.JsonSerializerOptions?)\"/>.");
                    result.Add($"</para>");
                    result.Add($"<para>");
                    result.Add($"To assign an already formatted json string to this property use <see cref=\"{typeof(BinaryData)}.FromString(string)\"/>.");
                    result.Add($"</para>");
                    result.Add($"<para>");
                    if (unionTypesAdditionalDescription.Count > 0)
                    {
                        result.AddRange(unionTypesAdditionalDescription);
                    }
                    result.Add($"Examples:");
                    result.Add($"<list type=\"bullet\">");
                    result.Add($"<item>");
                    result.Add($"<term>BinaryData.FromObjectAsJson(\"foo\")</term>");
                    result.Add($"<description>Creates a payload of \"foo\".</description>");
                    result.Add($"</item>");
                    result.Add($"<item>");
                    result.Add($"<term>BinaryData.FromString(\"\\\"foo\\\"\")</term>");
                    result.Add($"<description>Creates a payload of \"foo\".</description>");
                    result.Add($"</item>");
                    result.Add($"<item>");
                    result.Add($"<term>BinaryData.FromObjectAsJson(new {{ key = \"value\" }})</term>");
                    result.Add($"<description>Creates a payload of {{ \"key\": \"value\" }}.</description>");
                    result.Add($"</item>");
                    result.Add($"<item>");
                    result.Add($"<term>BinaryData.FromString(\"{{\\\"key\\\": \\\"value\\\"}}\")</term>");
                    result.Add($"<description>Creates a payload of {{ \"key\": \"value\" }}.</description>");
                    result.Add($"</item>");
                    result.Add($"</list>");
                    result.Add($"</para>");
                    break;
            }

            return result;
        }
    }
}
