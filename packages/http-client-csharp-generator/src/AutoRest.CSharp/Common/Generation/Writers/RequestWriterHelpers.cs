// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Builders;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Serialization.Json;
using AutoRest.CSharp.Output.Models.Serialization.Xml;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Azure;
using Azure.Core;
using static AutoRest.CSharp.Common.Output.Models.Snippets;
using Request = Azure.Core.Request;

namespace AutoRest.CSharp.Generation.Writers
{
    internal static class RequestWriterHelpers
    {
        public static void WriteRequestCreation(CodeWriter writer, RestClientMethod clientMethod, string methodAccessibility, ClientFields? fields, string? responseClassifierType, bool writeSDKUserAgent, IReadOnlyList<Parameter>? clientParameters = null)
        {
            using var methodScope = writer.AmbientScope();
            var parameters = clientMethod.Parameters;

            var methodName = CreateRequestMethodName(clientMethod.Name);
            writer.Append($"{methodAccessibility} {Configuration.ApiTypes.HttpMessageType} {methodName}(");
            foreach (Parameter clientParameter in parameters)
            {
                writer.Append($"{clientParameter.Type} {clientParameter.Name:D},");
            }
            writer.RemoveTrailingComma();
            writer.Line($")");
            using (writer.Scope())
            {
                var message = new CodeWriterDeclaration("message");
                var request = new CodeWriterDeclaration("request");
                var uri = new CodeWriterDeclaration("uri");

                if (clientMethod.Parameters.Contains(KnownParameters.RequestContext))
                {
                    writer.Append($"var {message:D} = {Configuration.ApiTypes.GetHttpPipelineCreateMessageFormat(true)}");
                    if (responseClassifierType != default)
                    {
                        writer.Append($", {responseClassifierType}");
                    }
                    writer.Line($");");
                }
                else
                {
                    writer.Line($"var {message:D} = {Configuration.ApiTypes.GetHttpPipelineCreateMessageFormat(false)});");
                }

                writer.Line($"var {request:D} = {message}.{Configuration.ApiTypes.HttpMessageRequestName};");

                var method = clientMethod.Request.HttpMethod;
                if (!clientMethod.BufferResponse)
                {
                    writer.Line($"{message}.BufferResponse = false;");
                }
                writer.Line(Configuration.ApiTypes.GetSetMethodString(request.ActualName, method.Method));

                writer.Line($"var {uri:D} = new {Configuration.ApiTypes.RequestUriType}();");
                foreach (var segment in clientMethod.Request.PathSegments)
                {
                    var value = GetFieldReference(fields, segment.Value);
                    if (value.Type.IsFrameworkType && value.Type.FrameworkType == typeof(Uri))
                    {
                        writer.Append($"{uri}.Reset(");
                        WriteConstantOrParameter(writer, value, enumAsString: !segment.IsRaw);
                        writer.Line($");");
                    }
                    else if (!value.IsConstant && value.Reference.Name == "nextLink")
                    {
                        WritePathSegment(writer, uri, segment, value, "AppendRawNextLink");
                    }
                    else
                    {
                        WritePathSegment(writer, uri, segment, value);
                    }
                }

                //TODO: Duplicate code between query and header parameter processing logic
                foreach (var queryParameter in clientMethod.Request.Query)
                {
                    WriteQueryParameter(writer, uri, queryParameter, fields, clientParameters);
                }

                writer.Line(Configuration.ApiTypes.GetSetUriString(request.ActualName, uri.ActualName));

                WriteHeaders(writer, clientMethod, request, content: false, fields);

                switch (clientMethod.Request.Body)
                {
                    case RequestContentRequestBody body:
                        WriteHeaders(writer, clientMethod, request, content: true, fields);
                        writer.Line(Configuration.ApiTypes.GetSetContentString(request.ActualName, body.Parameter.Name));
                        break;
                    case SchemaRequestBody body:
                        using (WriteValueNullCheck(writer, body.Value))
                        {
                            WriteHeaders(writer, clientMethod, request, content: true, fields);
                            WriteSerializeContent(writer, request, body.Serialization, GetConstantOrParameter(body.Value, ignoreNullability: true, convertBinaryDataToArray: false));
                        }

                        break;
                    case BinaryRequestBody binaryBody:
                        using (WriteValueNullCheck(writer, binaryBody.Value))
                        {
                            WriteHeaders(writer, clientMethod, request, content: true, fields);
                            writer.Append($"{request}.Content = {Configuration.ApiTypes.RequestContentType}.{Configuration.ApiTypes.RequestContentCreateName}(");
                            WriteConstantOrParameter(writer, binaryBody.Value);
                            writer.Line($");");
                        }
                        break;
                    case TextRequestBody textBody:
                        using (WriteValueNullCheck(writer, textBody.Value))
                        {
                            WriteHeaders(writer, clientMethod, request, content: true, fields);
                            writer.Append($"{request}.Content = new {typeof(StringRequestContent)}(");
                            WriteConstantOrParameter(writer, textBody.Value);
                            writer.Line($");");
                        }
                        break;
                    case MultipartRequestBody multipartRequestBody:
                        WriteHeaders(writer, clientMethod, request, content: true, fields);

                        var multipartContent = new CodeWriterDeclaration("content");
                        writer.Line($"var {multipartContent:D} = new {typeof(MultipartFormDataContent)}();");

                        foreach (var bodyParameter in multipartRequestBody.RequestBodyParts)
                        {
                            switch (bodyParameter.Content)
                            {
                                case BinaryRequestBody binaryBody:
                                    using (WriteValueNullCheck(writer, binaryBody.Value))
                                    {
                                        writer.Append($"{multipartContent}.Add({Configuration.ApiTypes.RequestContentType}.{Configuration.ApiTypes.RequestContentCreateName}(");
                                        WriteConstantOrParameter(writer, binaryBody.Value);
                                        writer.Line($"), {bodyParameter.Name:L}, null);");
                                    }
                                    break;
                                case TextRequestBody textBody:
                                    using (WriteValueNullCheck(writer, textBody.Value))
                                    {
                                        writer.Append($"{multipartContent}.Add(new {typeof(StringRequestContent)}(");
                                        WriteConstantOrParameter(writer, textBody.Value);
                                        writer.Line($"), {bodyParameter.Name:L}, null);");
                                    }
                                    break;
                                case BinaryCollectionRequestBody collectionBody:
                                    var collectionItemVariable = new CodeWriterDeclaration("value");
                                    using (writer.Scope($"foreach (var {collectionItemVariable:D} in {collectionBody.Value.Reference.Name})"))
                                    {
                                        writer.Append($"{multipartContent}.Add({Configuration.ApiTypes.RequestContentType}.{Configuration.ApiTypes.RequestContentCreateName}({collectionItemVariable}), {bodyParameter.Name:L}, null);");
                                    }
                                    break;
                                default:
                                    throw new NotImplementedException(bodyParameter.Content?.GetType().FullName);
                            }
                        }
                        writer.Line($"{multipartContent}.ApplyToRequest({request});");
                        break;
                    case FlattenedSchemaRequestBody flattenedSchemaRequestBody:
                        WriteHeaders(writer, clientMethod, request, content: true, fields);

                        var initializers = new List<PropertyInitializer>();
                        foreach (var initializer in flattenedSchemaRequestBody.Initializers)
                        {
                            initializers.Add(new PropertyInitializer(initializer.Property.Declaration.Name, initializer.Property.Declaration.Type, initializer.Property.IsReadOnly, initializer.Value.GetReferenceOrConstantFormattable(), initializer.Value.Type));
                        }
                        var modelVariable = new CodeWriterDeclaration("model");
                        writer.WriteInitialization(
                                v => writer.Line($"var {modelVariable:D} = {v};"),
                                flattenedSchemaRequestBody.ObjectType,
                                flattenedSchemaRequestBody.ObjectType.InitializationConstructor,
                                initializers);

                        WriteSerializeContent(writer, request, flattenedSchemaRequestBody.Serialization, $"{modelVariable:I}");
                        break;
                    case UrlEncodedBody urlEncodedRequestBody:
                        var urlContent = new CodeWriterDeclaration("content");

                        WriteHeaders(writer, clientMethod, request, content: true, fields);
                        writer.Line($"var {urlContent:D} = new {typeof(FormUrlEncodedContent)}();");

                        foreach (var (name, value) in urlEncodedRequestBody.Values)
                        {
                            using (WriteValueNullCheck(writer, value))
                            {
                                writer.Append($"{urlContent}.Add({name:L},");
                                WriteConstantOrParameterAsString(writer, value);
                                writer.Line($");");
                            }
                        }
                        writer.Line($"{request}.Content = {urlContent};");
                        break;
                    case null:
                        break;
                    default:
                        throw new NotImplementedException(clientMethod.Request.Body?.GetType().FullName);
                }

                if (writeSDKUserAgent)
                {
                    writer.Line($"_userAgent.Apply({message});");
                }

                writer.Line($"return {message};");
            }
            writer.Line();
        }

