// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal partial class SystemExtensibleSnippets
    {
        private class SystemRestOperationsSnippets : RestOperationsSnippets
        {
            public override StreamSnippet GetContentStream(TypedSnippet result)
                => new ClientResultSnippet(result).GetRawResponse().ContentStream;

            public override TypedSnippet GetTypedResponseFromValue(TypedSnippet value, TypedSnippet result)
            {
                return ClientResultSnippet.FromValue(value, GetRawResponse(result));
            }

            public override TypedSnippet GetTypedResponseFromModel(TypeProvider typeProvider, TypedSnippet result)
            {
                var response = GetRawResponse(result);
                var model = new InvokeStaticMethodExpression(typeProvider.Type, ClientModelPlugin.Instance.Configuration.ApiTypes.FromResponseName, [response]);
                return ClientResultSnippet.FromValue(model, response);
            }

            public override TypedSnippet GetTypedResponseFromEnum(EnumProvider enumType, TypedSnippet result)
            {
                var response = GetRawResponse(result);
                return ClientResultSnippet.FromValue(enumType.ToEnum(response.Content.ToObjectFromJson(typeof(string))), response);
            }

            public override TypedSnippet GetTypedResponseFromBinaryData(Type responseType, TypedSnippet result, string? contentType = null)
            {
                var rawResponse = GetRawResponse(result);
                if (responseType == typeof(string) && contentType != null && FormattableStringHelpers.ToMediaType(contentType) == BodyMediaType.Text)
                {
                    return ClientResultSnippet.FromValue(rawResponse.Content.Untyped.InvokeToString(), rawResponse);
                }
                return responseType == typeof(BinaryData)
                    ? ClientResultSnippet.FromValue(rawResponse.Content, rawResponse)
                    : ClientResultSnippet.FromValue(rawResponse.Content.ToObjectFromJson(responseType), rawResponse);
            }

            public override MethodBodyStatement DeclareHttpMessage(MethodSignatureBase createRequestMethodSignature, out TypedSnippet message)
            {
                var messageVar = new VariableReferenceSnippet(typeof(PipelineMessage), "message");
                message = messageVar;
                return Snippet.UsingDeclare(messageVar, new InvokeInstanceMethodExpression(null, createRequestMethodSignature.Name, createRequestMethodSignature.Parameters.Select(p => (ValueExpression)p).ToList(), null, false));
            }

            public override MethodBodyStatement DeclareContentWithUtf8JsonWriter(out TypedSnippet content, out Utf8JsonWriterSnippet writer)
            {
                var contentVar = new VariableReferenceSnippet(typeof(BinaryContent), "content");
                content = contentVar;
                writer = new Utf8JsonWriterSnippet(content.Property("JsonWriter"));
                return Snippet.Var(contentVar, Snippet.New.Instance(typeof(BinaryContent)));
            }

            private static PipelineResponseSnippet GetRawResponse(TypedSnippet result)
                => result.Type.Equals(typeof(PipelineResponse))
                    ? new PipelineResponseSnippet(result)
                    : new ClientResultSnippet(result).GetRawResponse();
        }
    }
}
