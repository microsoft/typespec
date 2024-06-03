// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using System;
using System.Collections.Generic;
using System.Linq;

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
        internal static FormattableString BuildPropertyDescription(InputModelProperty property, CSharpType type, SerializationFormat serializationFormat, bool isPropertyReadOnly)
        {
            FormattableString description;
            if (string.IsNullOrEmpty(property.Description))
            {
                description = CreateDefaultPropertyDescription(property.Name, isPropertyReadOnly);
            }
            else
            {
                description = FormattableStringHelpers.FromString(property.Description);
            }

            if (type.ContainsBinaryData)
            {
                FormattableString binaryDataExtraDescription = CreateBinaryDataExtraDescription(type, serializationFormat);
                description = $"{description}{binaryDataExtraDescription}";
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
                return $"Gets the {splitDeclarationName}";
            }
            else
            {
                return $"Gets or sets the {splitDeclarationName}";
            }
        }

        /// <summary>
        /// This method will construct an additional description for properties that are binary data. For properties whose values are union types,
        /// the description will include the types of values that are allowed.
        /// </summary>
        /// <param name="type">The CSharpType of the property.</param>
        /// <param name="serializationFormat">The serialization format of the property.</param>
        /// <returns>The formatted description string for the property.</returns>
        private static FormattableString CreateBinaryDataExtraDescription(CSharpType type, SerializationFormat serializationFormat)
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

            return FormattableStringHelpers.Empty;
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

        private static FormattableString ConstructBinaryDataDescription(string typeSpecificDesc, SerializationFormat serializationFormat, IReadOnlyList<FormattableString> unionTypeDescriptions)
        {
            FormattableString unionTypesAdditionalDescription = $"";

            if (unionTypeDescriptions.Count > 0)
            {
                unionTypesAdditionalDescription = $"\n<remarks>\nSupported types:\n<list type=\"bullet\">\n";
                foreach (FormattableString unionTypeDescription in unionTypeDescriptions)
                {
                    unionTypesAdditionalDescription = $"{unionTypesAdditionalDescription}<item>\n{unionTypeDescription}\n</item>\n";
                }
                unionTypesAdditionalDescription = $"{unionTypesAdditionalDescription}</list>\n</remarks>";
            }
            switch (serializationFormat)
            {
                case SerializationFormat.Bytes_Base64Url:
                case SerializationFormat.Bytes_Base64:
                    return $@"
<para>
To assign a byte[] to {typeSpecificDesc} use <see cref=""{typeof(BinaryData)}.FromBytes(byte[])""/>.
The byte[] will be serialized to a Base64 encoded string.
</para>
<para>{unionTypesAdditionalDescription}
Examples:
<list type=""bullet"">
<item>
<term>BinaryData.FromBytes(new byte[] {{ 1, 2, 3 }})</term>
<description>Creates a payload of ""AQID"".</description>
</item>
</list>
</para>";
                default:
                    return $@"
<para>
To assign an object to {typeSpecificDesc} use <see cref=""{typeof(BinaryData)}.FromObjectAsJson{{T}}(T, System.Text.Json.JsonSerializerOptions?)""/>.
</para>
<para>
To assign an already formatted json string to this property use <see cref=""{typeof(BinaryData)}.FromString(string)""/>.
</para>
<para>{unionTypesAdditionalDescription}
Examples:
<list type=""bullet"">
<item>
<term>BinaryData.FromObjectAsJson(""foo"")</term>
<description>Creates a payload of ""foo"".</description>
</item>
<item>
<term>BinaryData.FromString(""\""foo\"""")</term>
<description>Creates a payload of ""foo"".</description>
</item>
<item>
<term>BinaryData.FromObjectAsJson(new {{ key = ""value"" }})</term>
<description>Creates a payload of {{ ""key"": ""value"" }}.</description>
</item>
<item>
<term>BinaryData.FromString(""{{\""key\"": \""value\""}}"")</term>
<description>Creates a payload of {{ ""key"": ""value"" }}.</description>
</item>
</list>
</para>";
            }
        }
    }
}
