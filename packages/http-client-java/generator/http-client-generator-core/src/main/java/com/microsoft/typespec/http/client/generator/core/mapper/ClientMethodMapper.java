// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.core.http.HttpMethod;
import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConvenienceApi;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.LongRunningMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsPageable;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings.SyncMethodsGeneration;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod.Builder;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ExternalDocumentation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPollingDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelPropertySegment;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformations;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.MethodNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * A mapper that maps an {@link Operation} to a lit of {@link ClientMethod ClientMethods}.
 */
public class ClientMethodMapper implements IMapper<Operation, List<ClientMethod>> {
    private static final ClientMethodMapper INSTANCE = new ClientMethodMapper();

    private static final Pattern ANYTHING_THEN_PERIOD = Pattern.compile(".*\\.");

    private final Map<CacheKey, List<ClientMethod>> parsed = new ConcurrentHashMap<>();

    private static class CacheKey {
        private final Operation operation;
        private final boolean isProtocolMethod;

        public CacheKey(Operation operation, boolean isProtocolMethod) {
            this.operation = operation;
            this.isProtocolMethod = isProtocolMethod;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o)
                return true;
            if (o == null || getClass() != o.getClass())
                return false;
            CacheKey cacheKey = (CacheKey) o;
            return isProtocolMethod == cacheKey.isProtocolMethod && operation.equals(cacheKey.operation);
        }

