// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.ClientModel.Utilities;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class ScmMethodProviderCollection : IReadOnlyList<ScmMethodProvider>
    {
        private readonly MethodProvider _createRequestMethod;
        private static readonly ClientPipelineExtensionsDefinition _clientPipelineExtensionsDefinition = new();
        private static readonly CancellationTokenExtensionsDefinition _cancellationTokenExtensionsDefinition = new();
        private IList<ParameterProvider> ProtocolMethodParameters => _protocolMethodParameters ??= RestClientProvider.GetMethodParameters(ServiceMethod, ScmMethodKind.Protocol, Client);
        private IList<ParameterProvider>? _protocolMethodParameters;

        private IReadOnlyList<ParameterProvider> ConvenienceMethodParameters => _convenienceMethodParameters ??= RestClientProvider.GetMethodParameters(ServiceMethod, ScmMethodKind.Convenience, Client);
        private IReadOnlyList<ParameterProvider>? _convenienceMethodParameters;
        private readonly InputPagingServiceMethod? _pagingServiceMethod;
        private IReadOnlyList<ScmMethodProvider>? _methods;
        private readonly bool _generateConvenienceMethod;

        private ClientProvider Client { get; }
        protected InputServiceMethod ServiceMethod { get; }
        protected TypeProvider EnclosingType { get; }
        public IReadOnlyList<ScmMethodProvider> MethodProviders => _methods ??= BuildMethods();

        public ScmMethodProvider this[int index]
        {
            get { return MethodProviders[index]; }
        }

        public int Count
        {
            get { return MethodProviders.Count; }
        }

        public IEnumerator<ScmMethodProvider> GetEnumerator()
        {
            return MethodProviders.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public ScmMethodProviderCollection(InputServiceMethod serviceMethod, TypeProvider enclosingType)
        {
            ServiceMethod = serviceMethod;
            EnclosingType = enclosingType;

            Client = enclosingType as ClientProvider ?? throw new InvalidOperationException("Scm methods can only be built for client types.");
            _createRequestMethod = Client.RestClient.GetCreateRequestMethod(ServiceMethod.Operation);
            _generateConvenienceMethod = ServiceMethod.Operation is
            { GenerateConvenienceMethod: true, IsMultipartFormData: false };

            if (serviceMethod is InputPagingServiceMethod pagingServiceMethod)
            {
                _pagingServiceMethod = pagingServiceMethod;
            }
        }

        protected virtual IReadOnlyList<ScmMethodProvider> BuildMethods()
        {
            bool shouldMakeParametersRequired = ShouldMakeProtocolMethodParametersRequired();

            var syncProtocol = BuildProtocolMethod(_createRequestMethod, false, shouldMakeParametersRequired);
            var asyncProtocol = BuildProtocolMethod(_createRequestMethod, true, shouldMakeParametersRequired);

            if (_generateConvenienceMethod)
            {
                return
                [
                    syncProtocol,
                    asyncProtocol,
                    BuildConvenienceMethod(syncProtocol, false),
                    BuildConvenienceMethod(asyncProtocol, true),
                ];
            }

            return
            [
                syncProtocol,
                asyncProtocol,
            ];
        }

        private ScmMethodProvider BuildConvenienceMethod(MethodProvider protocolMethod, bool isAsync)
        {
            if (EnclosingType is not ClientProvider)
            {
                throw new InvalidOperationException("Protocol methods can only be built for client types.");
            }

            var methodSignature = new MethodSignature(
                isAsync ? ServiceMethod.Name + "Async" : ServiceMethod.Name,
                DocHelpers.GetFormattableDescription(ServiceMethod.Operation.Summary, ServiceMethod.Operation.Doc) ?? FormattableStringHelpers.FromString(ServiceMethod.Operation.Name),
                protocolMethod.Signature.Modifiers,
                GetResponseType(ServiceMethod.Operation.Responses, true, isAsync, out var responseBodyType),
                null,
                [.. ConvenienceMethodParameters, ScmKnownParameters.CancellationToken]);

            MethodBodyStatement[] methodBody;
            TypeProvider? collection = null;
            if (_pagingServiceMethod != null)
            {
                collection = ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.CreateClientCollectionResultDefinition(Client, _pagingServiceMethod, responseBodyType, isAsync);
                methodBody = [.. GetPagingMethodBody(collection, ConvenienceMethodParameters, true)];
            }
            else if (responseBodyType is null)
            {
                methodBody =
                [
                    .. GetStackVariablesForProtocolParamConversion(ConvenienceMethodParameters, out var declarations),
                    Return(This.Invoke(protocolMethod.Signature, [.. GetProtocolMethodArguments(declarations)], isAsync))
                ];
            }
            else
            {
                methodBody =
                [
                    .. GetStackVariablesForProtocolParamConversion(ConvenienceMethodParameters, out var paramDeclarations),
                    Declare("result", This.Invoke(protocolMethod.Signature, [.. GetProtocolMethodArguments(paramDeclarations)], isAsync).ToApi<ClientResponseApi>(), out ClientResponseApi result),
                    .. GetStackVariablesForReturnValueConversion(result, responseBodyType, isAsync, out var resultDeclarations),
                    IsConvertibleFromBinaryData(responseBodyType)
                        ? Return(result.FromValue(GetResultConversion(result, result.GetRawResponse(), responseBodyType, resultDeclarations), result.GetRawResponse()))
                        :
                        new[]
                        {
                            Declare("data", result.GetRawResponse().Content(), out var data),
                            UsingDeclare("document", data.Parse(), out var jsonDocument),
                            Declare("element", jsonDocument.RootElement(), out var jsonElement),
                            Return(result.FromValue(
                                ScmCodeModelGenerator.Instance.TypeFactory.DeserializeJsonValue(
                                responseBodyType,
                                jsonElement,
                                data,
                                ScmCodeModelGenerator.Instance.ModelSerializationExtensionsDefinition.WireOptionsField.As<ModelReaderWriterOptions>(),
                                SerializationFormat.Default),
                                result.GetRawResponse()))
                        },
                ];
            }

            var convenienceMethod = new ScmMethodProvider(methodSignature, methodBody, EnclosingType, ScmMethodKind.Convenience, collectionDefinition: collection, serviceMethod: ServiceMethod);

            if (convenienceMethod.XmlDocs != null)
            {
                var exceptions = new List<XmlDocExceptionStatement>(convenienceMethod.XmlDocs.Exceptions);
                exceptions.Add(new(ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseExceptionType.FrameworkType, "Service returned a non-success status code.", []));
                convenienceMethod.XmlDocs.Update(exceptions: exceptions);
            }

            return convenienceMethod;
        }

        private IEnumerable<MethodBodyStatement> GetStackVariablesForProtocolParamConversion(IReadOnlyList<ParameterProvider> convenienceMethodParameters, out Dictionary<string, ValueExpression> declarations)
        {
            List<MethodBodyStatement> statements = new List<MethodBodyStatement>();
            declarations = new Dictionary<string, ValueExpression>();
            var requestContentType = ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.RequestContentType;

            foreach (var parameter in convenienceMethodParameters)
            {
                if (parameter.SpreadSource != null)
                    continue;

                if (parameter.Location == ParameterLocation.Body)
                {
                    if (parameter.Type.IsReadOnlyMemory)
                    {
                        statements.Add(UsingDeclare("content", requestContentType, BinaryContentHelperSnippets.FromEnumerable(parameter.Property("Span")), out var content));
                        declarations["content"] = content;
                    }
                    else if (parameter.Type.IsList)
                    {
                        statements.Add(UsingDeclare("content", requestContentType, BinaryContentHelperSnippets.FromEnumerable(parameter), out var content));
                        declarations["content"] = content;
                    }
                    else if (parameter.Type.IsDictionary)
                    {
                        statements.Add(UsingDeclare("content", requestContentType, BinaryContentHelperSnippets.FromDictionary(parameter), out var content));
                        declarations["content"] = content;
                    }
                    else if (parameter.Type.Equals(typeof(string)))
                    {
                        var bdExpression = ServiceMethod.Operation.RequestMediaTypes?.Contains("application/json") == true
                            ? BinaryDataSnippets.FromObjectAsJson(parameter)
                            : BinaryDataSnippets.FromString(parameter);
                        statements.Add(UsingDeclare("content", RequestContentApiSnippets.Create(bdExpression), out var content));
                        declarations["content"] = content;
                    }
                    else if (parameter.Type.IsFrameworkType && !parameter.Type.Equals(typeof(BinaryData)) && IsConvertibleFromBinaryData(parameter.Type))
                    {
                        statements.Add(UsingDeclare("content", requestContentType, BinaryContentHelperSnippets.FromObject(parameter), out var content));
                        declarations["content"] = content;
                    }
                    else if (parameter.Type.IsFrameworkType && !parameter.Type.Equals(typeof(BinaryData)))
                    {
                        statements.Add(Declare("content", New.Instance<Utf8JsonBinaryContentDefinition>(), out var content));
                        statements.Add(ScmCodeModelGenerator.Instance.TypeFactory.SerializeJsonValue(
                            parameter.Type.FrameworkType,
                            parameter,
                            content.JsonWriter(),
                            ScmCodeModelGenerator.Instance.ModelSerializationExtensionsDefinition.WireOptionsField.As<ModelReaderWriterOptions>(),
                            SerializationFormat.Default));
                        declarations["content"] = content;
                    }
                    // else rely on implicit operator to convert to BinaryContent
                    // For BinaryData we have special handling as well
                }
            }

            // add spread parameter model variable declaration
            var spreadSource = convenienceMethodParameters.FirstOrDefault(p => p.SpreadSource != null)?.SpreadSource;
            if (spreadSource is not null)
            {
                statements.Add(Declare("spreadModel", New.Instance(spreadSource.Type, [.. GetSpreadConversion(spreadSource)]).As(spreadSource.Type), out var spread));
                declarations["spread"] = spread;
            }

            return statements;
        }

        private List<ValueExpression> GetSpreadConversion(TypeProvider spreadSource)
        {
            var convenienceMethodParams = ConvenienceMethodParameters.ToDictionary(p => p.Name);
            List<ValueExpression> expressions = new(spreadSource.Properties.Count);
            // we should make this find more deterministic
            var ctor = spreadSource.CanonicalView.Constructors.First(c =>
                c.Signature.Parameters.Count == spreadSource.CanonicalView.Properties.Count + 1 ||
                    (c.EnclosingType is ScmModelProvider { IsDynamicModel: true } && c.Signature.Parameters.Count == spreadSource.CanonicalView.Properties.Count));

            foreach (var param in ctor.Signature.Parameters)
            {
                if (convenienceMethodParams.TryGetValue(param.Name, out var convenienceParam))
                {
                    if (convenienceParam.Type.IsList)
                    {
                        var interfaceType = param.Property!.WireInfo?.IsReadOnly == true
                            ? new CSharpType(typeof(IReadOnlyList<>), convenienceParam.Type.Arguments)
                            : new CSharpType(typeof(IList<>), convenienceParam.Type.Arguments);
                        expressions.Add(new AsExpression(convenienceParam.NullConditional().ToList(), interfaceType)
                            .NullCoalesce(New.Instance(convenienceParam.Type.PropertyInitializationType, [])));
                    }
                    else if (convenienceParam.Type.IsDictionary)
                    {
                        expressions.Add(convenienceParam.NullCoalesce(New.Instance(convenienceParam.Type.PropertyInitializationType)));
                    }
                    else
                    {
                        expressions.Add(convenienceParam);
                    }
                }
                else if (param.Property is { Body: AutoPropertyBody { InitializationExpression: not null } body })
                {
                    expressions.Add(body.InitializationExpression);
                }
                else
                {
                    expressions.Add(Default);
                }
            }

            return expressions;
        }

        private IEnumerable<MethodBodyStatement> GetStackVariablesForReturnValueConversion(ClientResponseApi result, CSharpType responseBodyType, bool isAsync, out Dictionary<string, ValueExpression> declarations)
        {
            declarations = [];

            if (responseBodyType.IsList)
            {
                var elementType = responseBodyType.Arguments[0];
                return BuildCollectionConversionForResult(
                    result,
                    responseBodyType,
                    elementType,
                    ShouldUseJsonDocForDeserializingType(elementType),
                    out declarations);
            }

            if (responseBodyType.IsDictionary)
            {
                var keyType = responseBodyType.Arguments[0];
                var valueType = responseBodyType.Arguments[1];
                return BuildDictionaryConversionForResult(
                    result,
                    responseBodyType,
                    keyType,
                    valueType,
                    ShouldUseJsonDocForDeserializingType(valueType),
                    out declarations);
            }

            return [];
        }

        private List<MethodBodyStatement> BuildCollectionConversionForResult(ClientResponseApi result, CSharpType responseBodyType, CSharpType elementType, bool usesJsonDocument, out Dictionary<string, ValueExpression> declarations)
        {
            var listType = new CSharpType(typeof(List<>), elementType);
            var statements = new List<MethodBodyStatement>
            {
                Declare("value", New.Instance(listType).As(listType), out var value),
                Declare("data", result.GetRawResponse().Content(), out var data)
            };
            declarations = new Dictionary<string, ValueExpression> { { "value", value } };

            if (usesJsonDocument)
            {
                statements.Add(UsingDeclare("document", data.Parse(), out var document));
                statements.Add(ForEachStatement.Create("item", document.RootElement().EnumerateArray(), out ScopedApi<JsonElement> item)
                    .Add(GetElementConversion(elementType, data, item, value)));
                return statements;
            }

            if (ShouldBuildStackVarForFrameworkType(elementType))
            {
                var readerVar = new VariableExpression(typeof(Utf8JsonReader), "jsonReader");
                statements.Add(Declare(readerVar, New.Instance(typeof(Utf8JsonReader), ReadOnlyMemorySnippets.Span(data.ToMemory()))));

                var readMethod = readerVar.Read();
                statements.Add(readMethod.Terminate());
                statements.Add(new WhileStatement(readMethod)
                {
                    new IfStatement(readerVar.TokenType().Equal(JsonTokenTypeSnippets.EndArray)) { Break },
                    GetFrameworkTypeConversionFromReader(elementType, readerVar, value, null)
                });
            }

            return statements;
        }

        private List<MethodBodyStatement> BuildDictionaryConversionForResult(ClientResponseApi result, CSharpType responseBodyType, CSharpType keyType, CSharpType valueType, bool usesJsonDocument, out Dictionary<string, ValueExpression> declarations)
        {
            var dictType = new CSharpType(typeof(Dictionary<,>), keyType, valueType);
            var statements = new List<MethodBodyStatement>
            {
                Declare("value", New.Instance(dictType).As(responseBodyType), out var value),
                Declare("data", result.GetRawResponse().Content(), out var data)
            };
            declarations = new Dictionary<string, ValueExpression> { { "value", value } };

            if (usesJsonDocument)
            {
                statements.Add(UsingDeclare("document", data.Parse(), out var document));
                statements.Add(ForEachStatement.Create("item", document.RootElement().EnumerateObject(), out ScopedApi<JsonProperty> item)
                    .Add(GetElementConversion(valueType, data, item.Value(), value, item.Name())));
                return statements;
            }

            if (ShouldBuildStackVarForFrameworkType(valueType))
            {
                var readerVar = new VariableExpression(typeof(Utf8JsonReader), "jsonReader");
                statements.Add(Declare(readerVar, New.Instance(typeof(Utf8JsonReader), ReadOnlyMemorySnippets.Span(data.ToMemory()))));

                var readMethod = readerVar.Read();
                statements.Add(readMethod.Terminate());
                statements.Add(new WhileStatement(readMethod)
                {
                    new IfStatement(readerVar.TokenType().Equal(JsonTokenTypeSnippets.EndObject)) { Break },
                    Declare("propertyName", typeof(string), readerVar.GetString(), out var propertyName),
                    readMethod.Terminate(),
                    GetFrameworkTypeConversionFromReader(valueType, readerVar, value, propertyName)
                });
            }

            return statements;
        }

        private MethodBodyStatement GetElementConversion(CSharpType elementType, ScopedApi<BinaryData> data, ScopedApi<JsonElement> item, ScopedApi value, ValueExpression? dictKey = null)
        {
            if (elementType.Equals(typeof(TimeSpan)))
            {
                return AddElement(dictKey, item.Invoke("GetTimeSpan", Literal("P")), value);
            }
            else if (elementType.Equals(typeof(BinaryData)))
            {
                return new IfElseStatement(
                    item.ValueKind().Equal(JsonValueKindSnippets.Null),
                    AddElement(dictKey, Null, value),
                    AddElement(dictKey, BinaryDataSnippets.FromString(item.GetRawText()), value));
            }
            else
            {
                return AddElement(
                    dictKey,
                    MrwSerializationTypeDefinition.GetDeserializationMethodInvocationForType(elementType, item, data, ModelSerializationExtensionsSnippets.Wire),
                    value);
            }
        }

        private MethodBodyStatement GetFrameworkTypeConversionFromReader(CSharpType elementType, VariableExpression reader, ScopedApi value, ValueExpression? dictKey)
        {
            var frameworkType = elementType.FrameworkType;

            // Special handling for string
            if (frameworkType == typeof(string))
            {
                var getString = reader.GetString();
                return AddElement(dictKey, getString.As<string>(), value);
            }

            // Map framework types to their Utf8JsonReader method names
            var readerMethodName = frameworkType switch
            {
                Type t when t == typeof(int) => nameof(Utf8JsonReader.GetInt32),
                Type t when t == typeof(long) => nameof(Utf8JsonReader.GetInt64),
                Type t when t == typeof(bool) => nameof(Utf8JsonReader.GetBoolean),
                Type t when t == typeof(double) => nameof(Utf8JsonReader.GetDouble),
                Type t when t == typeof(float) => nameof(Utf8JsonReader.GetSingle),
                Type t when t == typeof(decimal) => nameof(Utf8JsonReader.GetDecimal),
                Type t when t == typeof(DateTimeOffset) => nameof(Utf8JsonReader.GetDateTimeOffset),
                Type t when t == typeof(Guid) => nameof(Utf8JsonReader.GetGuid),
                _ => null
            };

            if (readerMethodName != null)
            {
                if (elementType.IsNullable)
                {
                    // For nullable types, check if token is null, otherwise call the reader method
                    var nullCheck = reader.TokenType().Equal(FrameworkEnumValue(JsonTokenType.Null));
                    var nullableType = new CSharpType(frameworkType, isNullable: true);
                    var nullableValue = new TernaryConditionalExpression(nullCheck, Null, reader.Invoke(readerMethodName).As(nullableType));
                    return AddElement(dictKey, nullableValue, value);
                }
                else
                {
                    // For non-nullable types, directly call the reader method
                    return AddElement(dictKey, reader.Invoke(readerMethodName), value);
                }
            }

            ScmCodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                DiagnosticCodes.UnsupportedFrameworkType,
                $"Unsupported framework type: {frameworkType}. Element will be skipped.",
                ServiceMethod.Operation.CrossLanguageDefinitionId,
                EmitterDiagnosticSeverity.Error);

            return MethodBodyStatement.Empty;
        }

        private MethodBodyStatement AddElement(ValueExpression? dictKey, ValueExpression element, ScopedApi scopedApi)
        {
            if (dictKey != null)
            {
                // Add items to dictionary
                return scopedApi.Add(dictKey, element);
            }
            // Add items to list
            return scopedApi.Add(element);
        }

        private ValueExpression GetResultConversion(ClientResponseApi result, HttpResponseApi response, CSharpType responseBodyType, Dictionary<string, ValueExpression> declarations)
        {
            if (responseBodyType.Equals(typeof(BinaryData)))
            {
                return response.Content();
            }
            if (responseBodyType.IsReadOnlyMemory)
            {
                return New.Instance(responseBodyType, declarations["value"].Invoke(nameof(List<>.ToArray)));
            }
            if (responseBodyType.IsList)
            {
                return declarations["value"].CastTo(new CSharpType(responseBodyType.OutputType.FrameworkType, responseBodyType.Arguments[0]));
            }
            if (responseBodyType.IsDictionary)
            {
                return declarations["value"].CastTo(new CSharpType(responseBodyType.OutputType.FrameworkType, responseBodyType.Arguments[0], responseBodyType.Arguments[1]));
            }
            if (responseBodyType.Equals(typeof(string)) && ServiceMethod.Operation.Responses.Any(r => r.IsErrorResponse is false && r.ContentTypes.Contains("text/plain")))
            {
                return response.Content().InvokeToString();
            }
            if (responseBodyType.IsFrameworkType)
            {
                return response.Content().ToObjectFromJson(responseBodyType);
            }
            if (responseBodyType.IsEnum)
            {
                return responseBodyType.ToEnum(response.Content().ToObjectFromJson(responseBodyType.UnderlyingEnumType));
            }
            return result.CastTo(responseBodyType);
        }

        private static bool ShouldBuildStackVarForFrameworkType(CSharpType type)
        {
            if (!type.IsFrameworkType)
            {
                return false;
            }

            return type.Equals(typeof(string)) ||
                   type.Equals(typeof(int)) ||
                   type.Equals(typeof(int?)) ||
                   type.Equals(typeof(long)) ||
                   type.Equals(typeof(long?)) ||
                   type.Equals(typeof(double)) ||
                   type.Equals(typeof(double?)) ||
                   type.Equals(typeof(float)) ||
                   type.Equals(typeof(float?)) ||
                   type.Equals(typeof(decimal)) ||
                   type.Equals(typeof(decimal?)) ||
                   type.Equals(typeof(bool)) ||
                   type.Equals(typeof(bool?)) ||
                   type.Equals(typeof(DateTimeOffset)) ||
                   type.Equals(typeof(DateTimeOffset?)) ||
                   type.Equals(typeof(Guid)) ||
                   type.Equals(typeof(Guid?));
        }

        private static bool IsConvertibleFromBinaryData(CSharpType type)
        {
            if (type.Equals(typeof(BinaryData)))
            {
                return true;
            }

            if (!type.IsFrameworkType)
            {
                // generated types will have the explicit operator from ClientResult defined
                return true;
            }

            if (type.IsList)
            {
                return IsConvertibleFromBinaryData(type.Arguments[0]);
            }

            if (type.IsDictionary)
            {
                return IsConvertibleFromBinaryData(type.Arguments[1]);
            }

            return type.Equals(typeof(string)) ||
                   type.Equals(typeof(int)) ||
                   type.Equals(typeof(int?)) ||
                   type.Equals(typeof(long)) ||
                   type.Equals(typeof(long?)) ||
                   type.Equals(typeof(double)) ||
                   type.Equals(typeof(double?)) ||
                   type.Equals(typeof(float)) ||
                   type.Equals(typeof(float?)) ||
                   type.Equals(typeof(decimal)) ||
                   type.Equals(typeof(decimal?)) ||
                   type.Equals(typeof(bool)) ||
                   type.Equals(typeof(bool?)) ||
                   type.Equals(typeof(DateTimeOffset)) ||
                   type.Equals(typeof(DateTimeOffset?)) ||
                   type.Equals(typeof(TimeSpan)) ||
                   type.Equals(typeof(TimeSpan?));
        }

        private IReadOnlyList<ValueExpression> GetProtocolMethodArguments(Dictionary<string, ValueExpression> declarations)
        {
            List<ValueExpression> conversions = new List<ValueExpression>();
            bool addedSpreadSource = false;

            ModelProvider? bodyModel = null;
            InputParameter? methodBodyParameter = ServiceMethod.Parameters.FirstOrDefault(p => p.Location == InputRequestLocation.Body);
            if (methodBodyParameter?.Type is InputModelType model)
            {
                bodyModel = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model);
            }

            // Create a mapping from convenience parameter names to their ParameterProvider
            var convenienceParamsMap = ConvenienceMethodParameters.ToDictionary(p => p.Name, p => p, StringComparer.OrdinalIgnoreCase);

            // Iterate through protocol parameters to maintain correct argument order
            foreach (var protocolParam in ProtocolMethodParameters)
            {
                // Skip RequestOptions parameter as it's added at the end
                if (protocolParam.Type.Equals(ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestOptionsApi.HttpRequestOptionsType))
                {
                    continue;
                }

                ParameterProvider? sourceParam = null;
                ValueExpression? argumentValue = null;

                // Try to find the corresponding convenience parameter using MethodParameterSegments
                if (protocolParam.InputParameter?.MethodParameterSegments != null && protocolParam.InputParameter.MethodParameterSegments.Count > 0)
                {
                    // The MethodParameterSegments represents a path (e.g., ['Params', 'foo'] means params.foo)
                    var rootParameterName = protocolParam.InputParameter.MethodParameterSegments[0].Name;

                    if (convenienceParamsMap.TryGetValue(rootParameterName, out sourceParam))
                    {
                        // Check if this is a spread parameter
                        if (sourceParam.SpreadSource is not null)
                        {
                            // For spread parameters, add the spread source once
                            if (!addedSpreadSource && declarations.TryGetValue("spread", out ValueExpression? spread))
                            {
                                conversions.Add(spread);
                                addedSpreadSource = true;
                            }
                            continue;
                        }

                        // Start with the root parameter
                        argumentValue = sourceParam;

                        // Navigate through the property path if needed
                        if (protocolParam.InputParameter.MethodParameterSegments.Count > 1)
                        {
                            var propertySegments = protocolParam.InputParameter.MethodParameterSegments
                                .Skip(1)
                                .Select(p => p.Name)
                                .ToList();

                            if (ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(sourceParam.Type, out var typeProvider) &&
                                typeProvider is ModelProvider paramModel)
                            {
                                argumentValue = paramModel.GetPropertyExpression(sourceParam, propertySegments);
                            }
                            else
                            {
                                foreach (var propertyName in propertySegments)
                                {
                                    argumentValue = argumentValue.Property(propertyName);
                                }
                            }
                        }
                    }
                }
                else
                {
                    // Fallback: match by name for legacy scenarios without MethodParameterSegments
                    if (convenienceParamsMap.TryGetValue(protocolParam.Name, out sourceParam))
                    {
                        // Handle spread
                        if (sourceParam.SpreadSource is not null)
                        {
                            if (!addedSpreadSource && declarations.TryGetValue("spread", out ValueExpression? spread))
                            {
                                conversions.Add(spread);
                                addedSpreadSource = true;
                            }
                            continue;
                        }

                        argumentValue = sourceParam;
                    }
                    else if (protocolParam.Location == ParameterLocation.Body)
                    {
                        // Check if any convenience parameter has SpreadSource (indicates spread scenario)
                        if (!addedSpreadSource &&
                            ConvenienceMethodParameters.Any(p => p.SpreadSource != null) &&
                            declarations.TryGetValue("spread", out ValueExpression? spread))
                        {
                            conversions.Add(spread);
                            addedSpreadSource = true;
                            continue;
                        }

                        // Try to extract from body model properties for non-body metadata
                        if (bodyModel != null)
                        {
                            var bodyParam = ConvenienceMethodParameters.FirstOrDefault(p => p.Location == ParameterLocation.Body && p.Type.Equals(bodyModel.Type));
                            if (bodyParam != null)
                            {
                                var nonBodyProperty = bodyModel.CanonicalView.Properties
                                    .FirstOrDefault(p => p.WireInfo?.IsHttpMetadata == true &&
                                        (p.WireInfo.SerializedName.Equals(protocolParam.WireInfo.SerializedName, StringComparison.OrdinalIgnoreCase) ||
                                         p.Name.Equals(protocolParam.Name, StringComparison.OrdinalIgnoreCase)));

                                if (nonBodyProperty != null)
                                {
                                    conversions.Add(bodyParam.Property(nonBodyProperty.Name));
                                    continue;
                                }
                            }
                        }

                        // If we still haven't found a match, try to find body parameter by location
                        sourceParam = ConvenienceMethodParameters.FirstOrDefault(p => p.Location == ParameterLocation.Body);
                        if (sourceParam != null)
                        {
                            argumentValue = sourceParam;
                        }
                    }
                }

                // If we found a source parameter, convert it appropriately
                if (argumentValue != null && sourceParam != null)
                {
                    // Handle body parameter conversions based on PROTOCOL parameter location
                    if (protocolParam.Location == ParameterLocation.Body)
                    {
                        // Extract non-body metadata properties if the source is a body model
                        List<ValueExpression>? requiredParameters = null;
                        List<ValueExpression>? optionalParameters = null;

                        if (sourceParam.Location == ParameterLocation.Body && sourceParam.Type.Equals(bodyModel?.Type) == true)
                        {
                            var parameterConversions = GetNonBodyModelPropertiesConversions(sourceParam, bodyModel);
                            if (parameterConversions != null)
                            {
                                requiredParameters = parameterConversions.Value.RequiredParameters;
                                optionalParameters = parameterConversions.Value.OptionalParameters;
                            }
                        }

                        // Add required non-body parameters first
                        if (requiredParameters != null)
                        {
                            conversions.AddRange(requiredParameters);
                        }

                        // Convert the body parameter value
                        // Check the source parameter type to determine conversion needed
                        var sourceType = sourceParam.Type;
                        if (sourceType.IsReadOnlyMemory || sourceType.IsList)
                        {
                            argumentValue = declarations.GetValueOrDefault("content") ?? argumentValue;
                        }
                        else if (sourceType.IsEnum)
                        {
                            argumentValue = RequestContentApiSnippets.Create(BinaryDataSnippets.FromObjectAsJson(sourceType.ToSerial(argumentValue)));
                        }
                        else if (sourceType.Equals(typeof(BinaryData)))
                        {
                            argumentValue = RequestContentApiSnippets.Create(argumentValue);
                        }
                        else if (sourceType.IsFrameworkType)
                        {
                            argumentValue = declarations.GetValueOrDefault("content") ?? argumentValue;
                        }
                        else if (protocolParam.InputParameter?.MethodParameterSegments != null &&
                                 protocolParam.InputParameter.MethodParameterSegments.Count > 1)
                        {
                            // This is a value extracted from a property (e.g., info.Action from MethodParameterSegments ['info', 'action'])
                            // Serialize as BinaryData and rely on implicit cast to RequestContent
                            argumentValue = BinaryDataSnippets.FromObjectAsJson(argumentValue);
                        }
                        else if (sourceParam.Location != ParameterLocation.Body)
                        {
                            // This is a value from a non-body parameter
                            // Serialize as BinaryData and rely on implicit cast to RequestContent
                            argumentValue = BinaryDataSnippets.FromObjectAsJson(argumentValue);
                        }

                        conversions.Add(argumentValue);

                        // Add optional non-body parameters last
                        if (optionalParameters != null)
                        {
                            conversions.AddRange(optionalParameters);
                        }
                    }
                    else if (sourceParam.Type.IsEnum)
                    {
                        conversions.Add(sourceParam.Type.ToSerial(sourceParam));
                    }
                    else
                    {
                        conversions.Add(argumentValue);
                    }
                }
            }

            // RequestOptions argument
            var requestOptionsApi = ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestOptionsApi;
            // Build method name like "ToRequestOptions" or "ToRequestContext" based on the parameter name
            var toRequestOptionsMethodName = $"ToRequest{char.ToUpper(requestOptionsApi.ParameterName[0])}{requestOptionsApi.ParameterName.Substring(1)}";
            conversions.Add(ScmKnownParameters.CancellationToken.Invoke(toRequestOptionsMethodName, extensionType: _cancellationTokenExtensionsDefinition.Type));

            return conversions;
        }

        private (List<ValueExpression> RequiredParameters, List<ValueExpression> OptionalParameters)?
            GetNonBodyModelPropertiesConversions(ParameterProvider bodyParam, ModelProvider bodyModel)
        {
            // Extract non-body properties from the body model
            var nonBodyProperties = bodyModel.CanonicalView.Properties
                .Where(p => p.WireInfo?.IsHttpMetadata == true)
                .ToDictionary(p => p.WireInfo!.SerializedName, p => p);

            if (nonBodyProperties.Count == 0)
                return null;

            List<ValueExpression> required = [];
            List<ValueExpression> optional = [];

            // Add properties for matching protocol parameters
            foreach (var protocolParameter in ProtocolMethodParameters)
            {
                if (protocolParameter.Location != ParameterLocation.Body &&
                    (nonBodyProperties.TryGetValue(protocolParameter.WireInfo.SerializedName, out var nonBodyProperty) ||
                    nonBodyProperties.TryGetValue(protocolParameter.Name, out nonBodyProperty)))
                {
                    var conversion = bodyParam.Property(nonBodyProperty.Name);
                    if (protocolParameter.DefaultValue != null)
                    {
                        optional.Add(conversion);
                    }
                    else
                    {
                        required.Add(conversion);
                    }
                }
            }

            return (required, optional);
        }

        private ScmMethodProvider BuildProtocolMethod(MethodProvider createRequestMethod, bool isAsync, bool shouldMakeParametersRequired)
        {
            if (EnclosingType is not ClientProvider client)
            {
                throw new InvalidOperationException("Protocol methods can only be built for client types.");
            }

            var methodModifiers = ServiceMethod.Accessibility == "public" ?
                MethodSignatureModifiers.Public :
                MethodSignatureModifiers.Internal;

            methodModifiers |= MethodSignatureModifiers.Virtual;

            if (isAsync && _pagingServiceMethod == null)
            {
                methodModifiers |= MethodSignatureModifiers.Async;
            }

            var requiredParameters = new List<ParameterProvider>();
            var optionalParameters = new List<ParameterProvider>();

            for (var i = 0; i < ProtocolMethodParameters.Count; i++)
            {
                var parameter = ProtocolMethodParameters[i];
                if (parameter.DefaultValue is null)
                {
                    requiredParameters.Add(parameter);
                }
                else
                {
                    optionalParameters.Add(parameter);
                }
            }
            ParameterProvider requestOptionsParameter = ScmKnownParameters.RequestOptions;

            if (shouldMakeParametersRequired)
            {
                ProcessOptionalParameters(optionalParameters, requiredParameters, ref requestOptionsParameter);
            }
            else
            {
                requestOptionsParameter = ScmKnownParameters.OptionalRequestOptions;
            }

            ParameterProvider[] parameters = [.. requiredParameters, .. optionalParameters, requestOptionsParameter];

            var methodSignature = new MethodSignature(
                isAsync ? ServiceMethod.Name + "Async" : ServiceMethod.Name,
                DocHelpers.GetFormattableDescription(ServiceMethod.Operation.Summary, ServiceMethod.Operation.Doc) ?? FormattableStringHelpers.FromString(ServiceMethod.Operation.Name),
                methodModifiers,
                GetResponseType(ServiceMethod.Operation.Responses, false, isAsync, out _),
                $"The response returned from the service.",
                parameters);

            TypeProvider? collection = null;
            MethodBodyStatement[] methodBody;
            if (_pagingServiceMethod != null)
            {
                collection = ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.CreateClientCollectionResultDefinition(Client, _pagingServiceMethod, null, isAsync);
                methodBody = [.. GetPagingMethodBody(collection, parameters, false)];
            }
            else
            {
                var processMessageName = isAsync ? "ProcessMessageAsync" : "ProcessMessage";
                methodBody =
                [
                    UsingDeclare("message", ScmCodeModelGenerator.Instance.TypeFactory.HttpMessageApi.HttpMessageType,
                        This.Invoke(createRequestMethod.Signature,
                            [.. parameters]), out var message),
                    Return(ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ToExpression().FromResponse(client
                        .PipelineProperty.Invoke(processMessageName, [message, requestOptionsParameter], isAsync, true, extensionType: _clientPipelineExtensionsDefinition.Type)))
                ];
            }

            var protocolMethod =
                new ScmMethodProvider(methodSignature, methodBody, EnclosingType, ScmMethodKind.Protocol, collectionDefinition: collection, serviceMethod: ServiceMethod);

            if (protocolMethod.XmlDocs != null)
            {
                var exceptions = new List<XmlDocExceptionStatement>(protocolMethod.XmlDocs.Exceptions);
                exceptions.Add(new(ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseExceptionType.FrameworkType, "Service returned a non-success status code.", []));

                List<XmlDocStatement> listItems =
                [
                    new XmlDocStatement("item", [], new XmlDocStatement("description", [$"This <see href=\"https://aka.ms/azsdk/net/protocol-methods\">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios."]))
                ];
                XmlDocStatement listXmlDoc = new XmlDocStatement($"<list type=\"bullet\">", $"</list>", [], innerStatements: [.. listItems]);
                var summary = new XmlDocSummaryStatement([$"[Protocol Method] {DocHelpers.GetDescription(ServiceMethod.Operation.Summary, ServiceMethod.Operation.Doc) ?? ServiceMethod.Operation.Name}"], listXmlDoc);

                protocolMethod.XmlDocs.Update(summary: summary, exceptions: exceptions);
            }
            return protocolMethod;
        }

        private ParameterProvider ProcessOptionalParameters(
            List<ParameterProvider> optionalParameters,
            List<ParameterProvider> requiredParameters,
            ref ParameterProvider requestOptionsParameter)
        {
            // If we need to make parameters required, make only the first optional parameter nullable required.
            // This is to prevent ambiguous callsites with the RequestOptions parameter while avoiding overly aggressive required parameter conversion.
            bool hasOptionalRequestContent =
                optionalParameters.Any(p => p.Equals(ScmKnownParameters.OptionalRequestContent));

            // If there is an optional request content parameter, we need to make all parameters required up to and including the request content parameter
            if (hasOptionalRequestContent)
            {
                int parametersMadeRequired = 0;
                foreach (var optionalParameter in optionalParameters)
                {
                    if (optionalParameter.Equals(ScmKnownParameters.OptionalRequestContent))
                    {
                        requiredParameters.Add(ScmKnownParameters.NullableRequiredRequestContent);
                        // Update the body param in the underlying collection
                        var bodyParamIndex = ProtocolMethodParameters.IndexOf(optionalParameter);
                        ProtocolMethodParameters[bodyParamIndex] =
                            ScmKnownParameters.NullableRequiredRequestContent;
                        parametersMadeRequired++;
                        break;
                    }

                    optionalParameter.DefaultValue = null;
                    optionalParameter.Type = optionalParameter.Type.WithNullable(true);
                    requiredParameters.Add(optionalParameter);
                    parametersMadeRequired++;
                }

                optionalParameters.RemoveRange(0, parametersMadeRequired);
                requestOptionsParameter = ScmKnownParameters.OptionalRequestOptions;
            }
            else
            {
                // If there is a required request content, then we don't need to make the optional parameters required
                bool hasRequiredRequestContent =
                    requiredParameters.Any(p => p.Equals(ScmKnownParameters.RequestContent));

                if (hasRequiredRequestContent)
                {
                    requestOptionsParameter = ScmKnownParameters.OptionalRequestOptions;
                }
                else
                {
                    // Otherwise we need to make all parameters required
                    foreach (var optionalParameter in optionalParameters)
                    {
                        optionalParameter.DefaultValue = null;
                        optionalParameter.Type = optionalParameter.Type.WithNullable(true);
                        requiredParameters.Add(optionalParameter);
                    }

                    optionalParameters.Clear();
                }
            }

            return requestOptionsParameter;
        }

        private IEnumerable<MethodBodyStatement> GetPagingMethodBody(
            TypeProvider collection,
            IReadOnlyList<ParameterProvider> parameters,
            bool isConvenience)
        {
            if (isConvenience)
            {
                return
                    [
                        .. GetStackVariablesForProtocolParamConversion(ConvenienceMethodParameters, out var declarations),
                        Return(New.Instance(
                        collection.Type,
                        [
                            This,
                            .. GetProtocolMethodArguments(declarations)
                        ]))
                    ];
            }

            return Return(New.Instance(
                collection.Type,
                [
                    This,
                    .. parameters
                ]));
        }

        private CSharpType GetResponseType(IReadOnlyList<InputOperationResponse> responses, bool isConvenience, bool isAsync, out CSharpType? responseBodyType)
        {
            responseBodyType = null;

            if (isConvenience)
            {
                return GetConvenienceReturnType(responses, isAsync, out responseBodyType);
            }

            if (_pagingServiceMethod != null)
            {
                return isAsync
                    ? ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientCollectionAsyncResponseType
                    : ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientCollectionResponseType;
            }

            var returnType = ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseType;

            return isAsync ? new CSharpType(typeof(Task<>), returnType) : returnType;
        }

        private CSharpType GetConvenienceReturnType(IReadOnlyList<InputOperationResponse> responses, bool isAsync, out CSharpType? responseBodyType)
        {
            var response = responses.FirstOrDefault(r => !r.IsErrorResponse);
            responseBodyType = GetResponseBodyType(response?.BodyType);

            if (_pagingServiceMethod != null)
            {
                if (responseBodyType == null)
                {
                    return isAsync ?
                        ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientCollectionAsyncResponseType :
                        ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientCollectionResponseType;
                }

                return new CSharpType(
                    isAsync ?
                        ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientCollectionAsyncResponseOfTType.FrameworkType :
                        ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientCollectionResponseOfTType.FrameworkType,
                    responseBodyType);
            }

            var returnType = responseBodyType == null
                ? ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseType
                : new CSharpType(ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseOfTType.FrameworkType, responseBodyType.OutputType);

            return isAsync ? new CSharpType(typeof(Task<>), returnType) : returnType;
        }

        private CSharpType? GetResponseBodyType(InputType? responseType)
        {
            if (responseType is null)
            {
                return null;
            }

            if (_pagingServiceMethod != null)
            {
                var modelType = responseType as InputModelType;

                foreach (var segment in _pagingServiceMethod!.PagingMetadata.ItemPropertySegments)
                {
                    var property = modelType!.Properties.FirstOrDefault(p => p.SerializedName == segment);
                    var propertyType = property?.Type;

                    if (propertyType is InputArrayType arrayType)
                    {
                        var valueType = arrayType.ValueType;
                        return ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(valueType);
                    }

                    if (propertyType is InputModelType type)
                    {
                        modelType = type;
                    }
                }

                // Never found an array property, so there was invalid paging metadata.
                ScmCodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                    DiagnosticCodes.NoMatchingItemsProperty,
                    "No property was found in the response model matching the items property",
                    ServiceMethod.Operation.CrossLanguageDefinitionId,
                    EmitterDiagnosticSeverity.Error);
                return null;
            }

            if (responseType is InputModelType inputModelType)
            {
                var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModelType);
                return model?.Type;
            }

            return ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(responseType);
        }

        private bool ShouldMakeProtocolMethodParametersRequired()
        {
            var convenienceMethodParameterCount = ConvenienceMethodParameters.Count;
            if (!_generateConvenienceMethod)
            {
                return false;
            }
            if (convenienceMethodParameterCount == 0)
            {
                return true;
            }

            for (int i = 0; i < convenienceMethodParameterCount; i++)
            {
                // If protocol parameter is required, and convenience is optional, we don't need any changes.
                if (ProtocolMethodParameters[i].DefaultValue == null && ConvenienceMethodParameters[i].DefaultValue != null)
                {
                    return false;
                }
                // If convenience is optional, and protocol is optional, we do need to make the protocol required.
                if (ConvenienceMethodParameters[i].DefaultValue != null)
                {
                    return true;
                }
                if (!ProtocolMethodParameters[i].Type.Equals(ConvenienceMethodParameters[i].Type))
                {
                    return false;
                }
            }

            return true;
        }

        private static bool ShouldUseJsonDocForDeserializingType(CSharpType type)
        {
            if (!type.IsFrameworkType)
            {
                return true;
            }

            return type.Equals(typeof(TimeSpan)) || type.Equals(typeof(BinaryData));
        }
    }
}
