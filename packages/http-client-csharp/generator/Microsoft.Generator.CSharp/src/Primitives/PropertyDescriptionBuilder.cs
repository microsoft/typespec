// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Primitives
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
        internal static XmlDocSummaryStatement BuildPropertyDescription(InputModelProperty property, CSharpType type, SerializationFormat serializationFormat, FormattableString description)
        {
            var innerStatements = type.ContainsBinaryData ? CreateBinaryDataExtraDescription(type, serializationFormat) : Array.Empty<XmlDocStatement>();
            return new XmlDocSummaryStatement([description], [.. innerStatements]);
        }

        /// <summary>
        /// This method attempts to retrieve the description for each of the union type items. For items that are lists,
        /// the description will include details about the element type.
        /// For items that are literals, the description will include the literal value.
        /// </summary>
        /// <param name="unionItems">the list of union type items.</param>
        /// <returns>A list of FormattableString representing the description of each union item.
        /// </returns>
        internal static IReadOnlyList<XmlDocStatement> GetUnionTypesDescriptions(IReadOnlyList<CSharpType> unionItems)
        {
            var values = new List<XmlDocStatement>();

            foreach (CSharpType item in unionItems)
            {
                XmlDocStatement description;

                if (item.IsLiteral && item.Literal != null)
                {
                    var literalValue = item.Literal;
                    if (item.FrameworkType == typeof(string))
                    {
                        description = new XmlDocStatement("description", [$"{literalValue:L}"]);
                    }
                    else
                    {
                        description = new XmlDocStatement("description", [$"{literalValue}"]);
                    }
                }
                else
                {
                    description = new XmlDocStatement("description", [$"{item:C}"]);
                }

                values.Add(description);
            }

            return values;
        }

        /// <summary>
        /// Creates a default property description based on the property name and if it is read only.
        /// </summary>
        internal static FormattableString CreateDefaultPropertyDescription(string name, bool isReadOnly)
        {
            if (isReadOnly)
            {
                return $"Gets the {name}.";
            }
            else
            {
                return $"Gets or sets the {name}.";
            }
        }

        /// <summary>
        /// This method will construct an additional description for properties that are binary data. For properties whose values are union types,
        /// the description will include the types of values that are allowed.
        /// </summary>
        /// <param name="type">The CSharpType of the property.</param>
        /// <param name="serializationFormat">The serialization format of the property.</param>
        /// <returns>The formatted description string for the property.</returns>
        private static IReadOnlyList<XmlDocStatement> CreateBinaryDataExtraDescription(CSharpType type, SerializationFormat serializationFormat)
        {
            string typeSpecificDesc;
            var unionTypes = GetUnionTypes(type);
            IReadOnlyList<XmlDocStatement> unionTypeDescriptions = Array.Empty<XmlDocStatement>();

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

            return Array.Empty<XmlDocStatement>();
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

        private static IReadOnlyList<XmlDocStatement> ConstructBinaryDataDescription(string typeSpecificDesc, SerializationFormat serializationFormat, IReadOnlyList<XmlDocStatement> unionTypeDescriptions)
        {
            List<XmlDocStatement> result = new List<XmlDocStatement>();
            XmlDocStatement? unionRemarks = null;

            if (unionTypeDescriptions.Count > 0)
            {
                XmlDocStatement[] listItems = new XmlDocStatement[unionTypeDescriptions.Count];
                for (int i = 0; i < unionTypeDescriptions.Count; i++)
                {
                    listItems[i] = new XmlDocStatement("item", [], innerStatements: unionTypeDescriptions[i]);
                }
                var listXmlDoc = new XmlDocStatement("<list type=\"bullet\">", "</list>", [], innerStatements: listItems);
                unionRemarks = new XmlDocStatement("remarks", [$"Supported types:"], innerStatements: listXmlDoc);
            }

            switch (serializationFormat)
            {
                case SerializationFormat.Bytes_Base64Url:
                case SerializationFormat.Bytes_Base64:
                    result.Add(new XmlDocStatement("para",
                        [
                            $"To assign a byte[] to {typeSpecificDesc} use <see cref=\"{typeof(BinaryData)}.FromBytes(byte[])\"/>.",
                            $"The byte[] will be serialized to a Base64 encoded string."
                        ]));
                    if (unionRemarks is not null)
                    {
                        result.Add(new XmlDocStatement("para", [], innerStatements: unionRemarks));
                    }
                    var listItems = new XmlDocStatement("item", [],
                        new XmlDocStatement("term", [$"BinaryData.FromBytes(new byte[] {{ 1, 2, 3 }})"]),
                        new XmlDocStatement("description", [$"Creates a payload of \"AQID\"."]));
                    var listXmlDoc = new XmlDocStatement("<list type=\"bullet\">", "</list>", [], innerStatements: listItems);
                    result.Add(new XmlDocStatement("para", [$"Examples:"], innerStatements: listXmlDoc));
                    break;
                default:
                    result.Add(new XmlDocStatement("para", [$"To assign an object to {typeSpecificDesc} use <see cref=\"{typeof(BinaryData)}.FromObjectAsJson{{T}}(T, {typeof(JsonSerializerOptions)}?)\"/>."]));
                    result.Add(new XmlDocStatement("para", [$"To assign an already formatted json string to this property use <see cref=\"{typeof(BinaryData)}.FromString(string)\"/>."]));
                    if (unionRemarks is not null)
                    {
                        result.Add(new XmlDocStatement("para", [], innerStatements: unionRemarks));
                    }
                    XmlDocStatement[] bdListItems =
                    [
                        new XmlDocStatement("item", [],
                            new XmlDocStatement("term", [$"BinaryData.FromObjectAsJson(\"foo\")"]),
                            new XmlDocStatement("description", [$"Creates a payload of \"foo\"."])),
                        new XmlDocStatement("item", [],
                            new XmlDocStatement("term", [$"BinaryData.FromString(\"\\\"foo\\\"\")"]),
                            new XmlDocStatement("description", [$"Creates a payload of \"foo\"."])),
                        new XmlDocStatement("item", [],
                            new XmlDocStatement("term", [$"BinaryData.FromObjectAsJson(new {{ key = \"value\" }})"]),
                            new XmlDocStatement("description", [$"Creates a payload of {{ \"key\": \"value\" }}."])),
                        new XmlDocStatement("item", [],
                            new XmlDocStatement("term", [$"BinaryData.FromString(\"{{\\\"key\\\": \\\"value\\\"}}\")"]),
                            new XmlDocStatement("description", [$"Creates a payload of {{ \"key\": \"value\" }}."])),
                    ];
                    var bdList = new XmlDocStatement("<list type=\"bullet\">", "</list>", [], innerStatements: bdListItems);
                    result.Add(new XmlDocStatement("para", [$"Examples:"], innerStatements: bdList));
                    break;
            }

            return result;
        }
    }
}
