// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConvenienceApi;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
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
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformations;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
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
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * A mapper that maps an {@link Operation} to a lit of {@link ClientMethod ClientMethods}.
 */
public class ClientMethodMapper implements IMapper<Operation, List<ClientMethod>> {
    private static final ClientMethodMapper INSTANCE = new ClientMethodMapper();
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
        // synchronous implementation client methods -
        //
        // 1. If "enable-sync-stack" option is configured then generator will create synchronous proxy methods that will
        // use a fully synchronous code path.
        // 2. If "sync-methods" option is configured then generator will create synchronous implementation client
        // methods that will block on the asynchronous proxy method.
        //
        // If both options are set then "enable-sync-stack" take precedent.

        Map<Request, List<ProxyMethod>> proxyMethodsMap = Mappers.getProxyMethodMapper().map(operation);

        List<ClientMethod> methods = new ArrayList<>();

        // If this operation is part of a group it'll need to be referenced with a more specific target.
        final ClientMethod.Builder builder = new ClientMethod.Builder()
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
        if (operation.getLanguage().getJava() != null
            && !CoreUtils.isNullOrEmpty(operation.getLanguage().getJava().getComment())) {
            builder.implementationDetails(
                new ImplementationDetails.Builder().comment(operation.getLanguage().getJava().getComment()).build());
        }

        // map externalDocs property
        if (operation.getExternalDocs() != null) {
            final ExternalDocumentation externalDocumentation
                = new ExternalDocumentation.Builder().description(operation.getExternalDocs().getDescription())
                    .url(operation.getExternalDocs().getUrl())
                    .build();
            builder.methodDocumentation(externalDocumentation);
        }

