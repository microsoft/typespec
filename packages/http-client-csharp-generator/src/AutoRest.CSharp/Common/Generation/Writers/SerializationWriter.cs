// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.ClientModel.Primitives;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Builders;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Serialization.Bicep;
using AutoRest.CSharp.Output.Models.Serialization.Json;
using AutoRest.CSharp.Output.Models.Serialization.Xml;
using AutoRest.CSharp.Output.Models.Types;
using Azure.Core;

namespace AutoRest.CSharp.Generation.Writers
{
    internal class SerializationWriter
    {
        public void WriteSerialization(CodeWriter writer, TypeProvider schema)
        {
            switch (schema)
            {
                case SerializableObjectType obj:
                    if (obj.IncludeSerializer || obj.IncludeDeserializer)
                    {
                        WriteObjectSerialization(writer, obj);
                    }
                    break;
                case EnumType { IsExtensible: false } sealedChoiceSchema:
                    WriteEnumSerialization(writer, sealedChoiceSchema);
                    break;
            }
        }

        private void WriteObjectSerialization(CodeWriter writer, SerializableObjectType model)
        {
            var declaration = model.Declaration;
            var json = model.JsonSerialization;
            var xml = model.XmlSerialization;
            var bicep = model.BicepSerialization;

            if (json == null && xml == null && bicep == null)
            {
                return;
            }
            using (writer.Namespace(declaration.Namespace))
            {
                if (json is { IncludeConverter: true })
                {
                    writer.Append($"[{typeof(JsonConverter)}(typeof({declaration.Name}Converter))]");
                }
                // write the serialization proxy attribute if the model is abstract
                if (Configuration.UseModelReaderWriter && declaration.IsAbstract && model.Discriminator is { } discriminator)
                {
                    var unknown = discriminator.DefaultObjectType;
                    writer.Append($"[{typeof(PersistableModelProxyAttribute)}(typeof({unknown.Type}))]");
                }

                writer.Append($"{declaration.Accessibility} partial {(model.IsStruct ? "struct" : "class")} {declaration.Name}")
                    .AppendRawIf(" : ", model.IncludeSerializer);

                if (json != null && model.IncludeSerializer)
                {
                    writer.Append($"{json.IJsonInterface}, ")
                        .AppendIf($"{json.IJsonModelInterface}, ", Configuration.UseModelReaderWriter);
                    if (Configuration.UseModelReaderWriter && json.IJsonModelObjectInterface is { } jsonModelObjectInterface)
                        writer.Append($"{jsonModelObjectInterface}, ");
                }

                if (xml != null && model.IncludeSerializer)
                {
                    writer.Append($"{xml.IXmlInterface}, ")
                        .AppendIf($"{xml.IPersistableModelTInterface}, ", Configuration.UseModelReaderWriter);
                }

                writer.RemoveTrailingComma();

                writer.Line();
                using (writer.Scope())
                {
                    if (xml != null)
                    {
                        WriteXmlSerialization(writer, model, xml);
                    }

                    if (json != null)
                    {
                        WriteJsonSerialization(writer, model, json);
                    }

                    if (bicep != null)
                    {
                        WriteBicepSerialization(writer, bicep);
                    }

                    WriteIModelImplementations(writer, model, json, xml, bicep);

                    foreach (var method in model.Methods)
                    {
                        writer.WriteXmlDocumentationSummary(method.Signature.Description);
                        writer.WriteXmlDocumentationParameters(method.Signature.Parameters);
                        writer.WriteMethod(method);
                    }

                    if (json is { IncludeConverter: true })
                    {
                        WriteCustomJsonConverter(writer, declaration, json.Type, model.IncludeSerializer, model.IncludeDeserializer);
                    }
                }
            }
        }

        private static void WriteCustomJsonConverter(CodeWriter writer, TypeDeclarationOptions declaration, CSharpType type, bool includeSerializer, bool includeDeserializer)
        {
            writer.Append($"internal partial class {declaration.Name}Converter : {typeof(JsonConverter)}<{type}>");
            using (writer.Scope())
            {
                using (writer.Scope($"public override void Write({typeof(Utf8JsonWriter)} writer, {type} model, {typeof(JsonSerializerOptions)} options)"))
                {
                    if (includeSerializer)
                    {
                        writer.Append($"writer.{nameof(Utf8JsonWriterExtensions.WriteObjectValue)}(model);");
                    }
                    else
                    {
                        writer.Append($"throw new {typeof(NotImplementedException)}();");
                    }
                }

                using (writer.Scope($"public override {type} Read(ref {typeof(Utf8JsonReader)} reader, {typeof(Type)} typeToConvert, {typeof(JsonSerializerOptions)} options)"))
                {
                    if (includeDeserializer)
                    {
                        var document = new CodeWriterDeclaration("document");
                        writer.Line($"using var {document:D} = {typeof(JsonDocument)}.ParseValue(ref reader);");
                        writer.Line($"return Deserialize{declaration.Name}({document}.RootElement);");
                    }
                    else
                    {
                        writer.Append($"throw new {typeof(NotImplementedException)}();");
                    }
                }
            }
        }

