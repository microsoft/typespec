// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal class CollectionResultDefinition : TypeProvider
    {
        private readonly InputOperation _operation;
        private readonly bool _isAsync;
        private readonly ClientProvider _client;
        private readonly FieldProvider _clientField;
        private readonly FieldProvider? _optionsField;
        private readonly CSharpType _responseType;
        private readonly CSharpType? _itemModelType;
        private readonly string? _nextPagePropertyName;
        private readonly InputResponseLocation? _nextPageLocation;

        private static readonly ParameterProvider PageParameter =
            new("page", FormattableStringHelpers.Empty, new CSharpType(typeof(ClientResult)));

        private readonly string _itemsPropertyName;
        private readonly InputOperationPaging _paging;
        private readonly FieldProvider[] _requestFields;
        private readonly IReadOnlyList<ParameterProvider> _createRequestParameters;
        private readonly int? _nextTokenParameterIndex;

        public CollectionResultDefinition(ClientProvider client, InputOperation operation, CSharpType? itemModelType, bool isAsync)
        {
            _client = client;
            _clientField = new FieldProvider(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                _client.Type,
                "_client",
                this);
            _operation = operation;
            _paging = _operation.Paging!;

            _createRequestParameters = _client.RestClient.GetCreateRequestMethod(_operation).Signature.Parameters;

            var fields = new List<FieldProvider>();
            for (int paramIndex = 0; paramIndex < _createRequestParameters.Count; paramIndex++)
            {
                var parameter = _createRequestParameters[paramIndex];
                if (parameter.Name == _paging.ContinuationToken?.Parameter.Name)
                {
                    _nextTokenParameterIndex = paramIndex;
                }
                var field = new FieldProvider(
                    FieldModifiers.Private | FieldModifiers.ReadOnly,
                    parameter.Type,
                    $"_{parameter.Name}",
                    this);
                fields.Add(field);
                if (field.Name == "_options")
                {
                    _optionsField = field;
                }
            }

            _requestFields = fields.ToArray();

            _itemModelType = itemModelType;
            _isAsync = isAsync;

            var response = _operation.Responses.FirstOrDefault(r => !r.IsErrorResponse);
            var responseModel = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel((InputModelType)response!.BodyType!)!;
            // TODO Nested models are not supported yet https://github.com/Azure/typespec-azure/issues/2287

            var nextPagePropertyName = _paging.NextLink != null
                ? _paging.NextLink.ResponseSegments[0]
                : _paging.ContinuationToken?.ResponseSegments[0];
            _nextPageLocation = _paging.NextLink?.ResponseLocation ?? _paging.ContinuationToken?.ResponseLocation;

            // TODO Nested models are not supported https://github.com/Azure/typespec-azure/issues/2287
            var itemsPropertyName = _paging.ItemPropertySegments[0];
            var itemsModelPropertyName = responseModel.CanonicalView.Properties
                .FirstOrDefault(p => p.WireInfo?.SerializedName == itemsPropertyName)?.Name;
            if (itemsModelPropertyName == null)
            {
                ScmCodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                    "missing-items-property",
                    $"Missing items property: {itemsPropertyName}",
                    _operation.CrossLanguageDefinitionId);
            }
            _itemsPropertyName = itemsModelPropertyName ?? itemsPropertyName;

            // Find the model property that has the serialized name matching the next link.
            // Use the canonical view in case the property was customized.
            if (_nextPageLocation == InputResponseLocation.Body)
            {
                _nextPagePropertyName =
                    responseModel.CanonicalView.Properties.FirstOrDefault(
                        p => p.WireInfo?.SerializedName == nextPagePropertyName)?.Name;
            }
            else if (_nextPageLocation == InputResponseLocation.Header)
            {
                _nextPagePropertyName = nextPagePropertyName;
            }

            _responseType = responseModel.Type;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override string BuildNamespace() => _client.Type.Namespace;

        protected override string BuildName()
            => $"{_client.Type.Name}{_operation.Name.ToCleanName()}{(_isAsync ? "Async" : "")}CollectionResult{(_itemModelType == null ? "" : "OfT")}";

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override FieldProvider[] BuildFields() => [_clientField, .. _requestFields];

        protected override CSharpType[] BuildImplements() =>
         (_modelType: _itemModelType, _isAsync) switch
         {
             (null, true) => [new CSharpType(typeof(AsyncCollectionResult))],
             (null, false) => [new CSharpType(typeof(CollectionResult))],
             (_, true) => [new CSharpType(typeof(AsyncCollectionResult<>), _itemModelType)],
             (_, false) => [new CSharpType(typeof(CollectionResult<>), _itemModelType)],
         };

        protected override ConstructorProvider[] BuildConstructors()
        {
            var clientParameter = new ParameterProvider(
                "client",
                FormattableStringHelpers.Empty,
                _client.Type);
            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(
                        Type,
                        FormattableStringHelpers.Empty,
                        MethodSignatureModifiers.Public,
                        [
                            clientParameter,
                            .. _createRequestParameters
                        ]),
                    BuildConstructorBody(clientParameter),
                    this)
            ];
        }

        private MethodBodyStatement[] BuildConstructorBody(ParameterProvider clientParameter)
        {
            var statements = new List<MethodBodyStatement>(_createRequestParameters.Count + 1);

            statements.Add(_clientField.Assign(clientParameter).Terminate());

            for (int parameterNumber = 0; parameterNumber < _createRequestParameters.Count; parameterNumber++)
            {
                var parameter = _createRequestParameters[parameterNumber];
                var field = _requestFields[parameterNumber];
                statements.Add(field.Assign(parameter).Terminate());
            }
            return statements.ToArray();
        }

        protected override MethodProvider[] BuildMethods()
        {
            MethodBodyStatement[] getRawPagesMethodBody = (_paging.NextLink, _paging.ContinuationToken) switch
            {
                (null, null) => BuildGetRawPagesForSingle(),
                (not null, _) => BuildGetRawPagesForNextLink(),
                (_, not null) => BuildGetRawPagesForContinuationToken()
            };

            var methods = new List<MethodProvider>
            {
                new MethodProvider(
                    new MethodSignature(_isAsync ?
                            nameof(AsyncCollectionResult.GetRawPagesAsync) :
                            nameof(CollectionResult.GetRawPages),
                        FormattableStringHelpers.Empty,
                        _isAsync ?
                            MethodSignatureModifiers.Public | MethodSignatureModifiers.Async | MethodSignatureModifiers.Override :
                            MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                        new CSharpType(_isAsync ?
                            typeof(IAsyncEnumerable<>) :
                            typeof(IEnumerable<>),
                            typeof(ClientResult)),
                        FormattableStringHelpers.Empty,
                        []),
                    getRawPagesMethodBody,
                    this),

                new MethodProvider(
                    new MethodSignature(nameof(CollectionResult.GetContinuationToken),
                        FormattableStringHelpers.Empty,
                        MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                        new CSharpType(typeof(ContinuationToken)),
                        FormattableStringHelpers.Empty,
                        [PageParameter]),
                    BuildGetContinuationToken(),
                    this)
            };

            if (_itemModelType != null)
            {
                methods.Add(new MethodProvider(
                                new MethodSignature(_isAsync ? "GetValuesFromPageAsync" : "GetValuesFromPage",
                                FormattableStringHelpers.Empty,
                                _isAsync ?
                                    MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override | MethodSignatureModifiers.Async :
                                    MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override,
                                _isAsync ?
                                    new CSharpType(typeof(IAsyncEnumerable<>), _itemModelType) :
                                    new CSharpType(typeof(IEnumerable<>), _itemModelType),
                                FormattableStringHelpers.Empty,
                                [PageParameter]),
                        BuildGetValuesFromPages(),
                        this));
            }

            return methods.ToArray();
        }

        private MethodBodyStatement[] BuildGetValuesFromPages()
        {
            return
            _isAsync ?
                [
                    new ForeachStatement(_itemModelType!, "item", PageParameter.AsExpression().CastTo(_responseType)
                        .Property(_itemsPropertyName), false, out var item)
                    {
                        YieldReturn(item),
                        Static(typeof(Task)).Invoke("Yield", [], [], callAsAsync: true, addConfigureAwaitFalse: false).Terminate()
                    }
                ] :
                [
                    Return(PageParameter.AsExpression().CastTo(_responseType)
                        .Property(_itemsPropertyName))
                ];
        }

        private MethodBodyStatement[] BuildGetContinuationToken()
        {
            // Simply return null if no continuation token or next link were defined.
            if (_paging.ContinuationToken == null && _paging.NextLink == null)
            {
                return [Return(Null)];
            }

            CSharpType nextPageType = _paging.NextLink != null
                ? new CSharpType(typeof(Uri))
                : _requestFields[_nextTokenParameterIndex!.Value].Type;
            var nextPageVariable = new VariableExpression(nextPageType, "nextPage");

            switch (_nextPageLocation)
            {
                case InputResponseLocation.Body:
                    var resultExpression = PageParameter.AsExpression().CastTo(_responseType)
                        .Property(_nextPagePropertyName!);
                    return
                    [
                        Declare(nextPageVariable, resultExpression),
                        new IfElseStatement(new IfStatement(nextPageVariable.NotEqual(Null))
                            {
                                Return(Static(typeof(ContinuationToken))
                                .Invoke("FromBytes", BinaryDataSnippets.FromString(
                                    nextPageType.Equals(typeof(Uri)) ?
                                        nextPageVariable.Property("AbsoluteUri") :
                                        nextPageVariable)))
                            },
                            Return(Null))
                    ];
                case InputResponseLocation.Header:
                    return
                    [
                        new IfElseStatement(
                            new IfStatement(PageParameter.ToApi<ClientResponseApi>().GetRawResponse()
                                .TryGetHeader(_nextPagePropertyName!, out var nextLinkHeader))
                            {
                                Return(Static(typeof(ContinuationToken)).Invoke("FromBytes", BinaryDataSnippets.FromString(nextLinkHeader!)))
                            },
                            Return(Null))
                    ];
                default:
                    // Invalid location is logged by the emitter.
                    return [];
            }
        }

        private MethodBodyStatement[] BuildGetRawPagesForNextLink()
        {
            var nextPageVariable = new VariableExpression(typeof(Uri), "nextPageUri");
            return
            [
                // Declare the initial request message
                Declare(
                    "message",
                    InvokeCreateRequestForNextLink(_requestFields[0].As<Uri>()),
                    out ScopedApi<PipelineMessage> message),

                // Declare nextPageUri variable
                Declare(nextPageVariable, Null.As<Uri>()),

                // Generate the while loop
                new WhileStatement(True)
                {
                    Declare(
                        "result",
                        ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ToExpression().FromResponse(
                            _clientField.Property("Pipeline").ToApi<ClientPipelineApi>().ProcessMessage(
                                message.ToApi<HttpMessageApi>(),
                                _optionsField!.AsValueExpression.ToApi<HttpRequestOptionsApi>(),
                                _isAsync)).ToApi<ClientResponseApi>(),
                        out ClientResponseApi result),

                    // Yield return result
                    YieldReturn(result),
                    MethodBodyStatement.EmptyLine,

                    // Assign nextLinkUri from the result and check if it is null
                    AssignAndCheckNextPageVariable(result, nextPageVariable),

                    // Update message for next iteration
                    message.Assign(InvokeCreateRequestForNextLink(nextPageVariable)).Terminate()
                }
            ];
        }

        private MethodBodyStatement[] BuildGetRawPagesForContinuationToken()
        {
            var nextTokenVariable = new VariableExpression(_requestFields[_nextTokenParameterIndex!.Value].Type, "nextToken");
            return
            [
                // Declare the initial request message
                Declare(
                    "message",
                    InvokeCreateRequestForContinuationToken(_requestFields[_nextTokenParameterIndex!.Value]),
                    out ScopedApi<PipelineMessage> message),

                // Declare nextToken variable
                Declare(nextTokenVariable, Null),

                // Generate the while loop
                new WhileStatement(True)
                {
                    Declare(
                        "result",
                        ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ToExpression().FromResponse(
                            _clientField.Property("Pipeline").ToApi<ClientPipelineApi>().ProcessMessage(
                                message.ToApi<HttpMessageApi>(),
                                _optionsField!.AsValueExpression.ToApi<HttpRequestOptionsApi>(),
                                _isAsync)).ToApi<ClientResponseApi>(),
                        out ClientResponseApi result),

                    // Yield return result
                    YieldReturn(result),
                    MethodBodyStatement.EmptyLine,

                    // Assign nextLinkUri from the result and check if it is null
                    AssignAndCheckNextPageVariable(result, nextTokenVariable),

                    // Update message for next iteration
                    message.Assign(InvokeCreateRequestForContinuationToken(nextTokenVariable)).Terminate()
                }
            ];
        }

        private MethodBodyStatement[] BuildGetRawPagesForSingle()
        {
            var pipelineMessageDeclaration = Declare(
                    "message",
                    InvokeCreateRequestForSingle(),
                    out ScopedApi<PipelineMessage> m);
            var pipelineResponse = ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ToExpression().FromResponse(
                        _clientField.Property("Pipeline").ToApi<ClientPipelineApi>().ProcessMessage(
                            m.ToApi<HttpMessageApi>(),
                            _optionsField!.AsValueExpression.ToApi<HttpRequestOptionsApi>(),
                            _isAsync)).ToApi<ClientResponseApi>();
            return
            [
                pipelineMessageDeclaration,
                // Yield return result
                YieldReturn(pipelineResponse),
            ];
        }

        private MethodBodyStatement[] AssignAndCheckNextPageVariable(ClientResponseApi result, VariableExpression nextPage)
        {
            switch (_nextPageLocation)
            {
                case InputResponseLocation.Body:
                    var resultExpression = result.CastTo(_responseType).Property(_nextPagePropertyName!);
                    return
                    [
                        nextPage.Assign(resultExpression).Terminate(),
                        new IfStatement(nextPage.Equal(Null))
                        {
                            YieldBreak()
                        },
                    ];
                case InputResponseLocation.Header:
                    return
                        [
                            new IfElseStatement(
                                new IfStatement(result.GetRawResponse().TryGetHeader(_nextPagePropertyName!, out var nextLinkHeader))
                                {
                                        nextPage.Type.Equals(typeof(Uri)) ?
                                            nextPage.Assign(New.Instance<Uri>(nextLinkHeader!)).Terminate() :
                                            nextPage.Assign(nextLinkHeader!).Terminate(),
                                },
                                YieldBreak())
                        ];
                default:
                    // Invalid location is logged by the emitter.
                    return [];
            }
        }

        private ScopedApi<PipelineMessage> InvokeCreateRequestForNextLink(ValueExpression nextPageUri) => _clientField.Invoke(
            $"Create{_operation.Name.ToCleanName()}Request",
            // we replace the first argument (the initialUri) with the nextPageUri
            [nextPageUri, .. _requestFields[1..]])
            .As<PipelineMessage>();

        private ScopedApi<PipelineMessage> InvokeCreateRequestForContinuationToken(ValueExpression nextToken)
        {
            ValueExpression[] arguments = _requestFields.Select(f => f.AsValueExpression).ToArray();

            // Replace the nextToken field with the nextToken variable
            arguments[_nextTokenParameterIndex!.Value] = nextToken;

            return _clientField.Invoke(
                    $"Create{_operation.Name.ToCleanName()}Request",
                    arguments)
                .As<PipelineMessage>();
        }

        private ScopedApi<PipelineMessage> InvokeCreateRequestForSingle()
        {
            ValueExpression[] arguments = [.. _requestFields.Select(f => f.AsValueExpression)];

            return _clientField.Invoke(
                    $"Create{_operation.Name.ToCleanName()}Request",
                    arguments)
                .As<PipelineMessage>();
        }
    }
}
