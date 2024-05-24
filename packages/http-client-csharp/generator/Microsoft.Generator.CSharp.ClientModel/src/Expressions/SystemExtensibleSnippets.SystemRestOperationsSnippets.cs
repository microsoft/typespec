// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Internal;
using System.ClientModel.Primitives;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal partial class SystemExtensibleSnippets
    {
        private class SystemRestOperationsSnippets : RestOperationsSnippets
        {
            public override StreamExpression GetContentStream(TypedValueExpression result)
                => new ClientResultExpression(result).GetRawResponse().ContentStream;

            public override TypedValueExpression GetTypedResponseFromValue(TypedValueExpression value, TypedValueExpression result)
            {
                return ClientResultExpression.FromValue(value, GetRawResponse(result));
            }

            public override TypedValueExpression GetTypedResponseFromModel(TypeProvider typeProvider, TypedValueExpression result)
            {
                var response = GetRawResponse(result);
                var model = new InvokeStaticMethodExpression(typeProvider.Type, ClientModelPlugin.Instance.Configuration.ApiTypes.FromResponseName, new[] { response });
                return ClientResultExpression.FromValue(model, response);
            }

            public override TypedValueExpression GetTypedResponseFromEnum(EnumTypeProvider enumType, TypedValueExpression result)
            {
                var response = GetRawResponse(result);
                return ClientResultExpression.FromValue(EnumExpression.ToEnum(enumType, response.Content.ToObjectFromJson(typeof(string))), response);
            }

            public override TypedValueExpression GetTypedResponseFromBinaryData(Type responseType, TypedValueExpression result, string? contentType = null)
            {
                var rawResponse = GetRawResponse(result);
                if (responseType == typeof(string) && contentType != null && FormattableStringHelpers.ToMediaType(contentType) == BodyMediaType.Text)
                {
                    return ClientResultExpression.FromValue(rawResponse.Content.InvokeToString(), rawResponse);
                }
                return responseType == typeof(BinaryData)
                    ? ClientResultExpression.FromValue(rawResponse.Content, rawResponse)
                    : ClientResultExpression.FromValue(rawResponse.Content.ToObjectFromJson(responseType), rawResponse);
            }

            public override MethodBodyStatement DeclareHttpMessage(MethodSignatureBase createRequestMethodSignature, out TypedValueExpression message)
            {
                var messageVar = new VariableReference(typeof(PipelineMessage), "message");
                message = messageVar;
                return Snippets.UsingDeclare(messageVar, new InvokeInstanceMethodExpression(null, createRequestMethodSignature.Name, createRequestMethodSignature.Parameters.Select(p => (ValueExpression)p).ToList(), null, false));
            }

            public override MethodBodyStatement DeclareContentWithUtf8JsonWriter(out TypedValueExpression content, out Utf8JsonWriterExpression writer)
            {
                var contentVar = new VariableReference(typeof(BinaryContent), "content");
                content = contentVar;
                writer = new Utf8JsonWriterExpression(content.Property("JsonWriter"));
                return Snippets.Var(contentVar, Snippets.New.Instance(typeof(BinaryContent)));
            }

            private static PipelineResponseExpression GetRawResponse(TypedValueExpression result)
                => result.Type.Equals(typeof(PipelineResponse))
                    ? new PipelineResponseExpression(result)
                    : new ClientResultExpression(result).GetRawResponse();
        }
    }
}