        /// <summary>
        /// This method writes the implementation of IXmlSerializable and the static deserialization method
        /// </summary>
        /// <param name="writer"></param>
        /// <param name="model"></param>
        /// <param name="xml"></param>
        private static void WriteXmlSerialization(CodeWriter writer, SerializableObjectType model, XmlObjectSerialization xml)
        {
            if (model.IncludeSerializer)
            {
                foreach (var method in XmlSerializationMethodsBuilder.BuildXmlSerializationMethods(xml))
                {
                    writer.WriteMethod(method);
                }
            }

            if (model.IncludeDeserializer)
                writer.WriteMethod(XmlSerializationMethodsBuilder.BuildDeserialize(model.Declaration, xml));
        }

        /// <summary>
        /// This method writes the implementation of IXmlSerializable and the static deserialization method
        /// </summary>
        /// <param name="writer"></param>
        /// <param name="bicep"></param>
        private static void WriteBicepSerialization(CodeWriter writer, BicepObjectSerialization bicep)
        {
            foreach (var method in BicepSerializationMethodsBuilder.BuildBicepSerializationMethods(bicep))
            {
                writer.WriteMethod(method);
            }
        }

        /// <summary>
        /// This method writes the implementation of IUtf8JsonSerializable, IJsonModel{T} and the static deserialization method
        /// If the model is defined as a struct, including the implementation of IJsonModel{object}
        /// NOTE: the inherited methods from IModel{T} and IModel{object} is excluded
        /// </summary>
        /// <param name="writer"></param>
        /// <param name="model"></param>
        /// <param name="json"></param>
        private static void WriteJsonSerialization(CodeWriter writer, SerializableObjectType model, JsonObjectSerialization json)
        {
            // the methods that implement the interface IJsonModel<T> (and IJsonModel<object> if eligible) (do not include the methods inherited from IModel<T> or IModel<object>)
            if (model.IncludeSerializer)
            {
                foreach (var method in JsonSerializationMethodsBuilder.BuildJsonSerializationMethods(json))
                {
                    writer.WriteMethod(method);
                }
            }

            // the deserialize static method
            if (model.IncludeDeserializer)
            {
                if (JsonSerializationMethodsBuilder.BuildDeserialize(model.Declaration, json, model.GetExistingType()) is { } deserialize)
                {
                    writer.WriteMethod(deserialize);
                }
            }
        }

        /// <summary>
        /// This method writes the implementation of IModel{T}
        /// </summary>
        /// <param name="writer"></param>
        /// <param name="model"></param>
        /// <param name="json"></param>
        /// <param name="xml"></param>
        /// <param name="bicep"></param>
        private static void WriteIModelImplementations(CodeWriter writer, SerializableObjectType model, JsonObjectSerialization? json, XmlObjectSerialization? xml, BicepObjectSerialization? bicep)
        {
            foreach (var method in JsonSerializationMethodsBuilder.BuildIModelMethods(json, xml, bicep))
            {
                writer.WriteMethod(method);
            }
        }

        public static void WriteEnumSerialization(CodeWriter writer, EnumType enumType)
        {
            using (writer.Namespace(enumType.Declaration.Namespace))
            {
                string declaredTypeName = enumType.Declaration.Name;

                var isString = enumType.ValueType.FrameworkType == typeof(string);

                using (writer.Scope($"internal static partial class {declaredTypeName}Extensions"))
                {
                    if (!enumType.IsIntValueType)
                    {
                        WriteEnumSerializationMethod(writer, enumType, declaredTypeName);
                    }

                    WriteEnumDeserializationMethod(writer, enumType, declaredTypeName, isString);
                }
            }
        }

        private static void WriteEnumSerializationMethod(CodeWriter writer, EnumType enumType, string declaredTypeName)
        {
            using (writer.Scope($"public static {enumType.ValueType} {enumType.SerializationMethodName}(this {declaredTypeName} value) => value switch", end: "};"))
            {
                foreach (EnumTypeValue value in enumType.Values)
                {
                    writer.Line($"{declaredTypeName}.{value.Declaration.Name} => {value.Value.Value:L},");
                }

                writer.Line($"_ => throw new {typeof(ArgumentOutOfRangeException)}(nameof(value), value, \"Unknown {declaredTypeName} value.\")");
            }
            writer.Line();
        }

        private static void WriteEnumDeserializationMethod(CodeWriter writer, EnumType schema, string declaredTypeName, bool isString)
        {
            using (writer.Scope($"public static {declaredTypeName} To{declaredTypeName}(this {schema.ValueType} value)"))
            {
                if (isString)
                {
                    foreach (EnumTypeValue value in schema.Values)
                    {
                        if (value.Value.Value is string strValue && strValue.All(char.IsAscii))
                        {
                            writer.Append($"if ({typeof(StringComparer)}.{nameof(StringComparer.OrdinalIgnoreCase)}.{nameof(StringComparer.Equals)}(value, {strValue:L}))");
                        }
                        else
                        {
                            writer.Append($"if ({schema.ValueType}.Equals(value, {value.Value.Value:L}");
                            writer.Append($", {typeof(StringComparison)}.InvariantCultureIgnoreCase))");
                        }
                        writer.Line($" return {declaredTypeName}.{value.Declaration.Name};");
                    }
                }
                else// int, and float
                {
                    foreach (EnumTypeValue value in schema.Values)
                    {
                        writer.Line($"if (value == {value.Value.Value:L}) return {declaredTypeName}.{value.Declaration.Name};");
                    }
                }

                writer.Line($"throw new {typeof(ArgumentOutOfRangeException)}(nameof(value), value, \"Unknown {declaredTypeName} value.\");");
            }
            writer.Line();
        }
    }
}
