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
        private FieldProvider _clientField;
        private readonly FieldProvider _optionsField;
        private readonly CSharpType _responseType;
        private readonly CSharpType? _modelType;
        private readonly string? _nextLinkPropertyName;
        private readonly FieldProvider _initialUri;
        private readonly InputResponseLocation? _nextLinkLocation;

        private static ParameterProvider PageParameter =
            new("page", FormattableStringHelpers.Empty, new CSharpType(typeof(ClientResult)));

        private readonly string _itemsPropertyName;

        public CollectionResultDefinition(ClientProvider client, InputOperation operation, CSharpType? modelType, bool isAsync)
        {
            _client = client;
            _clientField = new FieldProvider(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                _client.Type,
                "_client",
                this);
            _initialUri = new FieldProvider(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                new CSharpType(typeof(Uri)),
                "_initialUri",
                this);
            _optionsField = new FieldProvider(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                new CSharpType(typeof(RequestOptions)),
                "_options",
                this);

            _modelType = modelType;
            _operation = operation;
            _isAsync = isAsync;

            var response = _operation.Responses.FirstOrDefault(r => !r.IsErrorResponse);
            var model = ScmCodeModelPlugin.Instance.TypeFactory.CreateModel((InputModelType)response!.BodyType!)!;
            // TODO Nested models are not supported yet https://github.com/Azure/typespec-azure/issues/2287
            var nextLinkPropertyName = _operation.Paging!.NextLink?.ResponseSegments[0];
            _nextLinkLocation = operation.Paging!.NextLink?.ResponseLocation;

            // TODO Nested models are not supported https://github.com/Azure/typespec-azure/issues/2287
            var itemPropertyName = _operation.Paging!.ItemPropertySegments[0];
            _itemsPropertyName = model.CanonicalView.Properties
                .FirstOrDefault(p => p.WireInfo?.SerializedName == itemPropertyName)?.Name ?? itemPropertyName;

            // Find the model property that has the serialized name matching the next link.
            // Use the canonical view in case the property was customized.
            if (_nextLinkLocation == InputResponseLocation.Body)
            {
                _nextLinkPropertyName =
                    model.CanonicalView.Properties.FirstOrDefault(
                        p => p.WireInfo?.SerializedName == nextLinkPropertyName)?.Name;
            }
            else if (_nextLinkLocation == InputResponseLocation.Header)
            {
                _nextLinkPropertyName = nextLinkPropertyName;
            }

            _responseType = model.Type;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override string BuildName()
            => $"{_operation.Name.ToCleanName()}{(_isAsync ? "Async" : "")}CollectionResult{(_modelType == null ? "" : "OfT")}";

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override FieldProvider[] BuildFields() => [_clientField, _initialUri, _optionsField];

        protected override CSharpType[] BuildImplements() =>
         (_modelType, _isAsync) switch
         {
             (null, true) => [new CSharpType(typeof(AsyncCollectionResult))],
             (null, false) => [new CSharpType(typeof(CollectionResult))],
             (_, true) => [new CSharpType(typeof(AsyncCollectionResult<>), _modelType)],
             (_, false) => [new CSharpType(typeof(CollectionResult<>), _modelType)],
         };

        protected override ConstructorProvider[] BuildConstructors()
        {
            var clientParameter = new ParameterProvider(
                "client",
                FormattableStringHelpers.Empty,
                _client.Type);
            var initialUriParameter = new ParameterProvider(
                "initialUri",
                FormattableStringHelpers.Empty,
                new CSharpType(typeof(Uri)));
            var optionsParameter = new ParameterProvider(
                "options",
                FormattableStringHelpers.Empty,
                new CSharpType(typeof(RequestOptions)));
            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(
                        Type,
                        FormattableStringHelpers.Empty,
                        MethodSignatureModifiers.Public,
                        [
                            clientParameter,
                            initialUriParameter,
                            optionsParameter
                        ]),
                    new[]
                        {
                            _clientField.Assign(clientParameter).Terminate(),
                            _initialUri.Assign(initialUriParameter).Terminate(),
                            _optionsField.Assign(optionsParameter).Terminate()
                        },
                    this)
            ];
        }

        protected override MethodProvider[] BuildMethods()
        {
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
                    BuildGetRawPages(),
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

            if (_modelType != null)
            {
                methods.Add(new MethodProvider(
                                new MethodSignature(_isAsync ? "GetValuesFromPageAsync" : "GetValuesFromPage",
                                FormattableStringHelpers.Empty,
                                _isAsync ?
                                    MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override | MethodSignatureModifiers.Async :
                                    MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override,
                                _isAsync ?
                                    new CSharpType(typeof(IAsyncEnumerable<>), _modelType) :
                                    new CSharpType(typeof(IEnumerable<>), _modelType),
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
                    new ForeachStatement(_modelType!, "item", PageParameter.AsExpression().CastTo(_responseType)
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
            switch (_nextLinkLocation)
            {
                case InputResponseLocation.Body:
                    var resultExpression = PageParameter.AsExpression().CastTo(_responseType)
                        .Property(_nextLinkPropertyName!).As<Uri>();
                    return
                    [
                        Declare("nextPageUri", resultExpression, out ScopedApi<Uri> nextPageUri),
                        Return(Static(typeof(ContinuationToken))
                            .Invoke("FromBytes", BinaryDataSnippets.FromString(nextPageUri.Property("AbsoluteUri"))))
                    ];
                case InputResponseLocation.Header:
                    return
                    [
                        new IfElseStatement(
                            new IfStatement(PageParameter.ToApi<ClientResponseApi>().GetRawResponse()
                                .TryGetHeader(_nextLinkPropertyName!, out var nextLinkHeader))
                            {
                                Return(Static(typeof(ContinuationToken)).Invoke("FromBytes", BinaryDataSnippets.FromString(nextLinkHeader!)))
                            },
                            Return(Null))
                    ];
                default:
                    ScmCodeModelPlugin.Instance.Emitter.ReportDiagnostic(
                        "unsupported-next-link-location",
                        $"Unsupported next link location: {_nextLinkLocation}",
                        _operation.CrossLanguageDefinitionId);
                    return [];
            }
        }

        private MethodBodyStatement[] BuildGetRawPages()
        {
            return
            [
                // Declare the initial request message
                Declare(
                    "message",
                    InvokeCreateRequest(_initialUri.As<Uri>()),
                    out ScopedApi<PipelineMessage> message),

                // Declare nextPageUri variable
                Declare("nextPageUri", Null.As<Uri>(), out ScopedApi<Uri> nextPageUri),

                // Generate the while loop
                new WhileStatement(True)
                {
                    Declare(
                        "result",
                        ScmCodeModelPlugin.Instance.TypeFactory.ClientResponseApi.ToExpression().FromResponse(
                            _clientField.Property("Pipeline").ToApi<ClientPipelineApi>().ProcessMessage(
                                message.ToApi<HttpMessageApi>(),
                                _optionsField.AsValueExpression.ToApi<HttpRequestOptionsApi>(),
                                _isAsync)).ToApi<ClientResponseApi>(),
                        out ClientResponseApi result),

                    // Yield return result
                    YieldReturn(result),
                    MethodBodyStatement.EmptyLine,

                    // Assign nextLinkUri from the result and check if it is null
                    AssignAndCheckNextLinkUri(result, nextPageUri),

                    // Update message for next iteration
                    message.Assign(InvokeCreateRequest(nextPageUri)).Terminate()
                }
            ];
        }

        private MethodBodyStatement[] AssignAndCheckNextLinkUri(ClientResponseApi result, ScopedApi<Uri> nextPageUri)
        {
            switch (_nextLinkLocation)
            {
                case InputResponseLocation.Body:
                    var resultExpression = result.CastTo(_responseType).Property(_nextLinkPropertyName!).As<Uri>();
                    return
                    [
                        nextPageUri.Assign(resultExpression).Terminate(),
                        new IfStatement(nextPageUri.Equal(Null))
                        {
                            YieldBreak()
                        },
                    ];
                case InputResponseLocation.Header:
                    return
                        [
                            new IfElseStatement(
                                new IfStatement(result.GetRawResponse().TryGetHeader(_nextLinkPropertyName!, out var nextLinkHeader))
                                {
                                        nextPageUri.Assign(New.Instance<Uri>(nextLinkHeader!))
                                            .Terminate(),
                                },
                                YieldBreak())
                        ];
                default:
                    ScmCodeModelPlugin.Instance.Emitter.ReportDiagnostic(
                        "unsupported-next-link-location",
                        $"Unsupported next link location: {_nextLinkLocation}",
                        _operation.CrossLanguageDefinitionId);
                    return [];
            }
        }

        private ScopedApi<PipelineMessage> InvokeCreateRequest(ScopedApi<Uri> nextLinkUri) => _clientField.Invoke(
            $"Create{_operation.Name}Request",
            new[] { nextLinkUri, _optionsField.AsValueExpression })
            .As<PipelineMessage>();
    }
}