        private static ReferenceOrConstant GetFieldReference(ClientFields? fields, ReferenceOrConstant value) =>
            fields != null && !value.IsConstant ? fields.GetFieldByParameter(value.Reference.Name, value.Reference.Type) ?? value : value;

        private static ReferenceOrConstant GetReferenceForQueryParameter(ClientFields? fields, QueryParameter parameter)
        {
            var value = parameter.Value;
            if (fields is null ||
                value.IsConstant is true ||
                (value.Reference.Name == "apiVersion" && parameter.IsApiVersion is false))// strictly check api-version parameter name
            {
                return parameter.Value;
            }

            return fields.GetFieldByParameter(value.Reference.Name, value.Reference.Type) ?? value;
        }

        public static void WriteHeaders(CodeWriter writer, RestClientMethod clientMethod, CodeWriterDeclaration request, bool content, ClientFields? fields)
        {
            foreach (var header in clientMethod.Request.Headers)
            {
                if (header.IsContentHeader == content)
                {
                    Configuration.ApiTypes.WriteHeaderMethod(writer, request, header, fields);
                }
            }
        }

        public static string CreateRequestMethodName(RestClientMethod method) => CreateRequestMethodName(method.Name);
        public static string CreateRequestMethodName(string name) => $"Create{name}Request";