        @Override
        public int hashCode() {
            return Objects.hash(operation, isProtocolMethod);
        }
    }

    /**
     * Creates a new instance of {@link ClientMethodMapper}.
     */
    protected ClientMethodMapper() {
    }

    /**
     * Gets the global {@link ClientMethodMapper} instance.
     *
     * @return The global {@link ClientMethodMapper} instance.
     */
    public static ClientMethodMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public List<ClientMethod> map(Operation operation) {
        return map(operation, JavaSettings.getInstance().isDataPlaneClient());
    }

    /**
     * Maps an {@link Operation} to a list of {@link ClientMethod ClientMethods}.
     *
     * @param operation The {@link Operation} being mapped.
     * @param isProtocolMethod Whether the operation is a protocol method.
     * @return The list of {@link ClientMethod ClientMethods}.
     */
    public List<ClientMethod> map(Operation operation, boolean isProtocolMethod) {
        CacheKey cacheKey = new CacheKey(operation, isProtocolMethod);
        List<ClientMethod> clientMethods = parsed.get(cacheKey);
        if (clientMethods != null) {
            return clientMethods;
        }

        clientMethods = createClientMethods(operation, isProtocolMethod);
        parsed.put(cacheKey, clientMethods);

        return clientMethods;
    }

    /**
     * Creates the client methods for the operation.
     *
     * @param operation the operation.
     * @param isProtocolMethod whether the client method to be simplified for resilience to API changes.
     * @return the client methods created.
     */
    private List<ClientMethod> createClientMethods(Operation operation, boolean isProtocolMethod) {
        JavaSettings settings = JavaSettings.getInstance();

        // With the introduction of "enable-sync-stack" data plane clients now have two distinct ways of creating
        // synchronous implementation client methods.
        //
        // 1. Configure "enable-sync-stack" which will create synchronous proxy methods that will use a fully
        // synchronous code path.
        // 2. Configure "sync-methods" which will create synchronous implementation client methods that will block
        // on the asynchronous proxy method.
        //
        // If both are support "enable-sync-stack" take precedent. This required substantial changes to the follow code
        // as before asynchronous proxy methods would generate synchronous implementation client methods which
        // shouldn't eagerly be done anymore as it would have resulted in erroneous synchronous implementation client
        // methods.

        Map<Request, List<ProxyMethod>> proxyMethodsMap = Mappers.getProxyMethodMapper().map(operation);

        List<ClientMethod> methods = new ArrayList<>();

        // If this operation is part of a group it'll need to be referenced with a more specific target.
        ClientMethod.Builder builder = new ClientMethod.Builder()
            .clientReference((operation.getOperationGroup() == null
                || operation.getOperationGroup().getLanguage().getJava().getName().isEmpty()) ? "this" : "this.client")
            .setCrossLanguageDefinitionId(SchemaUtil.getCrossLanguageDefinitionId(operation));

        // merge summary and description
        String summary = operation.getSummary();
        if (summary == null) {
            // summary from m4 is under language
            summary = operation.getLanguage().getDefault() == null
                ? null
                : operation.getLanguage().getDefault().getSummary();
        }
        String description
            = operation.getLanguage().getJava() == null ? null : operation.getLanguage().getJava().getDescription();
        if (CoreUtils.isNullOrEmpty(summary) && CoreUtils.isNullOrEmpty(description)) {
            builder.description(String.format("The %s operation.", operation.getLanguage().getJava().getName()));
        } else {
            builder.description(SchemaUtil.mergeSummaryWithDescription(summary, description));
        }

        // API comment
        ImplementationDetails.Builder implDetailsBuilder = null;
        if (operation.getLanguage().getJava() != null
            && !CoreUtils.isNullOrEmpty(operation.getLanguage().getJava().getComment())) {
            implDetailsBuilder
                = new ImplementationDetails.Builder().comment(operation.getLanguage().getJava().getComment());
            builder.implementationDetails(implDetailsBuilder.build());
        }

        // map externalDocs property
        if (operation.getExternalDocs() != null) {
            ExternalDocumentation externalDocumentation
                = new ExternalDocumentation.Builder().description(operation.getExternalDocs().getDescription())
                    .url(operation.getExternalDocs().getUrl())
                    .build();
            builder.methodDocumentation(externalDocumentation);
        }

        List<Request> requests = getCodeModelRequests(operation, isProtocolMethod, proxyMethodsMap);
        for (Request request : requests) {
            List<ProxyMethod> proxyMethods = proxyMethodsMap.get(request);
            for (ProxyMethod proxyMethod : proxyMethods) {
                ClientMethodsReturnDescription methodsReturnDescription = ClientMethodsReturnDescription
                    .create(operation, isProtocolMethod, proxyMethod.isCustomHeaderIgnored());
                builder.proxyMethod(proxyMethod);
                List<ClientMethodParameter> parameters = new ArrayList<>();
                List<String> requiredParameterExpressions = new ArrayList<>();
                Map<String, String> validateExpressions = new HashMap<>();
                ParametersTransformationProcessor transformationProcessor
                    = new ParametersTransformationProcessor(isProtocolMethod);

                List<Parameter> codeModelParameters = getCodeModelParameters(request, isProtocolMethod);

                if (operation.isPageable()) {
                    // remove maxpagesize parameter from client method API, for Azure, it would be in e.g.
                    // PagedIterable.iterableByPage(int)

                    // also remove continuationToken etc. for unbranded
                    codeModelParameters = codeModelParameters.stream()
                        .filter(p -> !MethodUtil.shouldHideParameterInPageable(p,
                            operation.getExtensions().getXmsPageable()))
                        .collect(Collectors.toList());
                }

                final boolean isJsonPatch = MethodUtil.isContentTypeInRequest(request, "application/json-patch+json");

                final boolean proxyMethodUsesBinaryData = proxyMethod.hasParameterOfType(ClassType.BINARY_DATA);

                for (Parameter parameter : codeModelParameters) {
                    ClientMethodParameter clientMethodParameter
                        = Mappers.getClientParameterMapper().map(parameter, isProtocolMethod);

                    if (isJsonPatch) {
                        clientMethodParameter
                            = CustomClientParameterMapper.getInstance().map(parameter, isProtocolMethod);
                    }

                    // If the codemodel parameter and proxy method parameter types don't match, update the client
                    // method param to use proxy method parameter type.
                    if (proxyMethodUsesBinaryData
                        && clientMethodParameter.getClientType() == GenericType.FLUX_BYTE_BUFFER) {
                        clientMethodParameter = updateClientMethodParameter(clientMethodParameter);
                    }

                    if (request.getSignatureParameters().contains(parameter)) {
                        parameters.add(clientMethodParameter);
                    }

                    transformationProcessor.addParameter(clientMethodParameter, parameter);

                    if (!parameter.isConstant() && parameter.getGroupedBy() == null) {
                        final MethodParameter methodParameter;
                        final String expression;
                        if (parameter.getImplementation() != Parameter.ImplementationLocation.CLIENT) {
                            methodParameter = clientMethodParameter;
                            expression = methodParameter.getName();
                        } else {
                            ProxyMethodParameter proxyParameter = Mappers.getProxyParameterMapper().map(parameter);
                            methodParameter = proxyParameter;
                            expression = proxyParameter.getParameterReference();
                        }

                        if (methodParameter.isRequired() && methodParameter.isReferenceClientType()) {
                            requiredParameterExpressions.add(expression);
                        }
                        final String validation = methodParameter.getClientType().validate(expression);
                        if (validation != null) {
                            validateExpressions.put(expression, validation);
                        }
                    }
                }

                final ParameterTransformations transformations = transformationProcessor.process(request);
                final MethodOverloadType defaultOverloadType = hasNonRequiredParameters(parameters)
                    ? MethodOverloadType.OVERLOAD_MAXIMUM
                    : MethodOverloadType.OVERLOAD_MINIMUM_MAXIMUM;
                final boolean generateOnlyRequiredParameters = settings.isRequiredParameterClientMethods()
                    && defaultOverloadType == MethodOverloadType.OVERLOAD_MAXIMUM;

                final JavaVisibility methodVisibilityInWrapperClient;
                if (operation.getInternalApi() == Boolean.TRUE
                    || (isProtocolMethod && operation.getGenerateProtocolApi() == Boolean.FALSE)) {
                    // Client method is package private in wrapper client, so that the client or developer can still
                    // invoke it.
                    methodVisibilityInWrapperClient = JavaVisibility.PackagePrivate;
                } else {
                    methodVisibilityInWrapperClient = JavaVisibility.Public;
                }

                builder.parameters(parameters)
                    .requiredNullableParameterExpressions(requiredParameterExpressions)
                    .validateExpressions(validateExpressions)
                    .parameterTransformations(transformations)
                    .methodVisibilityInWrapperClient(methodVisibilityInWrapperClient)
                    .methodPageDetails(null);

                if (operation.isPageable()) {
                    IType responseType = proxyMethod.getRawResponseBodyType() != null
                        ? proxyMethod.getRawResponseBodyType()
                        : proxyMethod.getResponseBodyType();
                    ModelPropertySegment itemPropertyReference
                        = getPageableItem(operation.getExtensions().getXmsPageable(), responseType);
                    if (itemPropertyReference == null) {
                        // There is no pageable item name for this operation, skip it.
                        continue;
                    }

                    // If the ProxyMethod is synchronous perform a complete generation of synchronous pageable APIs.
                    if (proxyMethod.isSync()) {
                        createSyncPageableClientMethods(operation, isProtocolMethod, settings, methods, builder,
                            methodsReturnDescription, proxyMethod, parameters, itemPropertyReference,
                            generateOnlyRequiredParameters, defaultOverloadType);
                    } else {
                        // Otherwise, perform a complete generation of asynchronous pageable APIs.
                        // Then if SyncMethodsGeneration is enabled and Sync Stack is not perform synchronous pageable
                        // API generation based on SyncMethodsGeneration configuration.
                        createAsyncPageableClientMethods(operation, isProtocolMethod, settings, methods, builder,
                            methodsReturnDescription, proxyMethod, parameters, itemPropertyReference,
                            generateOnlyRequiredParameters, defaultOverloadType);

                        if (settings.isGenerateSyncMethods() && !settings.isSyncStackEnabled()) {
                            createSyncPageableClientMethods(operation, isProtocolMethod, settings, methods, builder,
                                methodsReturnDescription, proxyMethod, parameters, itemPropertyReference,
                                generateOnlyRequiredParameters, defaultOverloadType);
                        }
                    }
                } else if (operation.isLro()
                    && (settings.isFluent() || settings.getPollingConfig("default") != null)
                    && !methodsReturnDescription.getSyncReturnType().equals(ClassType.INPUT_STREAM)) {
                    // temporary skip InputStream, no idea how to do this in PollerFlux
                    // Skip sync ProxyMethods for polling as sync polling isn't ready yet.
                    if (proxyMethod.isSync()) {
                        continue;
                    }

                    JavaVisibility simpleAsyncMethodVisibility = methodVisibility(
                        ClientMethodType.SimpleAsyncRestResponse, defaultOverloadType, false, isProtocolMethod);
                    JavaVisibility simpleAsyncMethodVisibilityWithContext = methodVisibility(
                        ClientMethodType.SimpleAsyncRestResponse, defaultOverloadType, true, isProtocolMethod);

                    JavaVisibility simpleSyncMethodVisibility = methodVisibility(
                        ClientMethodType.SimpleSyncRestResponse, defaultOverloadType, false, isProtocolMethod);
                    JavaVisibility simpleSyncMethodVisibilityWithContext = methodVisibility(
                        ClientMethodType.SimpleSyncRestResponse, defaultOverloadType, true, isProtocolMethod);
                    // for vanilla and fluent, the SimpleAsyncRestResponse is VISIBLE, so that they can be used for
                    // possible customization on LRO

                    // there is ambiguity of RestResponse from simple API and from LRO API
                    // e.g. SimpleAsyncRestResponse without Context in simple API should be VISIBLE
                    // hence override here for DPG
                    if (settings.isDataPlaneClient()) {
                        simpleAsyncMethodVisibility = NOT_GENERATE;
                        simpleAsyncMethodVisibilityWithContext = NOT_VISIBLE;
                        simpleSyncMethodVisibility = NOT_GENERATE;
                        simpleSyncMethodVisibilityWithContext = NOT_VISIBLE;
                    }

                    // WithResponseAsync, with required and optional parameters
                    methods.add(builder
                        .returnValue(methodsReturnDescription.getReturnValue(ClientMethodType.SimpleAsyncRestResponse))
                        .name(proxyMethod.getSimpleAsyncRestResponseMethodName())
                        .onlyRequiredParameters(false)
                        .type(ClientMethodType.SimpleAsyncRestResponse)
                        .groupedParameterRequired(false)
                        .methodVisibility(simpleAsyncMethodVisibility)
                        .hasWithContextOverload(simpleAsyncMethodVisibilityWithContext != NOT_GENERATE)
                        .build());

                    builder.methodVisibility(simpleAsyncMethodVisibilityWithContext);
                    addClientMethodWithContext(methods, builder, parameters, getContextParameter(isProtocolMethod));

                    final boolean proxyMethodHasFbbParameter
                        = proxyMethod.hasParameterOfType(GenericType.FLUX_BYTE_BUFFER);
                    if (JavaSettings.getInstance().isSyncStackEnabled() && !proxyMethodHasFbbParameter) {
                        // WithResponseSync, with required and optional parameters
                        builder
                            .returnValue(
                                methodsReturnDescription.getReturnValue(ClientMethodType.SimpleSyncRestResponse))
                            .name(proxyMethod.getSimpleRestResponseMethodName())
                            .onlyRequiredParameters(false)
                            .type(ClientMethodType.SimpleSyncRestResponse)
                            .groupedParameterRequired(false)
                            .proxyMethod(proxyMethod.toSync());

                        // fluent + sync stack needs simple rest response for implementation only
                        if (settings.isFluent()) {
                            simpleSyncMethodVisibility = NOT_VISIBLE;
                            simpleSyncMethodVisibilityWithContext = NOT_VISIBLE;
                            final IType baseType = ClassType.BINARY_DATA;
                            final IType returnType = ResponseTypeFactory.createSyncResponse(operation, baseType,
                                isProtocolMethod, settings, proxyMethod.isCustomHeaderIgnored());
                            ReturnValue binaryDataResponse
                                = methodsReturnDescription.createReturnValue(returnType, baseType);
                            builder.returnValue(binaryDataResponse);
                        }

                        builder.methodVisibility(simpleSyncMethodVisibility);
                        methods.add(builder.build());

                        builder.methodVisibility(simpleSyncMethodVisibilityWithContext);
                        addClientMethodWithContext(methods, builder, parameters, getContextParameter(isProtocolMethod));

                        // reset builder
                        builder
                            .returnValue(
                                methodsReturnDescription.getReturnValue(ClientMethodType.SimpleAsyncRestResponse))
                            .name(proxyMethod.getSimpleAsyncRestResponseMethodName())
                            .onlyRequiredParameters(false)
                            .type(ClientMethodType.SimpleAsyncRestResponse)
                            .groupedParameterRequired(false)
                            .proxyMethod(proxyMethod)
                            .methodVisibility(simpleAsyncMethodVisibility);
                    }

                    JavaSettings.PollingDetails pollingDetails
                        = settings.getPollingConfig(proxyMethod.getOperationId());

                    MethodPollingDetails methodPollingDetails = null;
                    MethodPollingDetails dpgMethodPollingDetailsWithModel = null;   // for additional LRO methods

                    if (pollingDetails != null) {
                        // try lroMetadata
                        methodPollingDetails = methodPollingDetailsFromMetadata(operation, pollingDetails);

                        // result from methodPollingDetails already handled JavaSettings.PollingDetails (as well as
                        // LongRunningMetadata)
                        if (methodPollingDetails == null) {
                            final IType syncReturnType = methodsReturnDescription.getSyncReturnType();
                            methodPollingDetails
                                = new MethodPollingDetails(pollingDetails.getStrategy(),
                                    pollingDetails.getSyncStrategy(),
                                    getPollingIntermediateType(pollingDetails, syncReturnType),
                                    getPollingFinalType(pollingDetails, syncReturnType,
                                        MethodUtil.getHttpMethod(operation)),
                                    pollingDetails.getPollIntervalInSeconds());
                        }
                    }

                    if (methodPollingDetails != null && isProtocolMethod
                    // models of LRO configured
                        && !(ClassType.BINARY_DATA.equals(methodPollingDetails.getIntermediateType())
                            && (ClassType.BINARY_DATA.equals(methodPollingDetails.getFinalType())
                                || ClassType.VOID.equals(methodPollingDetails.getFinalType().asNullable())))) {

                        // a new method to be added as implementation only (not exposed to client) for developer
                        dpgMethodPollingDetailsWithModel = methodPollingDetails;

                        // keep consistency with DPG from Swagger, see getPollingFinalType
                        IType resultType = ClassType.BINARY_DATA;
                        // DELETE would not have final response as resource is deleted
                        if (MethodUtil.getHttpMethod(operation) == HttpMethod.DELETE) {
                            resultType = PrimitiveType.VOID;
                        }

                        // DPG keep the method with BinaryData
                        methodPollingDetails
                            = new MethodPollingDetails(dpgMethodPollingDetailsWithModel.getPollingStrategy(),
                                dpgMethodPollingDetailsWithModel.getSyncPollingStrategy(), ClassType.BINARY_DATA,
                                resultType, dpgMethodPollingDetailsWithModel.getPollIntervalInSeconds());
                    }

                    MethodNamer methodNamer
                        = resolveMethodNamer(proxyMethod, operation.getConvenienceApi(), isProtocolMethod);

                    createLroMethods(operation, builder, methods, methodNamer.getLroBeginAsyncMethodName(),
                        methodNamer.getLroBeginMethodName(), parameters, methodsReturnDescription, methodPollingDetails,
                        isProtocolMethod, generateOnlyRequiredParameters, defaultOverloadType, proxyMethod);

                    if (dpgMethodPollingDetailsWithModel != null) {
                        // additional LRO method for data-plane, with intermediate/final type, for convenience of
                        // grow-up
                        // it is public in implementation, but not exposed in wrapper client

                        if (implDetailsBuilder == null) {
                            implDetailsBuilder = new ImplementationDetails.Builder();
                        }
                        implDetailsBuilder.implementationOnly(true);

                        builder = builder.implementationDetails(implDetailsBuilder.build());

                        createLroMethods(operation, builder, methods, methodNamer.getLroModelBeginAsyncMethodName(),
                            methodNamer.getLroModelBeginMethodName(), parameters, methodsReturnDescription,
                            dpgMethodPollingDetailsWithModel, isProtocolMethod, generateOnlyRequiredParameters,
                            defaultOverloadType, proxyMethod);

                        builder = builder.implementationDetails(implDetailsBuilder.implementationOnly(false).build());
                    }

                    this.createAdditionalLroMethods(operation, builder, methods, isProtocolMethod,
                        methodsReturnDescription, proxyMethod, parameters, generateOnlyRequiredParameters,
                        defaultOverloadType);
                } else {
                    if (proxyMethod.isSync()) {
                        // If the ProxyMethod is synchronous perform a complete generation of synchronous simple APIs.

                        createSimpleSyncClientMethods(operation, isProtocolMethod, settings, methods, builder,
                            methodsReturnDescription, proxyMethod, parameters, generateOnlyRequiredParameters,
                            defaultOverloadType);
                    } else {
                        // Otherwise, perform a complete generation of asynchronous simple APIs.
                        // Then if SyncMethodsGeneration is enabled and Sync Stack is not perform synchronous simple
                        // API generation based on SyncMethodsGeneration configuration.

                        if (settings.getSyncMethods() != SyncMethodsGeneration.SYNC_ONLY) {
                            // SyncMethodsGeneration.NONE would still generate these
                            createSimpleAsyncClientMethods(operation, isProtocolMethod, settings, methods, builder,
                                methodsReturnDescription, proxyMethod, parameters, generateOnlyRequiredParameters,
                                defaultOverloadType);
                        }

                        if (settings.isGenerateSyncMethods() && !settings.isSyncStackEnabled()) {
                            createSimpleSyncClientMethods(operation, isProtocolMethod, settings, methods, builder,
                                methodsReturnDescription, proxyMethod, parameters, generateOnlyRequiredParameters,
                                defaultOverloadType);
                        }
                    }
                }
            }
        }

        return methods.stream()
            .filter(m -> m.getMethodVisibility() != NOT_GENERATE)
            .distinct()
            .collect(Collectors.toList());
    }

    private static List<Request> getCodeModelRequests(Operation operation, boolean isProtocolMethod,
        Map<Request, List<ProxyMethod>> proxyMethodsMap) {
        if (!isProtocolMethod
            && operation.getConvenienceApi() != null
            && operation.getConvenienceApi().getRequests() != null) {
            // convenience API of a protocol API
            List<Request> requests = operation.getConvenienceApi().getRequests();
            for (Request request : requests) {
                // at present, just set the proxy methods
                proxyMethodsMap.put(request, proxyMethodsMap.values().iterator().next());
            }
            return requests;
        } else {
            return operation.getRequests();
        }
    }

    private static List<Parameter> getCodeModelParameters(Request request, boolean isProtocolMethod) {
        if (isProtocolMethod) {
            // Required path, body, header and query parameters are allowed
            return request.getParameters().stream().filter(p -> {
                RequestParameterLocation location = p.getProtocol().getHttp().getIn();

                return p.isRequired()
                    && (location == RequestParameterLocation.PATH
                        || location == RequestParameterLocation.BODY
                        || location == RequestParameterLocation.HEADER
                        || location == RequestParameterLocation.QUERY);
            }).collect(Collectors.toList());
        } else {
            return request.getParameters().stream().filter(p -> !p.isFlattened()).collect(Collectors.toList());
        }
    }

    private void createAsyncPageableClientMethods(Operation operation, boolean isProtocolMethod, JavaSettings settings,
        List<ClientMethod> methods, ClientMethod.Builder builder,
        ClientMethodsReturnDescription methodsReturnDescription, ProxyMethod proxyMethod,
        List<ClientMethodParameter> parameters, ModelPropertySegment itemPropertyReference,
        boolean generateClientMethodWithOnlyRequiredParameters, MethodOverloadType defaultOverloadType) {

        ReturnValue singlePageReturnValue
            = methodsReturnDescription.getReturnValue(ClientMethodType.PagingAsyncSinglePage);
        ReturnValue nextPageReturnValue = methodsReturnDescription.getReturnValue(ClientMethodType.PagingAsync);
        MethodVisibilityFunction visibilityFunction = (firstPage, overloadType, includesContext) -> methodVisibility(
            firstPage ? ClientMethodType.PagingAsyncSinglePage : ClientMethodType.PagingAsync, overloadType,
            includesContext, isProtocolMethod);

        createPageableClientMethods(operation, isProtocolMethod, settings, methods, builder, proxyMethod, parameters,
            itemPropertyReference, false, singlePageReturnValue, nextPageReturnValue, visibilityFunction,
            getContextParameter(isProtocolMethod), generateClientMethodWithOnlyRequiredParameters, defaultOverloadType);
    }

    private void createSyncPageableClientMethods(Operation operation, boolean isProtocolMethod, JavaSettings settings,
        List<ClientMethod> methods, Builder builder, ClientMethodsReturnDescription methodsReturnDescription,
        ProxyMethod proxyMethod, List<ClientMethodParameter> parameters, ModelPropertySegment itemPropertyReference,
        boolean generateClientMethodWithOnlyRequiredParameters, MethodOverloadType defaultOverloadType) {

        ReturnValue singlePageReturnValue
            = methodsReturnDescription.getReturnValue(ClientMethodType.PagingSyncSinglePage);
        ReturnValue nextPageReturnValue = methodsReturnDescription.getReturnValue(ClientMethodType.PagingSync);
        MethodVisibilityFunction visibilityFunction = (firstPage, overloadType, includesContext) -> methodVisibility(
            firstPage ? ClientMethodType.PagingSyncSinglePage : ClientMethodType.PagingSync, overloadType,
            includesContext, isProtocolMethod);

        createPageableClientMethods(operation, isProtocolMethod, settings, methods, builder, proxyMethod, parameters,
            itemPropertyReference, true, singlePageReturnValue, nextPageReturnValue, visibilityFunction,
            getContextParameter(isProtocolMethod), generateClientMethodWithOnlyRequiredParameters, defaultOverloadType);
    }

    private static void createPageableClientMethods(Operation operation, boolean isProtocolMethod,
        JavaSettings settings, List<ClientMethod> methods, Builder builder, ProxyMethod proxyMethod,
        List<ClientMethodParameter> parameters, ModelPropertySegment itemPropertyReference, boolean isSync,
        ReturnValue singlePageReturnValue, ReturnValue nextPageReturnValue, MethodVisibilityFunction visibilityFunction,
        ClientMethodParameter contextParameter, boolean generateClientMethodWithOnlyRequiredParameters,
        MethodOverloadType defaultOverloadType) {

        MethodNamer methodNamer = resolveMethodNamer(proxyMethod, operation.getConvenienceApi(), isProtocolMethod);

        Operation nextOperation = operation.getExtensions().getXmsPageable().getNextOperation();
        ClientMethodType nextMethodType
            = isSync ? ClientMethodType.PagingSyncSinglePage : ClientMethodType.PagingAsyncSinglePage;

        boolean isNextMethod = (nextOperation == operation);

        IType lroIntermediateType = null;
        if (operation.isLro() && !isNextMethod) {
            lroIntermediateType = SchemaUtil.getOperationResponseType(operation, settings);
        }

        List<ClientMethod> nextMethods
            = (isNextMethod || nextOperation == null) ? null : Mappers.getClientMethodMapper().map(nextOperation);

        ClientMethod nextMethod = (nextMethods == null)
            ? null
            : nextMethods.stream().filter(m -> m.getType() == nextMethodType).findFirst().orElse(null);

        IType responseType = proxyMethod.getRawResponseBodyType() != null
            ? proxyMethod.getRawResponseBodyType()
            : proxyMethod.getResponseBodyType();
        ModelPropertySegment nextLinkPropertyReference
            = getPageableNextLink(operation.getExtensions().getXmsPageable(), responseType);

        MethodPageDetails details = new MethodPageDetails(itemPropertyReference, nextLinkPropertyReference, nextMethod,
            lroIntermediateType, MethodPageDetails.ContinuationToken.fromContinuationToken(
                operation.getExtensions().getXmsPageable().getContinuationToken(), responseType));
        builder.methodPageDetails(details);

        String pageMethodName
            = isSync ? methodNamer.getPagingSinglePageMethodName() : methodNamer.getPagingAsyncSinglePageMethodName();
        ClientMethodType pageMethodType
            = isSync ? ClientMethodType.PagingSyncSinglePage : ClientMethodType.PagingAsyncSinglePage;

        // Only generate maximum overload of Paging###SinglePage API, and it should not be exposed to user.

        JavaVisibility methodVisibility = visibilityFunction.methodVisibility(true, defaultOverloadType, false);
        builder.returnValue(singlePageReturnValue)
            .onlyRequiredParameters(false)
            .name(pageMethodName)
            .type(pageMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(methodVisibility);

        if (settings.getSyncMethods() != SyncMethodsGeneration.NONE) {
            methods.add(builder.build());
        }

        // Generate an overload with all parameters, optionally include context.
        builder.methodVisibility(visibilityFunction.methodVisibility(true, defaultOverloadType, true));
        addClientMethodWithContext(methods, builder, parameters, pageMethodType, pageMethodName, singlePageReturnValue,
            details, contextParameter);

        // If this was the next method there is no further work to be done.
        if (isNextMethod) {
            return;
        }

        // Otherwise repeat what we just did but for next page client methods.
        pageMethodName = isSync ? methodNamer.getMethodName() : methodNamer.getSimpleAsyncMethodName();
        pageMethodType = isSync ? ClientMethodType.PagingSync : ClientMethodType.PagingAsync;

        builder.returnValue(nextPageReturnValue)
            .name(pageMethodName)
            .type(pageMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(visibilityFunction.methodVisibility(false, defaultOverloadType, false));

        if (settings.getSyncMethods() != SyncMethodsGeneration.NONE) {
            // generate the overload, if "sync-methods != NONE"

            methods.add(builder.build());

            // overload for versioning
            createOverloadForVersioning(isProtocolMethod, methods, builder, parameters);
        }

        if (generateClientMethodWithOnlyRequiredParameters) {
            methods.add(builder.onlyRequiredParameters(true)
                .methodVisibility(
                    visibilityFunction.methodVisibility(false, MethodOverloadType.OVERLOAD_MINIMUM, false))
                .build());
        }

        MethodPageDetails detailsWithContext = details;
        if (nextMethods != null) {
            // Match to the nextMethod with Context
            IType contextWireType = contextParameter.getWireType();
            nextMethod = nextMethods.stream()
                .filter(m -> m.getType() == nextMethodType)
                .filter(m -> m.getMethodParameters().stream().anyMatch(p -> contextWireType.equals(p.getClientType())))
                .findFirst()
                .orElse(null);

            if (nextMethod != null) {
                detailsWithContext = new MethodPageDetails(itemPropertyReference, nextLinkPropertyReference, nextMethod,
                    lroIntermediateType, MethodPageDetails.ContinuationToken.fromContinuationToken(
                        operation.getExtensions().getXmsPageable().getContinuationToken(), responseType));
            }
        }

        builder.methodVisibility(visibilityFunction.methodVisibility(false, defaultOverloadType, true));
        addClientMethodWithContext(methods, builder, parameters, pageMethodType, pageMethodName, nextPageReturnValue,
            detailsWithContext, contextParameter);
    }

    private void createSimpleAsyncClientMethods(Operation operation, boolean isProtocolMethod, JavaSettings settings,
        List<ClientMethod> methods, Builder builder, ClientMethodsReturnDescription methodsReturnDescription,
        ProxyMethod proxyMethod, List<ClientMethodParameter> parameters,
        boolean generateClientMethodWithOnlyRequiredParameters, MethodOverloadType defaultOverloadType) {

        ReturnValue responseReturnValue
            = methodsReturnDescription.getReturnValue(ClientMethodType.SimpleAsyncRestResponse);
        ReturnValue returnValue = methodsReturnDescription.getReturnValue(ClientMethodType.SimpleAsync);
        MethodVisibilityFunction visibilityFunction = (restResponse, overloadType, includesContext) -> methodVisibility(
            restResponse ? ClientMethodType.SimpleAsyncRestResponse : ClientMethodType.SimpleAsync, overloadType,
            includesContext, isProtocolMethod);

        createSimpleClientMethods(operation, isProtocolMethod, methods, builder, proxyMethod, parameters, false,
            responseReturnValue, returnValue, visibilityFunction, getContextParameter(isProtocolMethod),
            generateClientMethodWithOnlyRequiredParameters, defaultOverloadType);
    }

    private void createSimpleSyncClientMethods(Operation operation, boolean isProtocolMethod, JavaSettings settings,
        List<ClientMethod> methods, Builder builder, ClientMethodsReturnDescription methodsReturnDescription,
        ProxyMethod proxyMethod, List<ClientMethodParameter> parameters,
        boolean generateClientMethodWithOnlyRequiredParameters, MethodOverloadType defaultOverloadType) {

        ReturnValue responseReturnValue
            = methodsReturnDescription.getReturnValue(ClientMethodType.SimpleSyncRestResponse);
        ReturnValue returnValue = methodsReturnDescription.getReturnValue(ClientMethodType.SimpleSync);
        MethodVisibilityFunction visibilityFunction = (restResponse, overloadType, includesContext) -> methodVisibility(
            restResponse ? ClientMethodType.SimpleSyncRestResponse : ClientMethodType.SimpleSync, overloadType,
            includesContext, isProtocolMethod);

        createSimpleClientMethods(operation, isProtocolMethod, methods, builder, proxyMethod, parameters, true,
            responseReturnValue, returnValue, visibilityFunction, getContextParameter(isProtocolMethod),
            generateClientMethodWithOnlyRequiredParameters, defaultOverloadType);
    }

    private static void createSimpleClientMethods(Operation operation, boolean isProtocolMethod,
        List<ClientMethod> methods, Builder builder, ProxyMethod proxyMethod, List<ClientMethodParameter> parameters,
        boolean isSync, ReturnValue responseReturnValue, ReturnValue returnValue,
        MethodVisibilityFunction visibilityFunction, ClientMethodParameter contextParameter,
        boolean generateClientMethodWithOnlyRequiredParameters, MethodOverloadType defaultOverloadType) {

        MethodNamer methodNamer = resolveMethodNamer(proxyMethod, operation.getConvenienceApi(), isProtocolMethod);

        String methodName = isSync
            ? methodNamer.getSimpleRestResponseMethodName()
            : methodNamer.getSimpleAsyncRestResponseMethodName();
        ClientMethodType methodType
            = isSync ? ClientMethodType.SimpleSyncRestResponse : ClientMethodType.SimpleAsyncRestResponse;

        JavaVisibility withContextVisibility = visibilityFunction.methodVisibility(true, defaultOverloadType, true);
        builder.parameters(parameters)
            .returnValue(responseReturnValue)
            .onlyRequiredParameters(false)
            .name(methodName)
            .type(methodType)
            .groupedParameterRequired(false)
            .hasWithContextOverload(withContextVisibility != NOT_GENERATE)
            .methodVisibility(visibilityFunction.methodVisibility(true, defaultOverloadType, false));
        // Always generate an overload of WithResponse with non-required parameters without Context.
        // It is only for sync proxy method, and is usually filtered out in methodVisibility function.
        methods.add(builder.build());

        builder.methodVisibility(withContextVisibility);
        addClientMethodWithContext(methods, builder, parameters, contextParameter);

        // Repeat the same but for simple returns.
        if (proxyMethod.isCustomHeaderIgnored()) {
            return;
        }
        methodName = isSync ? methodNamer.getMethodName() : methodNamer.getSimpleAsyncMethodName();
        methodType = isSync ? ClientMethodType.SimpleSync : ClientMethodType.SimpleAsync;

        builder.parameters(parameters)
            .returnValue(returnValue)
            .name(methodName)
            .type(methodType)
            .groupedParameterRequired(false)
            .methodVisibility(visibilityFunction.methodVisibility(false, defaultOverloadType, false));
        methods.add(builder.build());

        // overload for versioning
        createOverloadForVersioning(isProtocolMethod, methods, builder, parameters);

        if (generateClientMethodWithOnlyRequiredParameters) {
            methods.add(builder
                .methodVisibility(
                    visibilityFunction.methodVisibility(false, MethodOverloadType.OVERLOAD_MINIMUM, false))
                .onlyRequiredParameters(true)
                .build());
        }

        builder.methodVisibility(visibilityFunction.methodVisibility(false, defaultOverloadType, true));
        addClientMethodWithContext(methods, builder, parameters, contextParameter);
    }

    private static void createOverloadForVersioning(boolean isProtocolMethod, List<ClientMethod> methods,
        ClientMethod.Builder builder, List<ClientMethodParameter> parameters) {

        if (!isProtocolMethod && JavaSettings.getInstance().isDataPlaneClient()) {
            if (parameters.stream().anyMatch(p -> p.getVersioning() != null && p.getVersioning().getAdded() != null)) {
                List<List<ClientMethodParameter>> signatures = findOverloadedSignatures(parameters);
                for (List<ClientMethodParameter> overloadedParameters : signatures) {
                    builder.parameters(overloadedParameters);
                    methods.add(builder.build());
                }
            }

            builder.parameters(parameters);
        }
    }

    static List<List<ClientMethodParameter>> findOverloadedSignatures(List<ClientMethodParameter> parameters) {
        List<List<ClientMethodParameter>> signatures = new ArrayList<>();

        List<ClientMethodParameter> allParameters = parameters;
        List<ClientMethodParameter> requiredParameters
            = parameters.stream().filter(MethodParameter::isRequired).collect(Collectors.toList());

        List<String> versions = allParameters.stream().flatMap(p -> {
            if (p.getVersioning() != null && p.getVersioning().getAdded() != null) {
                return p.getVersioning().getAdded().stream();
            } else {
                return Stream.empty();
            }
        }).distinct().collect(Collectors.toList());
        versions.add(0, null);  // for signature of no version

        for (String version : versions) {
            List<ClientMethodParameter> overloadedParameters = allParameters.stream()
                .filter(p -> (p.getVersioning() == null || p.getVersioning().getAdded() == null)
                    || (p.getVersioning() != null
                        && p.getVersioning().getAdded() != null
                        && p.getVersioning().getAdded().contains(version)))
                .collect(Collectors.toList());

            if (!overloadedParameters.equals(allParameters)
                && !overloadedParameters.equals(requiredParameters)
                && !signatures.contains(overloadedParameters)) {
                // take the signature not same as required-only, not same as full, not same as anything already there
                signatures.add(overloadedParameters);
            }
        }

        return signatures;
    }

    private static ClientMethodParameter updateClientMethodParameter(ClientMethodParameter clientMethodParameter) {
        return clientMethodParameter.newBuilder()
            .rawType(ClassType.BINARY_DATA)
            .wireType(ClassType.BINARY_DATA)
            .build();
    }

    /**
     * Extension point of additional methods for LRO.
     */
    protected void createAdditionalLroMethods(Operation operation, ClientMethod.Builder builder,
        List<ClientMethod> methods, boolean isProtocolMethod, ClientMethodsReturnDescription methodsReturnDescription,
        ProxyMethod proxyMethod, List<ClientMethodParameter> parameters,
        boolean generateClientMethodWithOnlyRequiredParameters, MethodOverloadType defaultOverloadType) {

    }

    private void createLroMethods(Operation operation, ClientMethod.Builder builder, List<ClientMethod> methods,
        String asyncMethodName, String syncMethodName, List<ClientMethodParameter> parameters,
        ClientMethodsReturnDescription clientMethodsReturnDescription, MethodPollingDetails methodPollingDetails,
        boolean isProtocolMethod, boolean generateClientMethodWithOnlyRequiredParameters,
        MethodOverloadType defaultOverloadType, ProxyMethod proxyMethod) {

        builder.methodPollingDetails(methodPollingDetails);
        if (JavaSettings.getInstance().isGenerateAsyncMethods()) {
            // begin method async
            methods.add(builder
                .returnValue(clientMethodsReturnDescription.getReturnValue(ClientMethodType.LongRunningBeginAsync,
                    methodPollingDetails))
                .name(asyncMethodName)
                .onlyRequiredParameters(false)
                .type(ClientMethodType.LongRunningBeginAsync)
                .groupedParameterRequired(false)
                .methodVisibility(methodVisibility(ClientMethodType.LongRunningBeginAsync, defaultOverloadType, false,
                    isProtocolMethod))
                .build());

            // overload for versioning
            createOverloadForVersioning(isProtocolMethod, methods, builder, parameters);

            if (generateClientMethodWithOnlyRequiredParameters) {
                methods.add(builder.onlyRequiredParameters(true)
                    .methodVisibility(methodVisibility(ClientMethodType.LongRunningBeginAsync,
                        MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod))
                    .build());
            }

            builder.methodVisibility(
                methodVisibility(ClientMethodType.LongRunningBeginAsync, defaultOverloadType, true, isProtocolMethod));
            addClientMethodWithContext(methods, builder, parameters, getContextParameter(isProtocolMethod));
        }

        final boolean proxyMethodHasFbbParameter = proxyMethod.hasParameterOfType(GenericType.FLUX_BYTE_BUFFER);
        if (!proxyMethodHasFbbParameter
            && (JavaSettings.getInstance().isGenerateSyncMethods()
                || JavaSettings.getInstance().isSyncStackEnabled())) {
            // begin method sync
            methods.add(builder
                .returnValue(clientMethodsReturnDescription.getReturnValue(ClientMethodType.LongRunningBeginSync,
                    methodPollingDetails))
                .name(syncMethodName)
                .onlyRequiredParameters(false)
                .type(ClientMethodType.LongRunningBeginSync)
                .groupedParameterRequired(false)
                .methodVisibility(methodVisibility(ClientMethodType.LongRunningBeginSync, defaultOverloadType, false,
                    isProtocolMethod))
                .build());

            // overload for versioning
            createOverloadForVersioning(isProtocolMethod, methods, builder, parameters);

            if (generateClientMethodWithOnlyRequiredParameters) {
                methods.add(builder.onlyRequiredParameters(true)
                    .methodVisibility(methodVisibility(ClientMethodType.LongRunningBeginSync,
                        MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod))
                    .build());
            }

            builder.methodVisibility(
                methodVisibility(ClientMethodType.LongRunningBeginSync, defaultOverloadType, true, isProtocolMethod));
            addClientMethodWithContext(methods, builder, parameters, getContextParameter(isProtocolMethod));
        }
    }

    private ClientMethodParameter getContextParameter() {
        return new ClientMethodParameter.Builder().description("The context to associate with this operation.")
            .wireType(ClassType.CONTEXT)
            .name("context")
            .requestParameterLocation(RequestParameterLocation.NONE)
            .annotations(Collections.emptyList())
            .constant(false)
            .defaultValue(null)
            .fromClient(false)
            .finalParameter(false)
            .required(false)
            .build();
    }

    /**
     * A {@link JavaVisibility} where the method isn't visible in public API.
     */
    protected static final JavaVisibility NOT_VISIBLE = JavaVisibility.Private;

    /**
     * A {@link JavaVisibility} where the method is visible in public API.
     */
    protected static final JavaVisibility VISIBLE = JavaVisibility.Public;

    /**
     * A {@link JavaVisibility} where the method shouldn't be generated.
     */
    protected static final JavaVisibility NOT_GENERATE = null;

    /**
     * Enum describing the type of method overload.
     */
    protected enum MethodOverloadType {
        // minimum overload, only required parameters
        OVERLOAD_MINIMUM(0x01),
        // maximum overload, required parameters and optional parameters
        OVERLOAD_MAXIMUM(0x10),
        // both a minimum overload and maximum overload, usually because of no optional parameters in API
        OVERLOAD_MINIMUM_MAXIMUM(0x11);

        private final int value;

        MethodOverloadType(int value) {
            this.value = value;
        }

        public int value() {
            return value;
        }
    }

    /**
     * Extension for configuration on method visibility.
     * <p>
     * ClientMethodTemplate.writeMethod (and whether it is called) would also decide the visibility in generated code.
     *
     * @param methodType the type of the client method.
     * @param methodOverloadType type of method overload.
     * @param hasContextParameter whether the method has Context parameter.
     * @param isProtocolMethod whether the client method to be simplified for resilience to API changes.
     * @return method visibility, null if do not generate.
     */
    protected JavaVisibility methodVisibility(ClientMethodType methodType, MethodOverloadType methodOverloadType,
        boolean hasContextParameter, boolean isProtocolMethod) {

        JavaSettings settings = JavaSettings.getInstance();
        if (settings.isDataPlaneClient()) {
            if (isProtocolMethod) {
                /*
                 * Rule for DPG protocol method
                 * 
                 * 1. Only generate "WithResponse" method for simple API (hence exclude SimpleAsync and SimpleSync).
                 * 2. For sync method, Context is included in "RequestOptions", hence do not generate method with
                 * Context parameter.
                 * 3. For async method, Context is not included in method (this rule is valid for all clients).
                 */
                if (methodType == ClientMethodType.SimpleAsync
                    || methodType == ClientMethodType.SimpleSync
                    || !hasContextParameter
                    || (methodType == ClientMethodType.PagingSyncSinglePage && !settings.isSyncStackEnabled())) {
                    return NOT_GENERATE;
                }

                if (methodType == ClientMethodType.PagingAsyncSinglePage
                    || (methodType == ClientMethodType.PagingSyncSinglePage && settings.isSyncStackEnabled())) {
                    return NOT_VISIBLE;
                }
                return VISIBLE;
            } else {
                // at present, only generate convenience method for simple API and pageable API (no LRO)
                return ((methodType == ClientMethodType.SimpleAsync && !hasContextParameter)
                    || (methodType == ClientMethodType.SimpleSync && !hasContextParameter)
                    || (methodType == ClientMethodType.PagingAsync && !hasContextParameter)
                    || (methodType == ClientMethodType.PagingSync && !hasContextParameter)
                    || (methodType == ClientMethodType.LongRunningBeginAsync && !hasContextParameter)
                    || (methodType == ClientMethodType.LongRunningBeginSync && !hasContextParameter))
                        // || (methodType == ClientMethodType.SimpleSyncRestResponse && hasContextParameter))
                        ? VISIBLE
                        : NOT_GENERATE;
            }
        } else {
            if (methodType == ClientMethodType.SimpleSyncRestResponse && !hasContextParameter) {
                return NOT_GENERATE;
            } else if (methodType == ClientMethodType.SimpleSync && hasContextParameter) {
                return NOT_GENERATE;
            }
            return VISIBLE;
        }
    }

    @FunctionalInterface
    private interface MethodVisibilityFunction {
        JavaVisibility methodVisibility(boolean isRestResponseOrIsFirstPage, MethodOverloadType methodOverloadType,
            boolean hasContextParameter);
    }

    private static void addClientMethodWithContext(List<ClientMethod> methods, Builder builder,
        List<ClientMethodParameter> parameters, ClientMethodType clientMethodType, String proxyMethodName,
        ReturnValue returnValue, MethodPageDetails details, ClientMethodParameter contextParameter) {

        List<ClientMethodParameter> updatedParams = new ArrayList<>(parameters);
        if (JavaSettings.getInstance().isBranded()
            || contextParameter.getClientType().equals(ClassType.REQUEST_OPTIONS)) {
            updatedParams.add(contextParameter);
        }

        methods.add(builder.parameters(updatedParams) // update builder parameters to include context
            .returnValue(returnValue)
            .name(proxyMethodName)
            .onlyRequiredParameters(false)
            .type(clientMethodType)
            .groupedParameterRequired(false)
            .methodPageDetails(details)
            .build());
        // reset the parameters to original params
        builder.parameters(parameters);
    }

    /**
     * Gets the Context parameter.
     *
     * @param isProtocolMethod Whether the method is a protocol method.
     * @return The Context parameter.
     */
    protected ClientMethodParameter getContextParameter(boolean isProtocolMethod) {
        return isProtocolMethod ? ClientMethodParameter.REQUEST_OPTIONS_PARAMETER : getContextParameter();
    }

    /**
     * Adds a {@link ClientMethod} that has a Context parameter included.
     *
     * @param methods The list of {@link ClientMethod ClientMethods} already created.
     * @param builder The builder for the {@link ClientMethod}.
     * @param parameters Parameters of the method.
     * @param contextParameter The Context parameter.
     */
    protected static void addClientMethodWithContext(List<ClientMethod> methods, Builder builder,
        List<ClientMethodParameter> parameters, ClientMethodParameter contextParameter) {
        List<ClientMethodParameter> updatedParams = new ArrayList<>(parameters);
        if (JavaSettings.getInstance().isBranded()
            || contextParameter.getClientType().equals(ClassType.REQUEST_OPTIONS)) {
            updatedParams.add(contextParameter);
        }

        methods.add(builder.parameters(updatedParams) // update builder parameters to include context
            .onlyRequiredParameters(false)
            .hasWithContextOverload(false) // WithContext overload doesn't have a withContext overload
            .build());
        // reset the parameters to original params
        builder.parameters(parameters);
    }

    private static ModelPropertySegment getPageableItem(XmsPageable xmsPageable, IType responseBodyType) {
        return ClientModelUtil.getModelPropertySegment(responseBodyType, xmsPageable.getItemName());
    }

    private static ModelPropertySegment getPageableNextLink(XmsPageable xmsPageable, IType responseBodyType) {
        return ClientModelUtil.getModelPropertySegment(responseBodyType, xmsPageable.getNextLinkName());
    }

    private IType getPollingIntermediateType(JavaSettings.PollingDetails details, IType syncReturnType) {
        IType pollResponseType = syncReturnType.asNullable();
        if (JavaSettings.getInstance().isFluent()) {
            return pollResponseType;
        }
        if (details != null && details.getIntermediateType() != null) {
            pollResponseType = createTypeFromModelName(details.getIntermediateType());
        }
        // azure-core wants poll response to be non-null
        if (pollResponseType.asNullable() == ClassType.VOID) {
            pollResponseType = ClassType.BINARY_DATA;
        }

        return pollResponseType;
    }

    private IType getPollingFinalType(JavaSettings.PollingDetails details, IType syncReturnType,
        HttpMethod httpMethod) {
        IType resultType = syncReturnType.asNullable();
        if (JavaSettings.getInstance().isFluent()) {
            return resultType;
        }
        if (details != null && details.getFinalType() != null) {
            resultType = createTypeFromModelName(details.getFinalType());
        }
        // azure-core wants poll response to be non-null
        if (resultType.asNullable() == ClassType.VOID) {
            resultType = ClassType.BINARY_DATA;
        }
        // DELETE would not have final response as resource is deleted
        if (httpMethod == HttpMethod.DELETE) {
            resultType = PrimitiveType.VOID;
        }

        return resultType;
    }

    private static boolean hasNonRequiredParameters(List<ClientMethodParameter> parameters) {
        return parameters.stream().anyMatch(p -> !p.isRequired() && !p.isConstant());
    }

    private static MethodPollingDetails methodPollingDetailsFromMetadata(Operation operation,
        JavaSettings.PollingDetails pollingDetails) {

        if (pollingDetails == null || operation.getConvenienceApi() == null) {
            return null;
        }

        MethodPollingDetails methodPollingDetails = null;
        if (operation.getLroMetadata() != null) {
            // only TypeSpec would have LongRunningMetadata
            LongRunningMetadata metadata = operation.getLroMetadata();
            ObjectMapper objectMapper = Mappers.getObjectMapper();
            IType intermediateType = objectMapper.map(metadata.getPollResultType());
            IType finalType = metadata.getFinalResultType() == null
                ? PrimitiveType.VOID
                : objectMapper.map(metadata.getFinalResultType());

            // PollingDetails would override LongRunningMetadata
            if (pollingDetails.getIntermediateType() != null) {
                intermediateType = createTypeFromModelName(pollingDetails.getIntermediateType());
            }
            if (pollingDetails.getFinalType() != null) {
                finalType = createTypeFromModelName(pollingDetails.getFinalType());
            }

            // PollingStrategy
            JavaSettings settings = JavaSettings.getInstance();
            final String packageName = settings.getPackage(settings.getImplementationSubpackage());
            String pollingStrategy = metadata.getPollingStrategy() == null
                ? pollingDetails.getStrategy()
                : String.format(JavaSettings.PollingDetails.DEFAULT_POLLING_STRATEGY_FORMAT,
                    packageName + "." + metadata.getPollingStrategy().getLanguage().getJava().getName());
            String syncPollingStrategy = metadata.getPollingStrategy() == null
                ? pollingDetails.getSyncStrategy()
                : String.format(JavaSettings.PollingDetails.DEFAULT_POLLING_STRATEGY_FORMAT,
                    packageName + ".Sync" + metadata.getPollingStrategy().getLanguage().getJava().getName());
            if (metadata.getPollingStrategy() != null && metadata.getFinalResultPropertySerializedName() != null) {
                // add "<property-name>" argument to polling strategy constructor
                Function<String, String> addPropertyNameToArguments = (strategy) -> {
                    strategy = strategy.substring(0, strategy.length() - 1) + ", ";
                    strategy
                        += ClassType.STRING.defaultValueExpression(metadata.getFinalResultPropertySerializedName());
                    strategy += ")";
                    return strategy;
                };
                pollingStrategy = addPropertyNameToArguments.apply(pollingStrategy);
                syncPollingStrategy = addPropertyNameToArguments.apply(syncPollingStrategy);
            }

            methodPollingDetails = new MethodPollingDetails(pollingStrategy, syncPollingStrategy, intermediateType,
                finalType, pollingDetails.getPollIntervalInSeconds());
        }
        return methodPollingDetails;
    }

    /**
     * Create IType from model name (full name or simple name).
     *
     * @param modelName the model name. If it is simple name, package name from JavaSetting will be used.
     * @return IType of the model
     */
    private static IType createTypeFromModelName(String modelName) {
        String finalTypeName;
        String finalTypePackage;
        if (modelName.contains(".")) {
            finalTypeName = ANYTHING_THEN_PERIOD.matcher(modelName).replaceAll("");
            finalTypePackage = modelName.replace("." + finalTypeName, "");
        } else {
            finalTypeName = modelName;
            finalTypePackage = JavaSettings.getInstance().getPackage();
        }
        return new ClassType.Builder().packageName(finalTypePackage).name(finalTypeName).build();
    }

    private static MethodNamer resolveMethodNamer(ProxyMethod proxyMethod, ConvenienceApi convenienceApi,
        boolean isProtocolMethod) {
        if (!isProtocolMethod && convenienceApi != null) {
            return new MethodNamer(SchemaUtil.getJavaName(convenienceApi));
        } else {
            if (proxyMethod.isSync()) {
                return new MethodNamer(proxyMethod.getBaseName());
            }
            return new MethodNamer(proxyMethod.getName());
        }
    }
}
