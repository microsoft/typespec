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
using Microsoft.TypeSpec.Generator.ClientModel.Utilities;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class CollectionResultDefinition : TypeProvider
    {
        protected bool IsAsync { get; }
        protected ClientProvider Client { get; }
        protected FieldProvider ClientField { get; }

        protected InputOperation Operation { get; }
        protected InputPagingServiceMetadata Paging { get; }

        protected FieldProvider RequestOptionsField => _requestOptionsField ??= RequestFields
            .First(f => f.Name == RequestOptionsFieldName);
        private FieldProvider? _requestOptionsField;
        protected virtual string RequestOptionsFieldName => "_options";

        protected IReadOnlyList<FieldProvider> RequestFields => BuildRequestFields();

        protected ModelProvider ResponseModel { get; }
        protected CSharpType ResponseModelType { get; }

        protected virtual CSharpType? ItemModelType { get; }
        protected FieldProvider? NextTokenField { get; }

        protected CSharpType NextPagePropertyType { get; }

        protected IReadOnlyList<string> NextPagePropertySegments { get; }

        protected InputResponseLocation? NextPageLocation { get; }

        private static readonly ParameterProvider PageParameter =
            new("page", FormattableStringHelpers.Empty, new CSharpType(typeof(ClientResult)));

        public CollectionResultDefinition(ClientProvider client, InputPagingServiceMethod serviceMethod, CSharpType? itemModelType, bool isAsync)
        {
            Client = client;
            ClientField = new FieldProvider(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                Client.Type,
                "_client",
                this);
            Operation = serviceMethod.Operation;
            Paging = serviceMethod.PagingMetadata;
            IsAsync = isAsync;
            ItemModelType = itemModelType;

            var response = Operation.Responses.FirstOrDefault(r => !r.IsErrorResponse);
            ResponseModel = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel((InputModelType)response!.BodyType!)!;
            ResponseModelType = ResponseModel.Type;

            foreach (var field in RequestFields)
            {
                if (field.AsParameter.Name == Paging.ContinuationToken?.Parameter.Name)
                {
                    NextTokenField = field;
                }
            }

            NextPageLocation = Paging.NextLink?.ResponseLocation ?? Paging.ContinuationToken?.ResponseLocation;
            NextPagePropertySegments = Paging.NextLink?.ResponseSegments ?? Paging.ContinuationToken?.ResponseSegments ?? [];

            NextPagePropertyType = GetNextPagePropertyType();

            if (Paging.ItemPropertySegments.Count == 0)
            {
                ScmCodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                    DiagnosticCodes.MissingItemsProperty,
                    "No property was marked as the paging items property",
                    Operation.CrossLanguageDefinitionId,
                    EmitterDiagnosticSeverity.Error);
            }
        }

        private IReadOnlyList<ParameterProvider> CreateRequestParameters
            => Client.RestClient.GetCreateRequestMethod(Operation).Signature.Parameters;

        private string CreateRequestMethodName
            => Client.RestClient.GetCreateRequestMethod(Operation).Signature.Name;

        private IReadOnlyList<FieldProvider> BuildRequestFields()
        {
            var fields = new List<FieldProvider>();
            for (int paramIndex = 0; paramIndex < CreateRequestParameters.Count; paramIndex++)
            {
                var parameter = CreateRequestParameters[paramIndex];
                var field = new FieldProvider(
                    FieldModifiers.Private | FieldModifiers.ReadOnly,
                    parameter.Type,
                    $"_{parameter.Name.ToVariableName()}",
                    this);
                fields.Add(field);
            }

            return fields;
        }

        private CSharpType GetNextPagePropertyType()
        {
            if (NextPageLocation != InputResponseLocation.Body)
            {
                return typeof(string);
            }

            TypeProvider model = ResponseModel;
            PropertyProvider? property = null;
            for (int i = 0; i < NextPagePropertySegments.Count; i++)
            {
                property = model.Properties.First(p => p.WireInfo!.SerializedName == NextPagePropertySegments[i]);

                if (i < NextPagePropertySegments.Count - 1)
                {
                    model = ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[property.Type]!;
                }
            }

            return property!.Type;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override string BuildNamespace() => Client.Type.Namespace;

        protected override string BuildName()
            => $"{Client.Type.Name}{Operation.Name.ToIdentifierName()}{(IsAsync ? "Async" : "")}CollectionResult{(ItemModelType == null ? "" : "OfT")}";

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override FieldProvider[] BuildFields() => [ClientField, .. RequestFields];

        protected override CSharpType[] BuildImplements() =>
         (_modelType: ItemModelType, IsAsync) switch
         {
             (null, true) => [new CSharpType(typeof(AsyncCollectionResult))],
             (null, false) => [new CSharpType(typeof(CollectionResult))],
             (_, true) => [new CSharpType(typeof(AsyncCollectionResult<>), ItemModelType)],
             (_, false) => [new CSharpType(typeof(CollectionResult<>), ItemModelType)],
         };

        protected override ConstructorProvider[] BuildConstructors()
        {
            var clientParameter = new ParameterProvider(
                "client",
                $"The {Client.Type.Name} client used to send requests.",
                Client.Type);
            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(
                        Type,
                        $"Initializes a new instance of {Name}, which is used to iterate over the pages of a collection.",
                        MethodSignatureModifiers.Public,
                        [
                            clientParameter,
                            .. CreateRequestParameters
                        ]),
                    BuildConstructorBody(clientParameter),
                    this)
            ];
        }

        private ValueExpression GetPropertyExpression(IReadOnlyList<string> segments, ValueExpression response)
        {
            return BuildGetPropertyExpression(segments, response.CastTo(ResponseModelType));
        }

        protected ValueExpression BuildGetPropertyExpression(IReadOnlyList<string> segments, ValueExpression responseModel)
        {
            TypeProvider model = ResponseModel;
            ValueExpression getPropertyExpression = responseModel;

            for (int i = 0; i < segments.Count; i++)
            {
                var property = model.Properties.First(p => p.WireInfo!.SerializedName == segments[i]);

                if (i > 0)
                {
                    getPropertyExpression = getPropertyExpression.NullConditional();
                }

                getPropertyExpression = getPropertyExpression.Property(property.Name);

                if (i < segments.Count - 1)
                {
                    model = ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[property.Type]!;
                }
            }

            return getPropertyExpression;
        }

        private MethodBodyStatement[] BuildConstructorBody(ParameterProvider clientParameter)
        {
            var statements = new List<MethodBodyStatement>(CreateRequestParameters.Count + 1);

            statements.Add(ClientField.Assign(clientParameter).Terminate());

            for (int parameterNumber = 0; parameterNumber < CreateRequestParameters.Count; parameterNumber++)
            {
                var parameter = CreateRequestParameters[parameterNumber];
                var field = RequestFields[parameterNumber];
                statements.Add(field.Assign(parameter).Terminate());
            }
            return statements.ToArray();
        }

        protected override MethodProvider[] BuildMethods()
        {
            MethodBodyStatement[] getRawPagesMethodBody = (Paging.NextLink, Paging.ContinuationToken) switch
            {
                (null, null) => BuildGetRawPagesForSingle(),
                (not null, _) => BuildGetRawPagesForNextLink(),
                (_, not null) => BuildGetRawPagesForContinuationToken()
            };

            var methods = new List<MethodProvider>
            {
                new MethodProvider(
                    new MethodSignature(IsAsync ?
                            nameof(AsyncCollectionResult.GetRawPagesAsync) :
                            nameof(CollectionResult.GetRawPages),
                        $"Gets the raw pages of the collection.",
                        IsAsync ?
                            MethodSignatureModifiers.Public | MethodSignatureModifiers.Async | MethodSignatureModifiers.Override :
                            MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                        new CSharpType(IsAsync ?
                            typeof(IAsyncEnumerable<>) :
                            typeof(IEnumerable<>),
                            typeof(ClientResult)),
                        $"The raw pages of the collection.",
                        []),
                    getRawPagesMethodBody,
                    this),

                new MethodProvider(
                    new MethodSignature(nameof(CollectionResult.GetContinuationToken),
                        $"Gets the continuation token from the specified page.",
                        MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                        new CSharpType(typeof(ContinuationToken)),
                        $"The continuation token for the specified page.",
                        [PageParameter]),
                    BuildGetContinuationToken(),
                    this)
            };

            if (ItemModelType != null)
            {
                methods.Add(new MethodProvider(
                                new MethodSignature(IsAsync ? "GetValuesFromPageAsync" : "GetValuesFromPage",
                                $"Gets the values from the specified page.",
                                IsAsync ?
                                    MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override | MethodSignatureModifiers.Async :
                                    MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override,
                                IsAsync ?
                                    new CSharpType(typeof(IAsyncEnumerable<>), ItemModelType) :
                                    new CSharpType(typeof(IEnumerable<>), ItemModelType),
                                $"The values from the specified page.",
                                [PageParameter]),
                        BuildGetValuesFromPages(),
                        this));
            }

            return methods.ToArray();
        }

        private MethodBodyStatement[] BuildGetValuesFromPages()
        {
            var items = GetPropertyExpression(Paging.ItemPropertySegments, PageParameter.AsExpression());
            return
            IsAsync ?
                [
                    new ForEachStatement(ItemModelType!, "item", items, false, out var item)
                    {
                        YieldReturn(item),
                        Static(typeof(Task)).Invoke("Yield", [], [], callAsAsync: true, addConfigureAwaitFalse: false).Terminate()
                    }
                ] :
                [
                    Return(items)
                ];
        }

        private MethodBodyStatement[] BuildGetContinuationToken()
        {
            // Simply return null if no continuation token or next link were defined.
            if (Paging.ContinuationToken == null && Paging.NextLink == null)
            {
                return [Return(Null)];
            }

            CSharpType nextPageType = Paging.NextLink != null
                ? NextPagePropertyType
                : NextTokenField!.Type;
            var nextPageVariable = new VariableExpression(nextPageType, "nextPage");
            var nextPagePropertySegments = Paging.NextLink?.ResponseSegments ?? Paging.ContinuationToken?.ResponseSegments;
            switch (NextPageLocation)
            {
                case InputResponseLocation.Body:
                    var resultExpression = GetPropertyExpression(nextPagePropertySegments!, PageParameter.AsExpression());
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
                                .TryGetHeader(nextPagePropertySegments![0], out var nextLinkHeader))
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
                    InvokeCreateInitialRequest(),
                    out ScopedApi<PipelineMessage> message),

                // Declare nextPageUri variable
                Declare(nextPageVariable, Null.As<Uri>()),

                // Generate the while loop
                new WhileStatement(True)
                {
                    Declare(
                        "result",
                        ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ToExpression().FromResponse(
                            ClientField.Property("Pipeline").ToApi<ClientPipelineApi>().ProcessMessage(
                                message.ToApi<HttpMessageApi>(),
                                RequestOptionsField.AsValueExpression.ToApi<HttpRequestOptionsApi>(),
                                IsAsync)).ToApi<ClientResponseApi>(),
                        out ClientResponseApi result),

                    // Yield return result
                    YieldReturn(result),
                    MethodBodyStatement.EmptyLine,

                    // Assign nextLinkUri from the result and check if it is null
                    AssignAndCheckNextPageVariable(result, result.CastTo(ResponseModelType), nextPageVariable),

                    // Update message for next iteration
                    message.Assign(InvokeCreateRequestForNextLink(nextPageVariable)).Terminate()
                }
            ];
        }

        private MethodBodyStatement[] BuildGetRawPagesForContinuationToken()
        {
            var nextTokenVariable = new VariableExpression(NextTokenField!.Type, "nextToken");
            return
            [
                // Declare the initial request message
                Declare(
                    "message",
                    InvokeCreateRequestForContinuationToken(NextTokenField!),
                    out ScopedApi<PipelineMessage> message),

                // Declare nextToken variable
                Declare(nextTokenVariable, Null),

                // Generate the while loop
                new WhileStatement(True)
                {
                    Declare(
                        "result",
                        ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ToExpression().FromResponse(
                            ClientField.Property("Pipeline").ToApi<ClientPipelineApi>().ProcessMessage(
                                message.ToApi<HttpMessageApi>(),
                                RequestOptionsField.AsValueExpression.ToApi<HttpRequestOptionsApi>(),
                                IsAsync)).ToApi<ClientResponseApi>(),
                        out ClientResponseApi result),

                    // Yield return result
                    YieldReturn(result),
                    MethodBodyStatement.EmptyLine,

                    // Assign nextLinkUri from the result and check if it is null
                    AssignAndCheckNextPageVariable(result, result.CastTo(ResponseModelType), nextTokenVariable),

                    // Update message for next iteration
                    message.Assign(InvokeCreateRequestForContinuationToken(nextTokenVariable)).Terminate()
                }
            ];
        }

        private MethodBodyStatement[] BuildGetRawPagesForSingle()
        {
            var pipelineMessageDeclaration = Declare(
                    "message",
                    InvokeCreateInitialRequest(),
                    out ScopedApi<PipelineMessage> m);
            var pipelineResponse = ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ToExpression().FromResponse(
                        ClientField.Property("Pipeline").ToApi<ClientPipelineApi>().ProcessMessage(
                            m.ToApi<HttpMessageApi>(),
                            RequestOptionsField.AsValueExpression.ToApi<HttpRequestOptionsApi>(),
                            IsAsync)).ToApi<ClientResponseApi>();
            return
            [
                pipelineMessageDeclaration,
                // Yield return result
                YieldReturn(pipelineResponse),
            ];
        }

        protected MethodBodyStatement[] AssignAndCheckNextPageVariable(ClientResponseApi result, ValueExpression responseModel, VariableExpression nextPage)
        {
            switch (NextPageLocation)
            {
                case InputResponseLocation.Body:
                    var resultExpression = BuildGetPropertyExpression(NextPagePropertySegments, responseModel);
                    if (Paging.ContinuationToken != null || NextPagePropertyType.Equals(typeof(Uri)))
                    {
                        return
                        [
                            nextPage.Assign(resultExpression).Terminate(),
                            new IfStatement(nextPage.Equal(Null))
                            {
                                YieldBreak()
                            }
                        ];
                    }
                    return
                    [
                        Declare("nextPageString", resultExpression.As<string>(), out ScopedApi<string> nextPageString),
                        new IfStatement(nextPageString.Equal(Null))
                        {
                            YieldBreak()
                        },
                        nextPage.Assign(New.Instance<Uri>(nextPageString)).Terminate()
                    ];
                case InputResponseLocation.Header:
                    return
                        [
                            new IfElseStatement(
                                new IfStatement(result.GetRawResponse().TryGetHeader(NextPagePropertySegments[0], out var nextLinkHeader))
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

        private ScopedApi<PipelineMessage> InvokeCreateRequestForNextLink(ValueExpression nextPageUri)
        {
            var createNextLinkRequestMethodName =
                Client.RestClient.GetCreateNextLinkRequestMethod(Operation).Signature.Name;
            return ClientField.Invoke(
                    createNextLinkRequestMethodName,
                    [nextPageUri, ..RequestFields])
                .As<PipelineMessage>();
        }

        private ScopedApi<PipelineMessage> InvokeCreateRequestForContinuationToken(ValueExpression nextToken)
        {
            // Replace the nextToken field with the nextToken variable
            var arguments = RequestFields.Select(f => f.Name.Equals(NextTokenField?.Name) == true ? nextToken : f.AsValueExpression);

            return ClientField.Invoke(CreateRequestMethodName, arguments).As<PipelineMessage>();
        }

        private ScopedApi<PipelineMessage> InvokeCreateInitialRequest()
        {
            ValueExpression[] arguments = [.. RequestFields.Select(f => f.AsValueExpression)];

            return ClientField.Invoke(CreateRequestMethodName, arguments).As<PipelineMessage>();
        }
    }
}