        private static void WriteSerializeContent(CodeWriter writer, CodeWriterDeclaration request, ObjectSerialization bodySerialization, FormattableString value)
        {
            writer.WriteMethodBodyStatement(GetRequestContentForSerialization(request, bodySerialization, value));
        }

        private static MethodBodyStatement GetRequestContentForSerialization(CodeWriterDeclaration request, ObjectSerialization serialization, FormattableString value)
        {
            var valueExpression = new FormattableStringToExpression(value);
            var requestExpression = new VariableReference(typeof(Request), request);

            return serialization switch
            {
                JsonSerialization jsonSerialization => new[]
                {
                    Extensible.RestOperations.DeclareContentWithUtf8JsonWriter(out var utf8JsonContent, out var writer),
                    JsonSerializationMethodsBuilder.SerializeExpression(writer, jsonSerialization, valueExpression),
                    Assign(requestExpression.Property(nameof(Request.Content)), utf8JsonContent)
                },

                XmlElementSerialization xmlSerialization => new[]
                {
                    Extensible.RestOperations.DeclareContentWithXmlWriter(out var utf8JsonContent, out var writer),
                    XmlSerializationMethodsBuilder.SerializeExpression(writer, xmlSerialization, valueExpression),
                    Assign(requestExpression.Property(nameof(Request.Content)), utf8JsonContent)
                },

                _ => throw new NotImplementedException()
            };
        }