        List<Request> requests = getCodeModelRequests(operation, isProtocolMethod, proxyMethodsMap);
        for (Request request : requests) {
            List<ProxyMethod> proxyMethods = proxyMethodsMap.get(request);
            for (ProxyMethod proxyMethod : proxyMethods) {
                builder.proxyMethod(proxyMethod);

                final ClientMethodsReturnDescription methodsReturnDescription = ClientMethodsReturnDescription
                    .create(operation, isProtocolMethod, proxyMethod.isCustomHeaderIgnored());
                final List<ClientMethodParameter> parameters = new ArrayList<>();
                final List<String> requiredParameterExpressions = new ArrayList<>();
                final Map<String, String> validateExpressions = new HashMap<>();
                final ParametersTransformationProcessor transformationProcessor
                    = new ParametersTransformationProcessor(isProtocolMethod);

                List<Parameter> codeModelParameters = getCodeModelParameters(request, isProtocolMethod);

                if (operation.isPageable()) {
                    // remove maxpagesize parameter from client method API, for Azure, it would be in e.g.
                    // PagedIterable.iterableByPage(int), and also remove continuationToken for unbranded.
                    codeModelParameters = codeModelParameters.stream()
                        .filter(p -> !MethodUtil.shouldHideParameterInPageable(p,
                            operation.getExtensions().getXmsPageable()))
                        .collect(Collectors.toList());
                }

                final boolean isJsonPatch = MethodUtil.isContentTypeInRequest(request, "application/json-patch+json");
                // If the ProxyMethod uses BinaryData and CodeModel Parameter uses Flux<ByteBuffer> then update the
                // CodeModel Parameter type to match with ProxyMethod's.
                final boolean mapFluxByteBufferToBinaryData = proxyMethod.hasParameterOfType(ClassType.BINARY_DATA);

                for (Parameter parameter : codeModelParameters) {
                    final ClientMethodParameter clientMethodParameter = toClientMethodParameter(parameter, isJsonPatch,
                        mapFluxByteBufferToBinaryData, isProtocolMethod);
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

                final JavaVisibility methodVisibilityInWrapperClient;
                if (operation.getInternalApi() == Boolean.TRUE
                    || (isProtocolMethod && operation.getGenerateProtocolApi() == Boolean.FALSE)) {
                    // Client method is package private in wrapper client, so that the client or developer can still
                    // invoke it.
                    methodVisibilityInWrapperClient = JavaVisibility.PackagePrivate;
                } else {
                    methodVisibilityInWrapperClient = JavaVisibility.Public;
                }

                final MethodNamer methodNamer
                    = resolveMethodNamer(proxyMethod, operation.getConvenienceApi(), isProtocolMethod);
                final CreateClientMethodArgs createClientMethodArgs = new CreateClientMethodArgs(settings,
                    isProtocolMethod, methodsReturnDescription, defaultOverloadType, methodNamer);

                final ClientMethod baseMethod = builder.parameters(parameters)
                    .requiredNullableParameterExpressions(requiredParameterExpressions)
                    .validateExpressions(validateExpressions)
                    .parameterTransformations(transformations)
                    .methodVisibilityInWrapperClient(methodVisibilityInWrapperClient)
                    .methodPageDetails(null)
                    .build();

                if (operation.isPageable()) {
                    final PagingMetadata pagingMetadata = PagingMetadata.create(operation, proxyMethod, settings);
                    if (pagingMetadata == null) {
                        // Skip if paging metadata cannot be derived.
                        continue;
                    }

                    if (proxyMethod.isSync()) {
                        // If the ProxyMethod is sync, perform a complete generation of synchronous pageable APIs.
                        createPagingClientMethods(true, methods, baseMethod, pagingMetadata, createClientMethodArgs);
                    } else {
                        // If the ProxyMethod is async, perform a complete generation of asynchronous pageable APIs.
                        createPagingClientMethods(false, methods, baseMethod, pagingMetadata, createClientMethodArgs);

                        if (settings.isGenerateSyncMethods() && !settings.isSyncStackEnabled()) {
                            // If SyncMethodsGeneration is enabled and Sync Stack is not, perform synchronous pageable
                            // API generation.
                            createPagingClientMethods(true, methods, baseMethod, pagingMetadata,
                                createClientMethodArgs);
                        }
                    }
                } else if (operation.isLro()
                    && (settings.isFluent() || settings.getPollingSettings("default") != null)) {

                    if (proxyMethod.isSync()
                        || methodsReturnDescription.getSyncReturnType().equals(ClassType.INPUT_STREAM)) {
                        // Skip the following
                        // 1. Sync ProxyMethods for polling as sync polling isn't ready yet.
                        // 2. InputStream return type as it does not adhere to PollerFlux contract.
                        continue;
                    }

                    final JavaVisibility simpleAsyncMethodVisibility;
                    final JavaVisibility simpleAsyncMethodWithContextVisibility;
                    final JavaVisibility simpleSyncMethodVisibility;
                    final JavaVisibility simpleSyncMethodWithContextVisibility;
                    if (settings.isDataPlaneClient()) {
                        // There is ambiguity of RestResponse from simple API and from LRO API e.g.
                        // SimpleAsyncRestResponse
                        // without Context in simple API should be VISIBLE hence these settings here for DPG
                        simpleAsyncMethodVisibility = NOT_GENERATE;
                        simpleAsyncMethodWithContextVisibility = NOT_VISIBLE;
                        simpleSyncMethodVisibility = NOT_GENERATE;
                        simpleSyncMethodWithContextVisibility = NOT_VISIBLE;
                    } else {
                        // for vanilla and fluent, the SimpleAsyncRestResponse is VISIBLE, so that they can be used for
                        // possible customization on LRO
                        simpleAsyncMethodVisibility = methodVisibility(ClientMethodType.SimpleAsyncRestResponse,
                            defaultOverloadType, false, isProtocolMethod);
                        simpleAsyncMethodWithContextVisibility = methodVisibility(
                            ClientMethodType.SimpleAsyncRestResponse, defaultOverloadType, true, isProtocolMethod);
                        simpleSyncMethodVisibility = methodVisibility(ClientMethodType.SimpleSyncRestResponse,
                            defaultOverloadType, false, isProtocolMethod);
                        simpleSyncMethodWithContextVisibility = methodVisibility(
                            ClientMethodType.SimpleSyncRestResponse, defaultOverloadType, true, isProtocolMethod);
                    }

                    // '[Operation]WithResponseAsync', with required and optional parameters.
                    final boolean hasContextOverload = simpleAsyncMethodWithContextVisibility != NOT_GENERATE;
                    final ClientMethod withResponseAsyncMethod = baseMethod.newBuilder()
                        .returnValue(methodsReturnDescription.getReturnValue(ClientMethodType.SimpleAsyncRestResponse))
                        .name(proxyMethod.getSimpleAsyncRestResponseMethodName())
                        .onlyRequiredParameters(false)
                        .type(ClientMethodType.SimpleAsyncRestResponse)
                        .groupedParameterRequired(false)
                        .methodVisibility(simpleAsyncMethodVisibility)
                        .hasWithContextOverload(hasContextOverload)
                        .build();
                    methods.add(withResponseAsyncMethod);
                    addClientMethodWithContext(methods, withResponseAsyncMethod, simpleAsyncMethodWithContextVisibility,
                        isProtocolMethod);

                    if (JavaSettings.getInstance().isSyncStackEnabled()
                        && !proxyMethod.hasParameterOfType(GenericType.FLUX_BYTE_BUFFER)) {
                        // '[Operation]WithResponse' sync method, with required and optional parameters.
                        final Builder withResponseSyncBuilder = baseMethod.newBuilder()
                            .name(proxyMethod.getSimpleRestResponseMethodName())
                            .onlyRequiredParameters(false)
                            .type(ClientMethodType.SimpleSyncRestResponse)
                            .groupedParameterRequired(false)
                            .hasWithContextOverload(simpleSyncMethodWithContextVisibility != NOT_GENERATE)
                            .proxyMethod(proxyMethod.toSync());

                        if (settings.isFluent()) {
                            // fluent + sync stack needs simple rest response for implementation only
                            //
                            final IType baseType = ClassType.BINARY_DATA;
                            final IType returnType = ResponseTypeFactory.createSyncResponse(operation, baseType,
                                isProtocolMethod, settings, proxyMethod.isCustomHeaderIgnored());
                            final ReturnValue binaryDataResponse
                                = methodsReturnDescription.createReturnValue(returnType, baseType);
                            final ClientMethod withResponseSyncMethod
                                = withResponseSyncBuilder.returnValue(binaryDataResponse)
                                    .methodVisibility(NOT_VISIBLE)
                                    .build();
                            methods.add(withResponseSyncMethod);
                            addClientMethodWithContext(methods, withResponseSyncMethod, NOT_VISIBLE, isProtocolMethod);
                        } else {
                            final ClientMethod withResponseSyncMethod = withResponseSyncBuilder
                                .returnValue(
                                    methodsReturnDescription.getReturnValue(ClientMethodType.SimpleSyncRestResponse))
                                .methodVisibility(simpleSyncMethodVisibility)
                                .build();
                            methods.add(withResponseSyncMethod);
                            addClientMethodWithContext(methods, withResponseSyncMethod,
                                simpleSyncMethodWithContextVisibility, isProtocolMethod);
                        }
                    } ;
                    final PollingMetadata pollingMetadata
                        = PollingMetadata.create(operation, proxyMethod, methodsReturnDescription.getSyncReturnType());
                    if (pollingMetadata != null) {
                        if (isProtocolMethod) {
                            createLroBeginProtocolMethods(baseMethod, methods, pollingMetadata, createClientMethodArgs);
                        } else {
                            final ClientMethod lroBaseMethod = baseMethod.newBuilder()
                                .methodPollingDetails(pollingMetadata.asMethodPollingDetails())
                                .build();
                            createLroBeginMethods(lroBaseMethod, methods, methodNamer.getLroBeginAsyncMethodName(),
                                methodNamer.getLroBeginMethodName(), createClientMethodArgs);
                        }
                    } else {
                        createLroBeginMethods(baseMethod, methods, methodNamer.getLroBeginAsyncMethodName(),
                            methodNamer.getLroBeginMethodName(), createClientMethodArgs);

                        this.createAdditionalLroMethods(baseMethod, methods, createClientMethodArgs);
                    }
                } else {
                    if (proxyMethod.isSync()) {
                        // If the ProxyMethod is sync, perform a complete generation of synchronous simple APIs.
                        createSimpleClientMethods(true, methods, baseMethod, createClientMethodArgs);
                    } else {
                        // Otherwise, perform a complete generation of asynchronous simple APIs.
                        if (settings.getSyncMethods() != SyncMethodsGeneration.SYNC_ONLY) {
                            // SyncMethodsGeneration.NONE would still generate these
                            createSimpleClientMethods(false, methods, baseMethod, createClientMethodArgs);
                        }

                        if (settings.isGenerateSyncMethods() && !settings.isSyncStackEnabled()) {
                            // If SyncMethodsGeneration is enabled and Sync Stack is not, perform synchronous simple
                            // API generation.
                            createSimpleClientMethods(true, methods, baseMethod, createClientMethodArgs);
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

    /**
     * Extension point of additional methods for LRO.
     */
    protected void createAdditionalLroMethods(ClientMethod lroBaseMethod, List<ClientMethod> methods,
        CreateClientMethodArgs createClientMethodArgs) {
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

    private static ClientMethodParameter toClientMethodParameter(Parameter parameter, boolean isJsonPatch,
        boolean mapFluxByteBufferToBinaryData, boolean isProtocolMethod) {
        final ClientMethodParameter clientMethodParameter;
        if (isJsonPatch) {
            clientMethodParameter = CustomClientParameterMapper.getInstance().map(parameter, isProtocolMethod);
        } else {
            clientMethodParameter = Mappers.getClientParameterMapper().map(parameter, isProtocolMethod);
        }

        if (mapFluxByteBufferToBinaryData && clientMethodParameter.getClientType() == GenericType.FLUX_BYTE_BUFFER) {
            return clientMethodParameter.newBuilder()
                .rawType(ClassType.BINARY_DATA)
                .wireType(ClassType.BINARY_DATA)
                .build();
        } else {
            return clientMethodParameter;
        }
    }

    private static void createOverloadForVersioning(boolean isProtocolMethod, List<ClientMethod> methods,
        ClientMethod baseMethod) {
        final List<ClientMethodParameter> parameters = baseMethod.getParameters();
        if (!isProtocolMethod && JavaSettings.getInstance().isDataPlaneClient()) {
            if (parameters.stream().anyMatch(p -> p.getVersioning() != null && p.getVersioning().getAdded() != null)) {
                final List<List<ClientMethodParameter>> signatures = findOverloadedSignatures(parameters);
                for (List<ClientMethodParameter> overloadedParameters : signatures) {
                    final ClientMethod overloadedMethod
                        = baseMethod.newBuilder().parameters(overloadedParameters).build();
                    methods.add(overloadedMethod);
                }
            }
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

    private void createPagingClientMethods(boolean isSync, List<ClientMethod> methods, ClientMethod baseMethod,
        PagingMetadata pagingMetadata, CreateClientMethodArgs createClientMethodArgs) {

        createSinglePageClientMethods(isSync, methods, baseMethod, pagingMetadata, createClientMethodArgs);
        if (pagingMetadata.isNextMethod()) {
            // If this was the next method there is no streaming methods to be generated.
            return;
        }
        createPageStreamingClientMethods(isSync, methods, baseMethod, pagingMetadata, createClientMethodArgs);
    }

    private void createSinglePageClientMethods(boolean isSync, List<ClientMethod> methods, ClientMethod baseMethod,
        PagingMetadata pagingMetadata, CreateClientMethodArgs createMethodArgs) {

        final JavaSettings settings = createMethodArgs.settings;
        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType defaultOverloadType = createMethodArgs.defaultOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final MethodNamer methodNamer = createMethodArgs.methodNamer;

        final String singlePageMethodName;
        final ClientMethodType singlePageMethodType;
        final MethodPageDetails methodPageDetails;
        if (isSync) {
            singlePageMethodName = methodNamer.getPagingSinglePageMethodName();
            singlePageMethodType = ClientMethodType.PagingSyncSinglePage;
            methodPageDetails = pagingMetadata.asMethodPageDetails(true);
        } else {
            singlePageMethodName = methodNamer.getPagingAsyncSinglePageMethodName();
            singlePageMethodType = ClientMethodType.PagingAsyncSinglePage;
            methodPageDetails = pagingMetadata.asMethodPageDetails(false);
        }
        final ReturnValue singlePageMethodReturnValue = methodsReturnDescription.getReturnValue(singlePageMethodType);
        final JavaVisibility singlePageMethodVisibility
            = methodVisibility(singlePageMethodType, defaultOverloadType, false, isProtocolMethod);
        final JavaVisibility singlePageMethodWithContextVisibility
            = methodVisibility(singlePageMethodType, defaultOverloadType, true, isProtocolMethod);

        // Generate only maximum overload of '[Operation]SinglePage', and it should not be exposed to user.
        final ClientMethod singlePageMethod = baseMethod.newBuilder()
            .methodPageDetails(methodPageDetails)
            .returnValue(singlePageMethodReturnValue)
            .onlyRequiredParameters(false)
            .name(singlePageMethodName)
            .type(singlePageMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(singlePageMethodVisibility)
            .build();

        if (settings.getSyncMethods() != SyncMethodsGeneration.NONE) {
            methods.add(singlePageMethod);
        }

        // Generate '[Operation]SinglePage' overload with all parameters and Context.
        addClientMethodWithContext(methods, singlePageMethod, singlePageMethodWithContextVisibility, isProtocolMethod);
    }

    private void createPageStreamingClientMethods(boolean isSync, List<ClientMethod> methods, ClientMethod baseMethod,
        PagingMetadata pagingMetadata, CreateClientMethodArgs createMethodArgs) {

        final JavaSettings settings = createMethodArgs.settings;
        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType defaultOverloadType = createMethodArgs.defaultOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final boolean generateRequiredOnlyParametersOverload = createMethodArgs.generateRequiredOnlyParametersOverload;
        final MethodNamer methodNamer = createMethodArgs.methodNamer;

        final String pagingMethodName;
        final ClientMethodType pagingMethodType;
        final MethodPageDetails methodPageDetails;
        final MethodPageDetails methodPageDetailsWithContext;
        if (isSync) {
            pagingMethodName = methodNamer.getMethodName();
            pagingMethodType = ClientMethodType.PagingSync;
            methodPageDetails = pagingMetadata.asMethodPageDetails(true);
            methodPageDetailsWithContext
                = pagingMetadata.asMethodPageDetailsForContext(true, getContextParameter(isProtocolMethod));
        } else {
            pagingMethodName = methodNamer.getSimpleAsyncMethodName();
            pagingMethodType = ClientMethodType.PagingAsync;
            methodPageDetails = pagingMetadata.asMethodPageDetails(false);
            methodPageDetailsWithContext
                = pagingMetadata.asMethodPageDetailsForContext(false, getContextParameter(isProtocolMethod));
        }
        final ReturnValue pagingMethodReturnValue = methodsReturnDescription.getReturnValue(pagingMethodType);
        final JavaVisibility pagingMethodVisibility
            = methodVisibility(pagingMethodType, defaultOverloadType, false, isProtocolMethod);
        final JavaVisibility pagingMethodWithOnlyRequiredParametersVisibility
            = methodVisibility(pagingMethodType, MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod);
        final JavaVisibility pagingMethodWithContextVisibility
            = methodVisibility(pagingMethodType, defaultOverloadType, true, isProtocolMethod);

        final ClientMethod pagingMethod = baseMethod.newBuilder()
            .methodPageDetails(methodPageDetails)
            .returnValue(pagingMethodReturnValue)
            .onlyRequiredParameters(false)
            .name(pagingMethodName)
            .type(pagingMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(pagingMethodVisibility)
            .build();

        if (settings.getSyncMethods() != SyncMethodsGeneration.NONE) {
            // generate the overload, if "sync-methods != NONE"
            methods.add(pagingMethod);
            // overload for versioning
            createOverloadForVersioning(isProtocolMethod, methods, pagingMethod);
        }

        if (generateRequiredOnlyParametersOverload) {
            final ClientMethod pagingMethodWithOnlyRequiredParameters = pagingMethod.newBuilder()
                .onlyRequiredParameters(true)
                .methodVisibility(pagingMethodWithOnlyRequiredParametersVisibility)
                .build();
            methods.add(pagingMethodWithOnlyRequiredParameters);
        }

        final ClientMethod pagingMethodWithContext;
        if (methodPageDetailsWithContext != null) {
            pagingMethodWithContext = pagingMethod.newBuilder().methodPageDetails(methodPageDetailsWithContext).build();
        } else {
            pagingMethodWithContext = pagingMethod;
        }
        addClientMethodWithContext(methods, pagingMethodWithContext, pagingMethodWithContextVisibility,
            isProtocolMethod);
    }

    private void createLroBeginProtocolMethods(ClientMethod baseMethod, List<ClientMethod> methods,
        PollingMetadata pollingMetadata, CreateClientMethodArgs createMethodArgs) {

        assert createMethodArgs.isProtocolMethod;
        final MethodNamer methodNamer = createMethodArgs.methodNamer;

        if (pollingMetadata.hasModelResultTypes()) {
            final ImplementationDetails implementationDetails;
            if (baseMethod.getImplementationDetails() != null) {
                implementationDetails
                    = baseMethod.getImplementationDetails().newBuilder().implementationOnly(true).build();
            } else {
                implementationDetails = new ImplementationDetails.Builder().implementationOnly(true).build();
            }
            final ClientMethod lroBaseMethod = baseMethod.newBuilder()
                .implementationDetails(implementationDetails)
                .methodPollingDetails(pollingMetadata.asMethodPollingDetails())
                .build();

            createLroBeginMethods(lroBaseMethod, methods, methodNamer.getLroModelBeginAsyncMethodName(),
                methodNamer.getLroModelBeginMethodName(), createMethodArgs);
        }

        final ClientMethod lroBaseMethod = baseMethod.newBuilder()
            .methodPollingDetails(pollingMetadata.asMethodPollingDetailsForBinaryDataResult())
            .build();
        createLroBeginMethods(lroBaseMethod, methods, methodNamer.getLroBeginAsyncMethodName(),
            methodNamer.getLroBeginMethodName(), createMethodArgs);
    }

    private void createLroBeginMethods(ClientMethod lroBaseMethod, List<ClientMethod> methods, String asyncMethodName,
        String syncMethodName, CreateClientMethodArgs createClientMethodArgs) {

        final boolean createAsync = JavaSettings.getInstance().isGenerateAsyncMethods();
        if (createAsync) {
            createLroBeginMethods(false, lroBaseMethod, methods, asyncMethodName, createClientMethodArgs);
        }

        if (lroBaseMethod.getProxyMethod().hasParameterOfType(GenericType.FLUX_BYTE_BUFFER)) {
            return;
        }
        final boolean createSync
            = (JavaSettings.getInstance().isGenerateSyncMethods() || JavaSettings.getInstance().isSyncStackEnabled());
        if (createSync) {
            createLroBeginMethods(true, lroBaseMethod, methods, syncMethodName, createClientMethodArgs);
        }
    }

    private void createLroBeginMethods(boolean isSync, ClientMethod lroBaseMethod, List<ClientMethod> methods,
        String methodName, CreateClientMethodArgs createMethodArgs) {

        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType defaultOverloadType = createMethodArgs.defaultOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final boolean generateRequiredOnlyParametersOverload = createMethodArgs.generateRequiredOnlyParametersOverload;

        final ClientMethodType clientMethodType;
        if (isSync) {
            clientMethodType = ClientMethodType.LongRunningBeginSync;
        } else {
            clientMethodType = ClientMethodType.LongRunningBeginAsync;
        }
        final MethodPollingDetails methodPollingDetails = lroBaseMethod.getMethodPollingDetails();

        // LRO 'begin[Operation]' sync or async method.
        final ClientMethod beginLroMethod = lroBaseMethod.newBuilder()
            .returnValue(methodsReturnDescription.getReturnValue(clientMethodType, methodPollingDetails))
            .name(methodName)
            .onlyRequiredParameters(false)
            .type(clientMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(methodVisibility(clientMethodType, defaultOverloadType, false, isProtocolMethod))
            .build();
        methods.add(beginLroMethod);

        // LRO 'begin[Operation]' sync or async method overloads with versioning.
        createOverloadForVersioning(isProtocolMethod, methods, beginLroMethod);

        if (generateRequiredOnlyParametersOverload) {
            // LRO 'begin[Operation]' sync or async method overload with only required parameters.
            final ClientMethod beginLroMethodWithRequiredParameters = beginLroMethod.newBuilder()
                .onlyRequiredParameters(true)
                .methodVisibility(
                    methodVisibility(clientMethodType, MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod))
                .build();
            methods.add(beginLroMethodWithRequiredParameters);
        }

        // LRO 'begin[Operation]' sync or async method overload with only required with context parameters.
        final JavaVisibility beginLroMethodWithContextVisibility
            = methodVisibility(clientMethodType, defaultOverloadType, true, isProtocolMethod);
        addClientMethodWithContext(methods, beginLroMethod, beginLroMethodWithContextVisibility, isProtocolMethod);
    }

    private void createSimpleClientMethods(boolean isSync, List<ClientMethod> methods, ClientMethod baseMethod,
        CreateClientMethodArgs createClientMethodArgs) {

        createSimpleWithResponseClientMethods(isSync, methods, baseMethod, createClientMethodArgs);

        if (baseMethod.getProxyMethod().isCustomHeaderIgnored()) {
            return;
        }
        createSimpleValueClientMethods(isSync, methods, baseMethod, createClientMethodArgs);
    }

    private void createSimpleWithResponseClientMethods(boolean isSync, List<ClientMethod> methods,
        ClientMethod baseMethod, CreateClientMethodArgs createMethodArgs) {

        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType defaultOverloadType = createMethodArgs.defaultOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final MethodNamer methodNamer = createMethodArgs.methodNamer;

        // '[Operation]WithResponse' sync or async methods.
        //
        final String withResponseMethodName;
        final ClientMethodType withResponseMethodType;
        if (isSync) {
            withResponseMethodName = methodNamer.getSimpleRestResponseMethodName();
            withResponseMethodType = ClientMethodType.SimpleSyncRestResponse;
        } else {
            withResponseMethodName = methodNamer.getSimpleAsyncRestResponseMethodName();
            withResponseMethodType = ClientMethodType.SimpleAsyncRestResponse;
        }
        final ReturnValue withResponseMethodReturnValue
            = methodsReturnDescription.getReturnValue(withResponseMethodType);
        final JavaVisibility withResponseMethodVisibility
            = methodVisibility(withResponseMethodType, defaultOverloadType, false, isProtocolMethod);
        final JavaVisibility withResponseMethodWithContextVisibility
            = methodVisibility(withResponseMethodType, defaultOverloadType, true, isProtocolMethod);
        final boolean hasContextOverload = withResponseMethodWithContextVisibility != NOT_GENERATE;

        final ClientMethod withResponseMethod = baseMethod.newBuilder()
            .returnValue(withResponseMethodReturnValue)
            .onlyRequiredParameters(false)
            .name(withResponseMethodName)
            .type(withResponseMethodType)
            .groupedParameterRequired(false)
            .hasWithContextOverload(hasContextOverload)
            .methodVisibility(withResponseMethodVisibility)
            .build();
        // Always generate an overload of WithResponse with non-required parameters without Context. It is only for sync
        // proxy method, and is usually filtered out in methodVisibility function.
        methods.add(withResponseMethod);
        addClientMethodWithContext(methods, withResponseMethod, withResponseMethodWithContextVisibility,
            isProtocolMethod);
    }

    private void createSimpleValueClientMethods(boolean isSync, List<ClientMethod> methods, ClientMethod baseMethod,
        CreateClientMethodArgs createMethodArgs) {

        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType defaultOverloadType = createMethodArgs.defaultOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final boolean generateRequiredOnlyParametersOverload = createMethodArgs.generateRequiredOnlyParametersOverload;
        final MethodNamer methodNamer = createMethodArgs.methodNamer;

        // Simple '[Operation]' sync or async methods.
        //
        final String simpleMethodName;
        final ClientMethodType simpleMethodType;
        if (isSync) {
            simpleMethodName = methodNamer.getMethodName();
            simpleMethodType = ClientMethodType.SimpleSync;
        } else {
            simpleMethodName = methodNamer.getSimpleAsyncMethodName();
            simpleMethodType = ClientMethodType.SimpleAsync;
        }
        final ReturnValue simpleMethodReturnValue = methodsReturnDescription.getReturnValue(simpleMethodType);
        final JavaVisibility simpleMethodVisibility
            = methodVisibility(simpleMethodType, defaultOverloadType, false, isProtocolMethod);
        final JavaVisibility simpleMethodWithRequiredParametersVisibility
            = methodVisibility(simpleMethodType, MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod);
        final JavaVisibility simpleMethodWithContextVisibility
            = methodVisibility(simpleMethodType, defaultOverloadType, true, isProtocolMethod);

        final ClientMethod simpleMethod = baseMethod.newBuilder()
            .returnValue(simpleMethodReturnValue)
            .name(simpleMethodName)
            .type(simpleMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(simpleMethodVisibility)
            .build();
        methods.add(simpleMethod);

        // overload for versioning
        createOverloadForVersioning(isProtocolMethod, methods, simpleMethod);

        if (generateRequiredOnlyParametersOverload) {
            final ClientMethod simpleMethodWithRequiredParameters = simpleMethod.newBuilder()
                .methodVisibility(simpleMethodWithRequiredParametersVisibility)
                .onlyRequiredParameters(true)
                .build();
            methods.add(simpleMethodWithRequiredParameters);
        }
        addClientMethodWithContext(methods, simpleMethod, simpleMethodWithContextVisibility, isProtocolMethod);
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

    /**
     * Gets the Context parameter.
     *
     * @param isProtocolMethod Whether the method is a protocol method.
     * @return The Context parameter.
     */
    protected ClientMethodParameter getContextParameter(boolean isProtocolMethod) {
        if (isProtocolMethod) {
            return ClientMethodParameter.REQUEST_OPTIONS_PARAMETER;
        } else {
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
    }

    /**
     * Adds a {@link ClientMethod} that has a Context parameter included.
     *
     * @param methods The list of {@link ClientMethod ClientMethods} already created.
     * @param baseMethod The method to use to obtain the builder for context enabled {@link ClientMethod}.
     * @param visibility The visibility for the context enabled client method.
     * @param isProtocolMethod Is protocol method.
     */
    protected void addClientMethodWithContext(List<ClientMethod> methods, ClientMethod baseMethod,
        JavaVisibility visibility, boolean isProtocolMethod) {
        final ClientMethodParameter contextParameter = getContextParameter(isProtocolMethod);
        final List<ClientMethodParameter> parameters = new ArrayList<>(baseMethod.getParameters());
        if (JavaSettings.getInstance().isBranded()
            || contextParameter.getClientType().equals(ClassType.REQUEST_OPTIONS)) {
            // update parameters to include Context.
            parameters.add(contextParameter);
        }
        final ClientMethod withContextMethod = baseMethod.newBuilder()
            .methodVisibility(visibility)
            .parameters(parameters)
            .onlyRequiredParameters(false)
            .hasWithContextOverload(false) // WithContext overload doesn't have a withContext overload
            .build();
        methods.add(withContextMethod);
    }

    private static boolean hasNonRequiredParameters(List<ClientMethodParameter> parameters) {
        return parameters.stream().anyMatch(p -> !p.isRequired() && !p.isConstant());
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

    /**
     * Type holding common arguments shared across all client method creator functions for a proxy method.
     */
    protected static class CreateClientMethodArgs {
        public final JavaSettings settings;
        public final boolean isProtocolMethod;
        public final ClientMethodsReturnDescription methodsReturnDescription;
        public final MethodOverloadType defaultOverloadType;
        public final MethodNamer methodNamer;
        public final boolean generateRequiredOnlyParametersOverload;

        CreateClientMethodArgs(JavaSettings settings, boolean isProtocolMethod,
            ClientMethodsReturnDescription methodsReturnDescription, MethodOverloadType defaultOverloadType,
            MethodNamer methodNamer) {
            this.settings = settings;
            this.isProtocolMethod = isProtocolMethod;
            this.methodsReturnDescription = methodsReturnDescription;
            this.defaultOverloadType = defaultOverloadType;
            this.methodNamer = methodNamer;
            this.generateRequiredOnlyParametersOverload = settings.isRequiredParameterClientMethods()
                && defaultOverloadType == MethodOverloadType.OVERLOAD_MAXIMUM;
        }
    }
}
