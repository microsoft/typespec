// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Serialization.Json;
using AutoRest.CSharp.Output.Models.Types;
using Azure;
using Azure.Core;

namespace AutoRest.CSharp.Generation.Writers
{
    internal static class JsonCodeWriterExtensions
    {
        public static FormattableString GetDeserializeValueFormattable(FormattableString element, CSharpType serializationType, SerializationFormat serializationFormat = SerializationFormat.Default, JsonSerializationOptions serializationOptions = JsonSerializationOptions.None)
        {
            if (serializationType.SerializeAs != null)
            {
                return $"({serializationType}){GetFrameworkTypeValueFormattable(serializationType.SerializeAs, element, serializationFormat, serializationType)}";
            }

            if (serializationType.IsFrameworkType)
            {
                var frameworkType = serializationType.FrameworkType;
                if (frameworkType == typeof(Nullable<>))
                {
                    frameworkType = serializationType.Arguments[0].FrameworkType;
                }

                return GetFrameworkTypeValueFormattable(frameworkType, element, serializationFormat, serializationType);
            }

            return GetDeserializeImplementationFormattable(serializationType.Implementation, element, serializationOptions);
        }

        public static FormattableString GetFrameworkTypeValueFormattable(Type frameworkType, FormattableString element, SerializationFormat format, CSharpType? serializationType)
        {
            bool includeFormat = false;

            if (frameworkType == typeof(ETag) ||
                frameworkType == typeof(Uri) ||
                frameworkType == typeof(ResourceIdentifier) ||
                frameworkType == typeof(ResourceType) ||
                frameworkType == typeof(ContentType) ||
                frameworkType == typeof(RequestMethod) ||
                frameworkType == typeof(AzureLocation))
            {
                return $"new {frameworkType}({element}.GetString())";
            }

            if (frameworkType == typeof(IPAddress))
            {
                return $"{frameworkType}.Parse({element}.GetString())";
            }

            var methodName = string.Empty;
            if (frameworkType == typeof(BinaryData))
            {
                switch (format)
                {
                    case SerializationFormat.Bytes_Base64: //intentional fall through
                    case SerializationFormat.Bytes_Base64Url:
                        return $"{typeof(BinaryData)}.FromBytes({element}.GetBytesFromBase64(\"{format.ToFormatSpecifier()}\"))";
                    default:
                        return $"{typeof(BinaryData)}.FromString({element}.GetRawText())";
                }
            }

            if (frameworkType == typeof(TimeSpan))
            {
                if (format == SerializationFormat.Duration_Seconds)
                {
                    return $"{typeof(TimeSpan)}.FromSeconds({element}.GetInt32())";
                }
                else if (format == SerializationFormat.Duration_Seconds_Float)
                {
                    return $"{typeof(TimeSpan)}.FromSeconds({element}.GetDouble())";
                }
            }

            if (frameworkType == typeof(DateTimeOffset))
            {
                if (format == SerializationFormat.DateTime_Unix)
                {
                    return $"{typeof(DateTimeOffset)}.FromUnixTimeSeconds({element}.GetInt64())";
                }
            }

            if (IsCustomJsonConverterAdded(frameworkType))
            {
                return $"{typeof(JsonSerializer)}.{nameof(JsonSerializer.Deserialize)}<{serializationType}>({element}.GetRawText())";
            }

            if (frameworkType == typeof(JsonElement))
                methodName = "Clone";
            if (frameworkType == typeof(object))
                methodName = "GetObject";
            if (frameworkType == typeof(bool))
                methodName = "GetBoolean";
            if (frameworkType == typeof(char))
                methodName = "GetChar";
            if (frameworkType == typeof(short))
                methodName = "GetInt16";
            if (frameworkType == typeof(int))
                methodName = "GetInt32";
            if (frameworkType == typeof(long))
                methodName = "GetInt64";
            if (frameworkType == typeof(float))
                methodName = "GetSingle";
            if (frameworkType == typeof(double))
                methodName = "GetDouble";
            if (frameworkType == typeof(decimal))
                methodName = "GetDecimal";
            if (frameworkType == typeof(string))
                methodName = "GetString";
            if (frameworkType == typeof(Guid))
                methodName = "GetGuid";

            if (frameworkType == typeof(byte[]))
            {
                methodName = "GetBytesFromBase64";
                includeFormat = true;
            }

            if (frameworkType == typeof(DateTimeOffset))
            {
                methodName = "GetDateTimeOffset";
                includeFormat = true;
            }

            if (frameworkType == typeof(DateTime))
            {
                methodName = "GetDateTime";
                includeFormat = true;
            }

            if (frameworkType == typeof(TimeSpan))
            {
                methodName = "GetTimeSpan";
                includeFormat = true;
            }

            if (includeFormat && format.ToFormatSpecifier() is { } formatString)
            {
                return $"{element}.{methodName}({formatString:L})";
            }

            return $"{element}.{methodName}()";
        }

        public static FormattableString GetDeserializeImplementationFormattable(TypeProvider implementation, FormattableString element, JsonSerializationOptions options)
        {
            switch (implementation)
            {
                case SystemObjectType systemObjectType when IsCustomJsonConverterAdded(systemObjectType.SystemType):
                    var optionalSerializeOptions = options == JsonSerializationOptions.UseManagedServiceIdentityV3 ? ", serializeOptions" : string.Empty;
                    return $"{typeof(JsonSerializer)}.{nameof(JsonSerializer.Deserialize)}<{implementation.Type}>({element}.GetRawText(){optionalSerializeOptions})";

                case Resource { ResourceData: SerializableObjectType { JsonSerialization: { }, IncludeDeserializer: true } resourceDataType } resource:
                    return $"new {resource.Type}(Client, {resourceDataType.Type}.Deserialize{resourceDataType.Declaration.Name}({element}))";

                case MgmtObjectType mgmtObjectType when TypeReferenceTypeChooser.HasMatch(mgmtObjectType.ObjectSchema):
                    return $"{typeof(JsonSerializer)}.{nameof(JsonSerializer.Deserialize)}<{implementation.Type}>({element}.GetRawText())";

                case SerializableObjectType { JsonSerialization: { }, IncludeDeserializer: true } type:
                    return $"{type.Type}.Deserialize{type.Declaration.Name}({element})";

                case EnumType clientEnum:
                    var value = GetFrameworkTypeValueFormattable(clientEnum.ValueType.FrameworkType, element, SerializationFormat.Default, null);
                    return clientEnum.IsExtensible
                        ? $"new {clientEnum.Type}({value})"
                        : (FormattableString)$"{value}.To{clientEnum.Type:D}()";

                default:
                    throw new NotSupportedException($"No deserialization logic exists for {implementation.Declaration.Name}");
            }
        }

        private static bool IsCustomJsonConverterAdded(Type type)
        {
            return type.GetCustomAttributes().Any(a => a.GetType() == typeof(JsonConverterAttribute));
        }
    }
}