        internal static void WriteHeader(CodeWriter writer, CodeWriterDeclaration request, RequestHeader header, ClientFields? fields)
        {
            string? delimiter = header.Delimiter;
            string method = delimiter != null
                ? nameof(RequestHeaderExtensions.AddDelimited)
                : nameof(RequestHeaderExtensions.Add);

            var value = GetFieldReference(fields, header.Value);
            using (WriteValueNullCheck(writer, value))
            {
                if (value.Type.Equals(typeof(MatchConditions)) || value.Type.Equals(typeof(RequestConditions)))
                {
                    writer.Append($"{request}.Headers.{method}(");
                }
                else
                {
                    writer.Append($"{request}.Headers.{method}({header.Name:L}, ");
                }

                if (value.Type.Equals(typeof(ContentType)))
                {
                    WriteConstantOrParameterAsString(writer, value);
                }
                else
                {
                    WriteConstantOrParameter(writer, value, enumAsString: true);
                }

                if (delimiter != null)
                {
                    writer.Append($", {delimiter:L}");
                }
                WriteSerializationFormat(writer, header.Format);
                writer.Line($");");
            }
        }

        internal static void WriteHeaderSystem(CodeWriter writer, CodeWriterDeclaration request, RequestHeader header, ClientFields? fields)
        {
            string? delimiter = header.Delimiter;

            var value = GetFieldReference(fields, header.Value);
            using (WriteValueNullCheck(writer, value))
            {
                writer.Append($"{request}.SetHeaderValue({header.Name:L}, ");
                WriteConstantOrParameter(writer, value, enumAsString: true);
                var formatSpecifier = header.Format.ToFormatSpecifier();
                if (formatSpecifier != null)
                {
                    writer.Append($".ToString({formatSpecifier:L})");
                }
                writer.Line($");");
            }
        }

        private static void WritePathSegment(CodeWriter writer, CodeWriterDeclaration uri, PathSegment segment, ReferenceOrConstant value, string? methodName = null)
        {
            methodName ??= segment.IsRaw ? "AppendRaw" : "AppendPath";
            writer.Append($"{uri}.{methodName}(");
            WriteConstantOrParameter(writer, value, enumAsString: !segment.IsRaw || TypeFactory.IsExtendableEnum(value.Type));
            if (!Configuration.IsBranded)
            {
                if (value.Type.IsFrameworkType && value.Type.FrameworkType != typeof(string))
                {
                    writer.Append($".ToString(");
                    WriteSerializationFormat(writer, segment.Format);
                    writer.AppendRaw(")");
                }
            }
            else
            {
                WriteSerializationFormat(writer, segment.Format);
            }
            writer.Line($", {segment.Escape:L});");
        }

        private static void WriteConstantOrParameterAsString(CodeWriter writer, ReferenceOrConstant constantOrReference)
        {
            WriteConstantOrParameter(writer, constantOrReference, enumAsString: true);
            if (constantOrReference.Type.IsFrameworkType && constantOrReference.Type.FrameworkType != typeof(string))
            {
                writer.Append($".ToString()");
            }
        }

        private static void WriteConstantOrParameter(CodeWriter writer, ReferenceOrConstant constantOrReference, bool ignoreNullability = false, bool enumAsString = false)
        {
            writer.Append(GetConstantOrParameter(constantOrReference, ignoreNullability));

            if (enumAsString &&
                !constantOrReference.Type.IsFrameworkType &&
                constantOrReference.Type.Implementation is EnumType enumType)
            {
                writer.AppendEnumToString(enumType);
            }
        }

        private static FormattableString GetConstantOrParameter(ReferenceOrConstant constantOrReference, bool ignoreNullability = false, bool convertBinaryDataToArray = true)
        {
            if (constantOrReference.IsConstant)
            {
                return constantOrReference.Constant.GetConstantFormattable(!Configuration.IsBranded);
            }

            if (!ignoreNullability && constantOrReference.Type.IsNullable && constantOrReference.Type.IsValueType)
            {
                return $"{constantOrReference.Reference.Name:I}.Value";
            }

            if (constantOrReference.Type.Equals(typeof(BinaryData)) && convertBinaryDataToArray)
            {
                return $"{constantOrReference.Reference.Name:I}.ToArray()";
            }

            return $"{constantOrReference.Reference.Name:I}";
        }

