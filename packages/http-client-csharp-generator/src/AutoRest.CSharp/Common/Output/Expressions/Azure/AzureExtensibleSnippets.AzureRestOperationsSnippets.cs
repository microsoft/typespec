// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using Azure.Core;

namespace AutoRest.CSharp.Common.Output.Expressions.Azure
{
    internal partial class AzureExtensibleSnippets
    {
        internal class AzureRestOperationsSnippets : RestOperationsSnippets
        {
            public override StreamExpression GetContentStream(TypedValueExpression response) => new ResponseExpression(response).ContentStream;

            public override TypedValueExpression GetTypedResponseFromValue(TypedValueExpression value, TypedValueExpression response)
                => ResponseExpression.FromValue(value, new ResponseExpression(response));

            public override TypedValueExpression GetTypedResponseFromModel(SerializableObjectType type, TypedValueExpression response)
            {
                var rawResponse = new ResponseExpression(response);
                var model = new InvokeStaticMethodExpression(type.Type, Configuration.ApiTypes.FromResponseName, new[] { rawResponse });
                return ResponseExpression.FromValue(model, rawResponse);
            }

            public override TypedValueExpression GetTypedResponseFromEnum(EnumType enumType, TypedValueExpression response)
            {
                var rawResponse = new ResponseExpression(response);
                return ResponseExpression.FromValue(EnumExpression.ToEnum(enumType, rawResponse.Content.ToObjectFromJson(typeof(string))), rawResponse);
            }

            public override TypedValueExpression GetTypedResponseFromBinaryData(Type responseType, TypedValueExpression response, string? contentType = null)
            {
                var rawResponse = new ResponseExpression(response);
                if (responseType == typeof(string) && contentType != null && FormattableStringHelpers.ToMediaType(contentType) == BodyMediaType.Text)
                {
                    return ResponseExpression.FromValue(rawResponse.Content.InvokeToString(), rawResponse);
                }
                return responseType == typeof(BinaryData)
                    ? ResponseExpression.FromValue(rawResponse.Content, rawResponse)
                    : ResponseExpression.FromValue(rawResponse.Content.ToObjectFromJson(responseType), rawResponse);
            }

            public override MethodBodyStatement DeclareHttpMessage(MethodSignatureBase createRequestMethodSignature, out TypedValueExpression message)
            {
                var messageVar = new VariableReference(typeof(HttpMessage), "message");
                message = messageVar;
                return Snippets.UsingDeclare(messageVar, new InvokeInstanceMethodExpression(null, createRequestMethodSignature.Name, createRequestMethodSignature.Parameters.Select(p => (ValueExpression)p).ToList(), null, false));
            }

            public override MethodBodyStatement DeclareContentWithUtf8JsonWriter(out TypedValueExpression content, out Utf8JsonWriterExpression writer)
            {
                var contentVar = new VariableReference(typeof(Utf8JsonRequestContent), "content");
                content = contentVar;
                writer = new Utf8JsonRequestContentExpression(content).JsonWriter;
                return Snippets.Var(contentVar, Snippets.New.Instance(typeof(Utf8JsonRequestContent)));
            }

            public override MethodBodyStatement DeclareContentWithXmlWriter(out TypedValueExpression content, out XmlWriterExpression writer)
            {
                var contentVar = new VariableReference(typeof(XmlWriterContent), "content");
                content = contentVar;
                writer = new XmlWriterContentExpression(content).XmlWriter;
                return Snippets.Var(contentVar, Snippets.New.Instance(typeof(XmlWriterContent)));
            }

            public override MethodBodyStatement InvokeServiceOperationCallAndReturnHeadAsBool(TypedValueExpression pipeline, TypedValueExpression message, TypedValueExpression clientDiagnostics, bool async)
                => Snippets.Return(new HttpPipelineExpression(pipeline).ProcessHeadAsBoolMessage(new HttpMessageExpression(message), clientDiagnostics, new RequestContextExpression(KnownParameters.RequestContext), async));

            public override TypedValueExpression InvokeServiceOperationCall(TypedValueExpression pipeline, TypedValueExpression message, bool async)
                => new HttpPipelineExpression(pipeline).ProcessMessage(new HttpMessageExpression(message), new RequestContextExpression(KnownParameters.RequestContext), null, async);
        }
    }
}
