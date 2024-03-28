// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Responses;
using AutoRest.CSharp.Output.Models.Shared;
using Azure.Core;

namespace AutoRest.CSharp.Generation.Writers
{
    internal static class ResponseWriterHelpers
    {
        public static void WriteRawResponseToGeneric(CodeWriter writer, RestClientMethod operation, Output.Models.Responses.Response response, bool async, string? messageVariableName, FormattableString responseVariable)
        {
            var returnType = operation.ReturnType;
            var headersModelType = operation.HeaderModel?.Type;

            ReturnKind kind;

            if (returnType != null && headersModelType != null)
            {
                kind = ReturnKind.HeadersAndValue;
            }
            else if (headersModelType != null)
            {
                kind = ReturnKind.Headers;
            }
            else if (returnType != null)
            {
                kind = ReturnKind.Value;
            }
            else
            {
                kind = ReturnKind.Response;
            }

            var responseBody = response.ResponseBody;
            ReferenceOrConstant value = default;

            var valueVariable = new CodeWriterDeclaration("value");
            switch (responseBody)
            {
                case ObjectResponseBody objectResponseBody:
                    writer.Line($"{responseBody.Type} {valueVariable:D} = default;");
                    writer.WriteDeserializationForMethods(objectResponseBody.Serialization, async, new VariableReference(responseBody.Type, valueVariable), $"{responseVariable}.{Configuration.ApiTypes.ContentStreamName}", objectResponseBody.Type);
                    value = new Reference(valueVariable.ActualName, responseBody.Type);
                    break;
                case StreamResponseBody _:
                    writer.Line($"var {valueVariable:D} = {messageVariableName}.ExtractResponseContent();");
                    value = new Reference(valueVariable.ActualName, responseBody.Type);
                    break;
                case ConstantResponseBody body:
                    writer.Append($"{returnType} {valueVariable:D} = ");
                    writer.WriteReferenceOrConstant(body.Value);
                    writer.Line($";");
                    value = new Reference(valueVariable.ActualName, responseBody.Type);
                    break;
                case StringResponseBody _:
                    var streamReaderVariable = new CodeWriterDeclaration("streamReader");
                    writer.Line($"{typeof(StreamReader)} {streamReaderVariable:D} = new {typeof(StreamReader)}({responseVariable}.{Configuration.ApiTypes.ContentStreamName});");
                    writer.Append($"{returnType} {valueVariable:D} = ");
                    if (async)
                    {
                        writer.Line($"await {streamReaderVariable}.ReadToEndAsync().ConfigureAwait(false);");
                    }
                    else
                    {
                        writer.Line($"{streamReaderVariable}.ReadToEnd();");
                    }
                    value = new Reference(valueVariable.ActualName, responseBody.Type);
                    break;
                default:
                    {
                        if (returnType != null)
                        {
                            value = Constant.Default(returnType.WithNullable(true));
                        }

                        break;
                    }
            }

            switch (kind)
            {
                case ReturnKind.Response:
                    writer.Append($"return {responseVariable};");
                    break;
                case ReturnKind.Headers:
                    writer.Append($"return {typeof(ResponseWithHeaders)}.FromValue(headers, {responseVariable});");
                    break;
                case ReturnKind.HeadersAndValue:
                    writer.Append($"return {typeof(ResponseWithHeaders)}.FromValue");
                    if (!Equals(responseBody?.Type, operation.ReturnType))
                    {
                        writer.Append($"<{operation.ReturnType}, {headersModelType}>");
                    }
                    writer.Append($"(");
                    writer.WriteReferenceOrConstant(value);
                    writer.Append($", headers, {responseVariable});");
                    break;
                case ReturnKind.Value:
                    writer.Append($"return {Configuration.ApiTypes.ResponseType}.FromValue");
                    if (!Equals(responseBody?.Type, operation.ReturnType))
                    {
                        writer.Append($"<{operation.ReturnType}>");
                    }
                    writer.Append($"(");
                    writer.WriteReferenceOrConstant(value);
                    writer.Append($", {responseVariable});");
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
        }

        public static void WriteStatusCodeSwitch(CodeWriter writer, string messageVariableName, RestClientMethod operation, bool async, FieldDeclaration? clientDiagnosticsField)
        {
            FormattableString responseVariable = $"{messageVariableName}.Response";

            var returnType = operation.ReturnType;
            var headersModelType = operation.HeaderModel?.Type;

            if (headersModelType != null)
            {
                writer.Line($"var headers = new {headersModelType}({responseVariable});");
            }

            using (writer.Scope($"switch ({responseVariable}.Status)"))
            {
                foreach (var response in operation.Responses)
                {
                    var responseBody = response.ResponseBody;
                    var statusCodes = response.StatusCodes;

                    foreach (var statusCode in statusCodes)
                    {
                        if (statusCode.Code != null)
                        {
                            writer.Line($"case {statusCode.Code}:");
                        }
                        else
                        {
                            writer.Line($"case int s when s >= {statusCode.Family * 100:L} && s < {statusCode.Family * 100 + 100:L}:");
                        }
                    }

                    using (responseBody != null ? writer.Scope() : default)
                    {
                        WriteRawResponseToGeneric(writer, operation, response, async, messageVariableName, responseVariable);
                    }
                }

                writer
                    .Line($"default:")
                    .Line($"throw new {Configuration.ApiTypes.RequestFailedExceptionType}({responseVariable});");
            }
        }

        private enum ReturnKind
        {
            Response,
            Headers,
            HeadersAndValue,
            Value
        }
    }
}