        private static void WriteSerializationFormat(CodeWriter writer, SerializationFormat format)
        {
            var formatSpecifier = format.ToFormatSpecifier();
            if (formatSpecifier != null)
            {
                if (Configuration.IsBranded)
                {
                    writer.Append($", {formatSpecifier:L}");
                }
                else
                {
                    writer.Append($"{formatSpecifier:L}");
                }
            }
        }

        private static void WriteQueryParameter(CodeWriter writer, CodeWriterDeclaration uri, QueryParameter queryParameter, ClientFields? fields, IReadOnlyList<Parameter>? parameters)
        {
            string? delimiter = queryParameter.Delimiter;
            bool explode = queryParameter.Explode;
            string method = delimiter != null && !explode
                ? nameof(RequestUriBuilderExtensions.AppendQueryDelimited)
                : nameof(RequestUriBuilderExtensions.AppendQuery);

            var value = GetReferenceForQueryParameter(fields, queryParameter);
            var parameter = parameters != null && queryParameter.Name == "api-version" ? parameters.FirstOrDefault(p => p.Name == "apiVersion") : null;
            using (parameter != null && parameter.IsOptionalInSignature ? null : WriteValueNullCheck(writer, value, checkUndefinedCollection: true))
            {
                if (explode)
                {
                    var paramVariable = new CodeWriterDeclaration("param");
                    writer.Append($"foreach(var {paramVariable:D} in ");
                    WriteConstantOrParameter(writer, value, enumAsString: true);
                    writer.Line($")");
                    using (writer.Scope())
                    {
                        writer.Append($"{uri}.{method}({queryParameter.Name:L}, ");
                        WriteConstantOrParameter(writer, new Reference(paramVariable.ActualName, value.Type.IsGenericType ? value.Type.Arguments[0] : value.Type), enumAsString: true);
                        WriteSerializationFormat(writer, queryParameter.SerializationFormat);
                        writer.Line($", {queryParameter.Escape:L});");
                    }
                }
                else
                {
                    writer.Append($"{uri}.{method}({queryParameter.Name:L}, ");
                    WriteConstantOrParameter(writer, value, enumAsString: true);
                    if (delimiter != null)
                    {
                        writer.Append($", {delimiter:L}");
                    }
                    WriteSerializationFormat(writer, queryParameter.SerializationFormat);
                    writer.Line($", {queryParameter.Escape:L});");
                }
            }
        }

        private static CodeWriter.CodeWriterScope? WriteValueNullCheck(CodeWriter writer, ReferenceOrConstant value, bool checkUndefinedCollection = false)
        {
            if (value.IsConstant)
                return default;

            var type = value.Type;
            string valueStr = GetValueExpression(writer, value);
            ValueExpression valueExpression = new FormattableStringToExpression($"{valueStr}");
            CodeWriterDeclaration changeTrackingList = new CodeWriterDeclaration("changeTrackingList");
            if (checkUndefinedCollection && TypeFactory.IsCollectionType(type))
            {
                writer.Append($"if (");

                writer.WriteValueExpression(valueExpression);

                writer.Append($" != null && !(");
                writer.WriteValueExpression(valueExpression);
                writer.Append($" is {ChangeTrackingListProvider.Instance.Type.MakeGenericType(type.Arguments)} {changeTrackingList:D} && {changeTrackingList}.IsUndefined)");

                return writer.LineRaw(")").Scope();
            }
            else if (type.IsNullable)
            {
                writer.Append($"if (");

                writer.WriteValueExpression(valueExpression);

                return writer.Line($" != null)").Scope();
            }

            return default;
        }

        private static string GetValueExpression(CodeWriter writer, ReferenceOrConstant value)
        {
            // turn "object.Property" into "object?.Property"
            StringBuilder builder = new StringBuilder();
            var parts = value.Reference.Name.Split(".");
            bool first = true;
            foreach (var part in parts)
            {
                if (first)
                {
                    first = false;
                }
                else
                {
                    builder.Append("?.");
                }

                if (StringExtensions.IsCSharpKeyword(part))
                {
                    builder.Append("@");
                }
                builder.Append(part);
            }
            return builder.ToString();
        }
    }
}
