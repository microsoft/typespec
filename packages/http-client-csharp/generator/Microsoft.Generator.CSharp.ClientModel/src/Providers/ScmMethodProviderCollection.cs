// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.ClientModel.Primitives;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public class ScmMethodProviderCollection : MethodProviderCollection
    {
        private string _cleanOperationName;
        private readonly MethodProvider _createRequestMethod;

        private readonly string _createRequestMethodName;

        private ClientProvider Client { get; }

        public ScmMethodProviderCollection(InputOperation operation, TypeProvider enclosingType)
            : base(operation, enclosingType)
        {
            _cleanOperationName = operation.Name.ToCleanName();
            _createRequestMethodName = "Create" + _cleanOperationName + "Request";
            Client = enclosingType as ClientProvider ?? throw new InvalidOperationException("Scm methods can only be built for client types.");
            _createRequestMethod = Client.RestClient.GetCreateRequestMethod(Operation);
        }

        protected override IReadOnlyList<MethodProvider> BuildMethods()
        {
            var syncProtocol = BuildProtocolMethod(_createRequestMethod, false);
            var asyncProtocol = BuildProtocolMethod(_createRequestMethod, true);

            return
            [
                syncProtocol,
                asyncProtocol,
                BuildConvenienceMethod(syncProtocol, false),
                BuildConvenienceMethod(asyncProtocol, true),
            ];
        }

        private MethodProvider BuildConvenienceMethod(MethodProvider protocolMethod, bool isAsync)
        {
            if (EnclosingType is not ClientProvider client)
            {
                throw new InvalidOperationException("Protocol methods can only be built for client types.");
            }

            var methodModifier = MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual;
            if (isAsync)
            {
                methodModifier |= MethodSignatureModifiers.Async;
            }
            var methodSignature = new MethodSignature(
                isAsync ? _cleanOperationName + "Async" : _cleanOperationName,
                FormattableStringHelpers.FromString(Operation.Description),
                methodModifier,
                GetResponseType(Operation.Responses, true, isAsync, out var responseBodyType),
                null,
                ConvenienceMethodParameters);
            var processMessageName = isAsync ? "ProcessMessageAsync" : "ProcessMmessage";

            MethodBodyStatement[] methodBody;
            if (responseBodyType is null)
            {
                methodBody =
                [
                    .. GetStackVariablesForProtocolParamConversion(ConvenienceMethodParameters, out var paramDeclarations),
                    Return(This.Invoke(protocolMethod.Signature, [.. GetParamConversions(ConvenienceMethodParameters, paramDeclarations), Null], isAsync))
                ];
            }
            else
            {
                methodBody =
                [
                    .. GetStackVariablesForProtocolParamConversion(ConvenienceMethodParameters, out var paramDeclarations),
                    Declare("result", This.Invoke(protocolMethod.Signature, [.. GetParamConversions(ConvenienceMethodParameters, paramDeclarations), Null], isAsync).As<ClientResult>(), out ScopedApi<ClientResult> result),
                    .. GetStackVariablesForReturnValueConversion(result, responseBodyType, isAsync, out var declarations),
                    Return(Static<ClientResult>().Invoke(
                        nameof(ClientResult.FromValue),
                        [
                            responseBodyType.Equals(typeof(string)) ? result.GetRawResponse().Content().InvokeToString() : GetResultConversion(result, responseBodyType, declarations),
                            result.Invoke("GetRawResponse")
                        ])),
                ];
            }

            var convenienceMethod = new ScmMethodProvider(methodSignature, methodBody, EnclosingType);
            convenienceMethod.XmlDocs!.Exceptions.Add(new(typeof(ClientResultException), "Service returned a non-success status code.", []));
            return convenienceMethod;
        }

        private IEnumerable<MethodBodyStatement> GetStackVariablesForProtocolParamConversion(IReadOnlyList<ParameterProvider> convenienceMethodParameters, out Dictionary<string, ValueExpression> declarations)
        {
            List<MethodBodyStatement> statements = new List<MethodBodyStatement>();
            declarations = new Dictionary<string, ValueExpression>();
            foreach (var parameter in convenienceMethodParameters)
            {
                if (parameter.Location == ParameterLocation.Body)
                {
                    if (parameter.Type.IsReadOnlyMemory)
                    {
                        statements.Add(UsingDeclare("content", BinaryContentHelperSnippets.FromReadOnlyMemory(parameter), out var content));
                        declarations["content"] = content;
                    }
                    else if (parameter.Type.IsList)
                    {
                        statements.Add(UsingDeclare("content", BinaryContentHelperSnippets.FromEnumerable(parameter), out var content));
                        declarations["content"] = content;
                    }
                }
            }
            return statements;
        }

        private IEnumerable<MethodBodyStatement> GetStackVariablesForReturnValueConversion(ScopedApi<ClientResult> result, CSharpType responseBodyType, bool isAsync, out Dictionary<string, ValueExpression> declarations)
        {
            if (responseBodyType.IsList)
            {
                var elementType = responseBodyType.Arguments[0];
                if (!elementType.IsFrameworkType || elementType.Equals(typeof(TimeSpan)) || elementType.Equals(typeof(BinaryData)))
                {
                    var valueDeclaration = Declare("value", New.Instance(new CSharpType(typeof(List<>), elementType)).As(responseBodyType), out var value);
                    MethodBodyStatement[] statements =
                    [
                        valueDeclaration,
                        UsingDeclare("document", JsonDocumentSnippets.Parse(result.GetRawResponse().ContentStream(), isAsync), out var document),
                        ForeachStatement.Create("item", document.RootElement().EnumerateArray(), out ScopedApi<JsonElement> item)
                            .Add(GetElementConversion(elementType, item, value))
                    ];
                    declarations = new Dictionary<string, ValueExpression>
                    {
                        { "value", value }
                    };
                    return statements;
                }
            }

            declarations = [];
            return [];
        }

        private MethodBodyStatement GetElementConversion(CSharpType elementType, ScopedApi<JsonElement> item, ScopedApi value)
        {
            if (elementType.Equals(typeof(TimeSpan)))
            {
                return value.Add(item.Invoke("GetTimeSpan", Literal("P")));
            }
            else if (elementType.Equals(typeof(BinaryData)))
            {
                return new IfElseStatement(
                    item.ValueKind().Equal(JsonValueKindSnippets.Null),
                    value.Add(Null),
                    value.Add(BinaryDataSnippets.FromString(item.GetRawText())));
            }
            else
            {
                return value.Add(Static(elementType).Invoke($"Deserialize{elementType.Name}", item, ModelSerializationExtensionsSnippets.Wire));
            }
        }

        private ValueExpression GetResultConversion(ScopedApi<ClientResult> result, CSharpType responseBodyType, Dictionary<string, ValueExpression> declarations)
        {
            if (responseBodyType.Equals(typeof(BinaryData)))
            {
                return result.GetRawResponse().Content();
            }
            if (responseBodyType.IsList)
            {
                if (!responseBodyType.Arguments[0].IsFrameworkType || responseBodyType.Arguments[0].Equals(typeof(TimeSpan)) || responseBodyType.Arguments[0].Equals(typeof(BinaryData)))
                {
                    return declarations["value"];
                }
                else
                {
                    return result.GetRawResponse().Content().ToObjectFromJson(responseBodyType);
                }
            }
            return result.CastTo(responseBodyType);
        }

        private IReadOnlyList<ValueExpression> GetParamConversions(IReadOnlyList<ParameterProvider> convenienceMethodParameters, Dictionary<string, ValueExpression> declarations)
        {
            List<ValueExpression> conversions = new List<ValueExpression>();
            foreach (var param in convenienceMethodParameters)
            {
                if (param.Location == ParameterLocation.Body)
                {
                    if (param.Type.IsReadOnlyMemory || param.Type.IsList)
                    {
                        conversions.Add(declarations["content"]);
                    }
                    else if (param.Type.IsEnum)
                    {
                        conversions.Add(BinaryContentSnippets.Create(BinaryDataSnippets.FromObjectAsJson(param.Type.ToSerial(param))));
                    }
                    else if (param.Type.Equals(typeof(BinaryData)))
                    {
                        conversions.Add(BinaryContentSnippets.Create(param));
                    }
                    else if (param.Type.Equals(typeof(string)))
                    {
                        var bdExpression = Operation.RequestBodyMediaType == BodyMediaType.Json
                          ? BinaryDataSnippets.FromObjectAsJson(param)
                          : BinaryDataSnippets.FromString(param);
                        conversions.Add(BinaryContentSnippets.Create(bdExpression));
                    }
                    else
                    {
                        conversions.Add(param);
                    }
                }
                else if (param.Type.IsEnum)
                {
                    conversions.Add(param.Type.ToSerial(param));
                }
                else
                {
                    conversions.Add(param);
                }
            }
            return conversions;
        }

        public IReadOnlyList<ParameterProvider> MethodParameters => _createRequestMethod.Signature.Parameters;

        private IReadOnlyList<ParameterProvider>? _convenienceMethodParameters;
        private IReadOnlyList<ParameterProvider> ConvenienceMethodParameters => _convenienceMethodParameters ??= RestClientProvider.GetMethodParameters(Operation);

        private MethodProvider BuildProtocolMethod(MethodProvider createRequestMethod, bool isAsync)
        {
            ClientProvider? client = EnclosingType as ClientProvider;
            if (client is null)
            {
                throw new InvalidOperationException("Protocol methods can only be built for client types.");
            }

            var methodModifier = MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual;
            if (isAsync)
            {
                methodModifier |= MethodSignatureModifiers.Async;
            }
            var methodSignature = new MethodSignature(
                isAsync ? _cleanOperationName + "Async" : _cleanOperationName,
                FormattableStringHelpers.FromString(Operation.Description),
                methodModifier,
                GetResponseType(Operation.Responses, false, isAsync, out var responseBodyType),
                $"The response returned from the service.",
                MethodParameters);
            var processMessageName = isAsync ? "ProcessMessageAsync" : "ProcessMessage";

            MethodBodyStatement[] methodBody =
            [
                UsingDeclare("message", typeof(PipelineMessage), This.Invoke(createRequestMethod.Signature, [.. MethodParameters]), out var message),
                Return(Static<ClientResult>().Invoke(nameof(ClientResult.FromResponse), client.PipelineProperty.Invoke(processMessageName, [message, ScmKnownParameters.RequestOptions], isAsync, true))),
            ];

            var protocolMethod =
                new ScmMethodProvider(methodSignature, methodBody, EnclosingType) { IsServiceCall = true };
            protocolMethod.XmlDocs!.Exceptions.Add(new(typeof(ClientResultException), "Service returned a non-success status code.", []));
            List<XmlDocStatement> listItems =
            [
                new XmlDocStatement("item", [], new XmlDocStatement("description", [$"This <see href=\"https://aka.ms/azsdk/net/protocol-methods\">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios."]))
            ];
            XmlDocStatement listXmlDoc = new XmlDocStatement("<list type=\"bullet\">", "</list>", [], innerStatements: [.. listItems]);
            protocolMethod.XmlDocs.Summary = new XmlDocSummaryStatement([$"[Protocol Method] {Operation.Description}"], listXmlDoc);
            return protocolMethod;
        }

        private static CSharpType? GetResponseType(IReadOnlyList<OperationResponse> responses, bool isConvenience, bool isAsync, out CSharpType? responseBodyType)
        {
            responseBodyType = null;
            var returnType = isConvenience ? GetConvenienceReturnType(responses, out responseBodyType) : typeof(ClientResult);
            return isAsync ? new CSharpType(typeof(Task<>), returnType) : returnType;
        }

        private static CSharpType GetConvenienceReturnType(IReadOnlyList<OperationResponse> responses, out CSharpType? responseBodyType)
        {
            var response = responses.FirstOrDefault(r => !r.IsErrorResponse);
            responseBodyType = response?.BodyType is null ? null : ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(response.BodyType);
            return response is null || responseBodyType is null
                ? typeof(ClientResult)
                : new CSharpType(typeof(ClientResult<>), responseBodyType);
        }
    }
}
