// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConvenienceApi;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings.SyncMethodsGeneration;
import com.microsoft.typespec.http.client.generator.core.implementation.OperationInstrumentationInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ExternalDocumentation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPollingDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.MethodNamer;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import io.clientcore.core.utils.CoreUtils;
import java.util.ArrayList;
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
     * <p>
     * data plane clients have two distinct ways of creating synchronous implementation client methods -
     * <li>
     * <ul>If "enable-sync-stack" option is configured then generator will create synchronous proxy methods that will
     * use a fully synchronous code path.</ul>
     * <ul>If "sync-methods" option is configured then generator will create synchronous implementation client methods
     * that will block on the asynchronous proxy method.</ul>
     * </li>
     * If both options are set then "enable-sync-stack" take precedent.
     * </p>
     *
     * @param operation the operation.
     * @param isProtocolMethod whether the client method to be simplified for resilience to API changes.
     * @return the client methods created.
     */
    private List<ClientMethod> createClientMethods(Operation operation, boolean isProtocolMethod) {
        final JavaSettings settings = JavaSettings.getInstance();

        // If this operation is part of a group it'll need to be referenced with a more specific target.
        final ClientMethod.Builder builder = new ClientMethod.Builder()
            .clientReference((operation.getOperationGroup() == null
                || operation.getOperationGroup().getLanguage().getJava().getName().isEmpty()) ? "this" : "this.client")
            .operationInstrumentationInfo(new OperationInstrumentationInfo(operation))
            .setCrossLanguageDefinitionId(SchemaUtil.getCrossLanguageDefinitionId(operation));

        setJavaDoc(builder, operation);

        final Map<Request, List<ProxyMethod>> proxyMethodsMap = Mappers.getProxyMethodMapper().map(operation);
        final List<Request> requests = getCodeModelRequests(operation, isProtocolMethod, proxyMethodsMap);
        final List<ClientMethod> methods = new ArrayList<>();

        for (Request request : requests) {
            final List<ProxyMethod> proxyMethods = proxyMethodsMap.get(request);
            for (ProxyMethod proxyMethod : proxyMethods) {
                if (proxyMethod.getImplementation() != null) {
                    continue;
                }
                final ClientMethodParametersDetails paramsDetails = ClientMethodParameterProcessor.process(request,
                    proxyMethod.hasParameterOfType(ClassType.BINARY_DATA), isProtocolMethod);

                final ClientMethod baseMethod = builder.proxyMethod(proxyMethod)
                    .parameters(paramsDetails.getClientMethodParameters())
                    .requiredNullableParameterExpressions(paramsDetails.requiredNullableParameterExpressions)
                    .validateExpressions(paramsDetails.validateParameterExpressions)
                    .parameterTransformations(paramsDetails.parameterTransformations)
                    .methodVisibilityInWrapperClient(methodVisibilityInWrapperClient(operation, isProtocolMethod))
                    .build();

                final MethodNamer methodNamer
                    = resolveMethodNamer(proxyMethod, operation.getConvenienceApi(), isProtocolMethod);
                final ClientMethodsReturnDescription methodsReturnDescription = ClientMethodsReturnDescription
                    .create(operation, isProtocolMethod, proxyMethod.isCustomHeaderIgnored());
                final CreateMethodArgs createMethodArgs = new CreateMethodArgs(settings, isProtocolMethod,
                    methodsReturnDescription, methodNamer, getMethodOverloadType(paramsDetails));

                if (operation.isPageable()) {
                    // Create Paging Client Methods.
                    //
                    final PagingMetadata pagingMetadata
                        = PagingMetadata.create(operation, proxyMethod, paramsDetails, settings);
                    if (pagingMetadata == null) {
                        continue;
                    }

                    final CreateMethodArgs createPagingMethodArgs
                        = createMethodArgs.forPaging(pagingMetadata, paramsDetails);

                    if (proxyMethod.isSync()) {
                        createPagingClientMethods(true, baseMethod, pagingMetadata, methods, createPagingMethodArgs);
                    } else {
                        createPagingClientMethods(false, baseMethod, pagingMetadata, methods, createPagingMethodArgs);
                        if (settings.isGenerateSyncMethods() && !settings.isSyncStackEnabled()) {
                            // If SyncMethodsGeneration is enabled and Sync Stack is not, perform synchronous pageable
                            // API generation.
                            createPagingClientMethods(true, baseMethod, pagingMetadata, methods,
                                createPagingMethodArgs);
                        }
                    }
                } else if (operation.isLro()
                    && (settings.isFluent() || settings.getPollingSettings("default") != null)) {
                    // Create LRO Client Methods.
                    //
                    if (proxyMethod.isSync()
                        || methodsReturnDescription.getSyncReturnType().equals(ClassType.INPUT_STREAM)) {
                        // Skip the following
                        // 1. Sync ProxyMethod for polling as sync polling isn't ready yet.
                        // 2. InputStream return type as it does not adhere to PollerFlux contract.
                        continue;
                    }

                    createLroWithResponseClientMethods(false, baseMethod, methods, createMethodArgs);
                    final boolean createWithResponseSync = settings.isSyncStackEnabled()
                        && !proxyMethod.hasParameterOfType(GenericType.FLUX_BYTE_BUFFER);
                    if (createWithResponseSync) {
                        if (settings.isFluent()) {
                            createFluentLroWithResponseSyncClientMethods(operation, baseMethod, methods,
                                createMethodArgs);
                        } else {
                            createLroWithResponseClientMethods(true, baseMethod, methods, createMethodArgs);
                        }
                    }

                    if (settings.isFluent()) {
                        createLroBeginClientMethods(baseMethod, methodNamer.getLroBeginAsyncMethodName(),
                            methodNamer.getLroBeginMethodName(), methods, createMethodArgs);
                        this.createAdditionalLroMethods(baseMethod, methods, createMethodArgs);
                    } else {
                        final PollingMetadata pollingMetadata = PollingMetadata.create(operation, proxyMethod,
                            methodsReturnDescription.getSyncReturnType());
                        if (pollingMetadata != null) {
                            if (isProtocolMethod) {
                                createProtocolLroBeginClientMethods(baseMethod, pollingMetadata, methods,
                                    createMethodArgs);
                            } else {
                                final ClientMethod lroBaseMethod = baseMethod.newBuilder()
                                    .methodPollingDetails(pollingMetadata.asMethodPollingDetails())
                                    .build();
                                createLroBeginClientMethods(lroBaseMethod, methodNamer.getLroBeginAsyncMethodName(),
                                    methodNamer.getLroBeginMethodName(), methods, createMethodArgs);
                            }
                        }
                    }
                } else {
                    // Create Simple Client Methods.
                    //
                    if (proxyMethod.isSync()) {
                        createSimpleClientMethods(true, baseMethod, methods, createMethodArgs);
                    } else {
                        if (settings.getSyncMethods() != SyncMethodsGeneration.SYNC_ONLY) {
                            // SyncMethodsGeneration.NONE would still generate these
                            createSimpleClientMethods(false, baseMethod, methods, createMethodArgs);
                        }
                        if (settings.isGenerateSyncMethods() && !settings.isSyncStackEnabled()) {
                            createSimpleClientMethods(true, baseMethod, methods, createMethodArgs);
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
        CreateMethodArgs createMethodArgs) {
    }

    private static void setJavaDoc(ClientMethod.Builder builder, Operation operation) {
        final String summary;
        if (operation.getSummary() != null) {
            summary = operation.getSummary();
        } else {
            summary = operation.getLanguage().getDefault() == null
                ? null
                : operation.getLanguage().getDefault().getSummary(); // summary from m4 is under language
        }
        final String description
            = operation.getLanguage().getJava() == null ? null : operation.getLanguage().getJava().getDescription();
        if (CoreUtils.isNullOrEmpty(summary) && CoreUtils.isNullOrEmpty(description)) {
            builder.description(String.format("The %s operation.", operation.getLanguage().getJava().getName()));
        } else {
            builder.description(SchemaUtil.mergeSummaryWithDescription(summary, description));
        }

        if (operation.getLanguage().getJava() != null
            && !CoreUtils.isNullOrEmpty(operation.getLanguage().getJava().getComment())) {
            // API comment.
            builder.implementationDetails(
                new ImplementationDetails.Builder().comment(operation.getLanguage().getJava().getComment()).build());
        }

        if (operation.getExternalDocs() != null) {
            final ExternalDocumentation externalDocumentation
                = new ExternalDocumentation.Builder().description(operation.getExternalDocs().getDescription())
                    .url(operation.getExternalDocs().getUrl())
                    .build();
            builder.methodDocumentation(externalDocumentation);
        }
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

    /**
     * Gets the visibility for the client methods when generator configured to generate the wrapper clients.
     * <p>
     * The generation of the wrapper clients means separate clients are generated for async and sync APIs, such as
     * FooAsyncClient and FooClient. These public clients are a thin layer over a shared service client implementation
     * class (FooClientImpl), which is scoped to the implementation namespace and hidden from the user.
     * </p>
     * <p>This method returns the visibility of the client methods in the service client implementation class.</p>
     * <p>
     * In Data Place Generator (DPG) mode, wrapper clients are generated by default, DPG mode is enabled by --data-plane
     * flag.
     * Refer <a href="https://github.com/Azure/autorest.java?tab=readme-ov-file#minimal-data-plane-clients">Minimal
     * Data-Plane Clients</a>.
     * </p>
     * <p>
     * In vanilla mode, the wrapper clients are not generated by default, this mode is typically used when public-facing
     * clients
     * involve complex logic and therefore need to be handwritten. However, it is possible to configure wrapper client
     * generation using the --generate-sync-async-clients and --generate-client-as-impl flags. For more details on these
     * flags, refer to the
     * <a href="https://github.com/Azure/autorest.java?tab=readme-ov-file#settings">Code generator settings</a> section.
     * </p>
     * <p>
     * In management (ARM) modes - Lite and Premium, wrapper clients are not generated. The Lite mode only has Sync
     * APIs,
     * where it exposes service implementation client as public client. The Premium mode has both async and sync in
     * one client (to ease the migration from Track-1 libraries with async and sync mixed in one client).
     * </p>
     *
     * @param operation the operation.
     * @param isProtocolMethod true if the DPG mode is enabled.
     * @return the visibility of the client methods in the service client implementation class.
     */
    private static JavaVisibility methodVisibilityInWrapperClient(Operation operation, boolean isProtocolMethod) {
        if (operation.getInternalApi() == Boolean.TRUE
            || (isProtocolMethod && operation.getGenerateProtocolApi() == Boolean.FALSE)) {
            // Client method is package private in wrapper client, so that the client or developer can still
            // invoke it.
            return JavaVisibility.PackagePrivate;
        } else {
            return JavaVisibility.Public;
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

    static List<List<ClientMethodParameter>> findOverloadedSignatures(List<ClientMethodParameter> allParameters) {
        List<List<ClientMethodParameter>> signatures = new ArrayList<>();

        List<ClientMethodParameter> requiredParameters
            = allParameters.stream().filter(MethodParameter::isRequired).collect(Collectors.toList());

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

    private void createPagingClientMethods(boolean isSync, ClientMethod baseMethod, PagingMetadata pagingMetadata,
        List<ClientMethod> methods, CreateMethodArgs createMethodArgs) {

        createSinglePageClientMethods(isSync, baseMethod, pagingMetadata, methods, createMethodArgs);
        if (pagingMetadata.isMethodForNextPage()) {
            // If this was the next method there is no streaming methods to be generated.
            return;
        }
        createPageStreamingClientMethods(isSync, baseMethod, pagingMetadata, methods, createMethodArgs);
    }

    private void createSinglePageClientMethods(boolean isSync, ClientMethod baseMethod, PagingMetadata pagingMetadata,
        List<ClientMethod> methods, CreateMethodArgs createMethodArgs) {

        final JavaSettings settings = createMethodArgs.settings;
        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType methodOverloadType = createMethodArgs.methodOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final MethodNamer methodNamer = createMethodArgs.methodNamer;

        final String methodName;
        final ClientMethodType clientMethodType;
        final MethodPageDetails methodPageDetails;
        if (isSync) {
            methodName = methodNamer.getPagingSinglePageMethodName();
            clientMethodType = ClientMethodType.PagingSyncSinglePage;
            methodPageDetails = pagingMetadata.asMethodPageDetails(true);
        } else {
            methodName = methodNamer.getPagingAsyncSinglePageMethodName();
            clientMethodType = ClientMethodType.PagingAsyncSinglePage;
            methodPageDetails = pagingMetadata.asMethodPageDetails(false);
        }
        final JavaVisibility methodVisibility
            = methodVisibility(clientMethodType, methodOverloadType, false, isProtocolMethod);
        final JavaVisibility methodWithContextVisibility
            = methodVisibility(clientMethodType, methodOverloadType, true, isProtocolMethod);

        // Generate only maximum overload of '[Operation]SinglePage', and it should not be exposed to user.
        final ClientMethod singlePageMethod = baseMethod.newBuilder()
            .methodPageDetails(methodPageDetails)
            .returnValue(methodsReturnDescription.getReturnValue(clientMethodType))
            .onlyRequiredParameters(false)
            .name(methodName)
            .type(clientMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(methodVisibility)
            .build();

        if (settings.getSyncMethods() != SyncMethodsGeneration.NONE) {
            methods.add(singlePageMethod);
        }

        // Generate '[Operation]SinglePage' overload with all parameters and Context.
        addClientMethodWithContext(methods, singlePageMethod, methodWithContextVisibility, isProtocolMethod);
    }

    private void createPageStreamingClientMethods(boolean isSync, ClientMethod baseMethod,
        PagingMetadata pagingMetadata, List<ClientMethod> methods, CreateMethodArgs createMethodArgs) {

        final JavaSettings settings = createMethodArgs.settings;
        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType methodOverloadType = createMethodArgs.methodOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final boolean generateRequiredOnlyParametersOverload
            = createMethodArgs.generateRequiredOnlyParamsMethodOverload;
        final MethodNamer methodNamer = createMethodArgs.methodNamer;

        final String methodName;
        final ClientMethodType clientMethodType;
        final MethodPageDetails methodPageDetails;
        final MethodPageDetails methodPageDetailsWithContext;
        if (isSync) {
            methodName = methodNamer.getMethodName();
            clientMethodType = ClientMethodType.PagingSync;
            methodPageDetails = pagingMetadata.asMethodPageDetails(true);
            methodPageDetailsWithContext
                = pagingMetadata.asMethodPageDetailsForContext(true, getContextParameter(isProtocolMethod));
        } else {
            methodName = methodNamer.getSimpleAsyncMethodName();
            clientMethodType = ClientMethodType.PagingAsync;
            methodPageDetails = pagingMetadata.asMethodPageDetails(false);
            methodPageDetailsWithContext
                = pagingMetadata.asMethodPageDetailsForContext(false, getContextParameter(isProtocolMethod));
        }
        final JavaVisibility methodVisibility
            = methodVisibility(clientMethodType, methodOverloadType, false, isProtocolMethod);
        final JavaVisibility methodWithOnlyRequiredParametersVisibility
            = methodVisibility(clientMethodType, MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod);
        final JavaVisibility methodWithContextVisibility
            = methodVisibility(clientMethodType, methodOverloadType, true, isProtocolMethod);

        final ClientMethod pagingMethod = baseMethod.newBuilder()
            .methodPageDetails(methodPageDetails)
            .returnValue(methodsReturnDescription.getReturnValue(clientMethodType))
            .onlyRequiredParameters(false)
            .name(methodName)
            .type(clientMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(methodVisibility)
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
                .methodVisibility(methodWithOnlyRequiredParametersVisibility)
                .build();
            methods.add(pagingMethodWithOnlyRequiredParameters);
        }

        final ClientMethod pagingMethodWithContext;
        if (methodPageDetailsWithContext != null) {
            pagingMethodWithContext = pagingMethod.newBuilder().methodPageDetails(methodPageDetailsWithContext).build();
        } else {
            pagingMethodWithContext = pagingMethod;
        }
        addClientMethodWithContext(methods, pagingMethodWithContext, methodWithContextVisibility, isProtocolMethod);
    }

    private void createLroWithResponseClientMethods(boolean isSync, ClientMethod baseMethod, List<ClientMethod> methods,
        CreateMethodArgs createMethodArgs) {

        final JavaSettings settings = createMethodArgs.settings;
        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType methodOverloadType = createMethodArgs.methodOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final ProxyMethod proxyMethod = baseMethod.getProxyMethod();

        final String methodName;
        final ProxyMethod proxyMethodToUse;
        final ClientMethodType clientMethodType;
        if (isSync) {
            methodName = proxyMethod.getSimpleRestResponseMethodName();
            proxyMethodToUse = proxyMethod.toSync();
            clientMethodType = ClientMethodType.SimpleSyncRestResponse;
        } else {
            methodName = proxyMethod.getSimpleAsyncRestResponseMethodName();
            proxyMethodToUse = proxyMethod;
            clientMethodType = ClientMethodType.SimpleAsyncRestResponse;
        }
        final JavaVisibility methodVisibility;
        final JavaVisibility methodWithContextVisibility;
        if (settings.isDataPlaneClient()) {
            // there is ambiguity of RestResponse from simple API and from LRO API e.g. SimpleAsyncRestResponse without
            // Context in simple API should be VISIBLE hence override here for DPG.
            methodVisibility = NOT_GENERATE;
            methodWithContextVisibility = NOT_VISIBLE;
        } else {
            methodVisibility = methodVisibility(clientMethodType, methodOverloadType, false, isProtocolMethod);
            methodWithContextVisibility
                = methodVisibility(clientMethodType, methodOverloadType, true, isProtocolMethod);
        }

        // '[Operation]WithResponse' LRO sync or async method with required and optional parameters.
        final ClientMethod withResponseMethod = baseMethod.newBuilder()
            .proxyMethod(proxyMethodToUse)
            .returnValue(methodsReturnDescription.getReturnValue(clientMethodType))
            .name(methodName)
            .onlyRequiredParameters(false)
            .type(clientMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(methodVisibility)
            .hasWithContextOverload(methodWithContextVisibility != NOT_GENERATE)
            .build();
        methods.add(withResponseMethod);
        addClientMethodWithContext(methods, withResponseMethod, methodWithContextVisibility, isProtocolMethod);
    }

    private void createFluentLroWithResponseSyncClientMethods(Operation operation, ClientMethod baseMethod,
        List<ClientMethod> methods, CreateMethodArgs createMethodArgs) {

        final JavaSettings settings = createMethodArgs.settings;
        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final ProxyMethod proxyMethod = baseMethod.getProxyMethod();

        final IType baseType = ClassType.BINARY_DATA;
        final IType returnType = ResponseTypeFactory.createSyncResponse(operation, baseType, isProtocolMethod, settings,
            proxyMethod.isCustomHeaderIgnored());
        final ReturnValue binaryDataResponse = methodsReturnDescription.createReturnValue(returnType, baseType);

        // Fluent + Sync-Stack needs LRO '[Operation]WithResponse' in implementation scope to enable LRO
        // 'begin[Operation]'.
        // Design discussion: https://github.com/Azure/autorest.java/issues/2284
        //
        // The sync api corresponding to the below 'withResponseSyncMethod' ClientMethod would look like,
        //
        // - private Response<BinaryData> createOrUpdateWithResponse(..)
        //
        // such a private api will be used to implement the public LRO 'begin[Operation]' sync method:
        //
        // - public SyncPoller<PollResult<Foo>, Foo> beginCreateOrUpdate(..)
        //
        final ClientMethod withResponseSyncMethod = baseMethod.newBuilder()
            .returnValue(binaryDataResponse)
            .name(proxyMethod.getSimpleRestResponseMethodName())
            .onlyRequiredParameters(false)
            .type(ClientMethodType.SimpleSyncRestResponse)
            .groupedParameterRequired(false)
            .hasWithContextOverload(true)
            .proxyMethod(proxyMethod.toSync())
            .methodVisibility(NOT_VISIBLE)
            .build();
        methods.add(withResponseSyncMethod);
        addClientMethodWithContext(methods, withResponseSyncMethod, NOT_VISIBLE, isProtocolMethod);
    }

    private void createProtocolLroBeginClientMethods(ClientMethod baseMethod, PollingMetadata pollingMetadata,
        List<ClientMethod> methods, CreateMethodArgs createMethodArgs) {

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

            createLroBeginClientMethods(lroBaseMethod, methodNamer.getLroModelBeginAsyncMethodName(),
                methodNamer.getLroModelBeginMethodName(), methods, createMethodArgs);
        }

        // In Protocol mode (i.e., Data Place Generator (DPG)), the LRO begin method returns BinaryData -
        // 1. PollerFlux<BinaryData, BinaryData> begin[operation]Async(..)
        // 2. PollerFlux<BinaryData, Void> begin[operation]Async(..)
        // Void for final result if the LRO is a resource delete operation.
        final ClientMethod lroBaseMethod = baseMethod.newBuilder()
            .methodPollingDetails(pollingMetadata.asMethodPollingDetailsForBinaryDataResult())
            .build();
        createLroBeginClientMethods(lroBaseMethod, methodNamer.getLroBeginAsyncMethodName(),
            methodNamer.getLroBeginMethodName(), methods, createMethodArgs);
    }

    private void createLroBeginClientMethods(ClientMethod lroBaseMethod, String asyncMethodName, String syncMethodName,
        List<ClientMethod> methods, CreateMethodArgs createMethodArgs) {

        final JavaSettings settings = createMethodArgs.settings;

        final boolean createAsync = settings.isGenerateAsyncMethods();
        if (createAsync) {
            createLroBeginClientMethods(false, lroBaseMethod, asyncMethodName, methods, createMethodArgs);
        }

        if (lroBaseMethod.getProxyMethod().hasParameterOfType(GenericType.FLUX_BYTE_BUFFER)) {
            return;
        }
        final boolean createSync = (settings.isGenerateSyncMethods() || settings.isSyncStackEnabled());
        if (createSync) {
            createLroBeginClientMethods(true, lroBaseMethod, syncMethodName, methods, createMethodArgs);
        }
    }

    private void createLroBeginClientMethods(boolean isSync, ClientMethod lroBaseMethod, String methodName,
        List<ClientMethod> methods, CreateMethodArgs createMethodArgs) {

        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType methodOverloadType = createMethodArgs.methodOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final boolean generateRequiredOnlyParametersOverload
            = createMethodArgs.generateRequiredOnlyParamsMethodOverload;

        final ClientMethodType clientMethodType;
        if (isSync) {
            clientMethodType = ClientMethodType.LongRunningBeginSync;
        } else {
            clientMethodType = ClientMethodType.LongRunningBeginAsync;
        }
        final JavaVisibility methodVisibility
            = methodVisibility(clientMethodType, methodOverloadType, false, isProtocolMethod);
        final JavaVisibility methodWithRequiredParametersVisibility
            = methodVisibility(clientMethodType, MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod);
        final JavaVisibility methodWithContextVisibility
            = methodVisibility(clientMethodType, methodOverloadType, true, isProtocolMethod);
        final MethodPollingDetails methodPollingDetails = lroBaseMethod.getMethodPollingDetails();

        // LRO 'begin[Operation]' sync or async method.
        final ClientMethod beginLroMethod = lroBaseMethod.newBuilder()
            .returnValue(methodsReturnDescription.getReturnValue(clientMethodType, methodPollingDetails))
            .name(methodName)
            .onlyRequiredParameters(false)
            .type(clientMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(methodVisibility)
            .build();
        methods.add(beginLroMethod);

        // LRO 'begin[Operation]' sync or async method overloads with versioning.
        createOverloadForVersioning(isProtocolMethod, methods, beginLroMethod);

        if (generateRequiredOnlyParametersOverload) {
            // LRO 'begin[Operation]' sync or async method overload with only required parameters.
            final ClientMethod beginLroMethodWithRequiredParameters = beginLroMethod.newBuilder()
                .onlyRequiredParameters(true)
                .methodVisibility(methodWithRequiredParametersVisibility)
                .build();
            methods.add(beginLroMethodWithRequiredParameters);
        }

        // LRO 'begin[Operation]' sync or async method overload with only required with context parameters.
        addClientMethodWithContext(methods, beginLroMethod, methodWithContextVisibility, isProtocolMethod);
    }

    private void createSimpleClientMethods(boolean isSync, ClientMethod baseMethod, List<ClientMethod> methods,
        CreateMethodArgs createMethodArgs) {

        createSimpleWithResponseClientMethods(isSync, baseMethod, methods, createMethodArgs);
        if (baseMethod.getProxyMethod().isCustomHeaderIgnored()) {
            return;
        }
        createSimpleValueClientMethods(isSync, baseMethod, methods, createMethodArgs);
    }

    private void createSimpleWithResponseClientMethods(boolean isSync, ClientMethod baseMethod,
        List<ClientMethod> methods, CreateMethodArgs createMethodArgs) {

        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType methodOverloadType = createMethodArgs.methodOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final MethodNamer methodNamer = createMethodArgs.methodNamer;

        // '[Operation]WithResponse' sync or async methods.
        //
        final String methodName;
        final ClientMethodType clientMethodType;
        if (isSync) {
            methodName = methodNamer.getSimpleRestResponseMethodName();
            clientMethodType = ClientMethodType.SimpleSyncRestResponse;
        } else {
            methodName = methodNamer.getSimpleAsyncRestResponseMethodName();
            clientMethodType = ClientMethodType.SimpleAsyncRestResponse;
        }
        final JavaVisibility methodVisibility
            = methodVisibility(clientMethodType, methodOverloadType, false, isProtocolMethod);
        final JavaVisibility methodWithContextVisibility
            = methodVisibility(clientMethodType, methodOverloadType, true, isProtocolMethod);
        final boolean hasContextOverload = methodWithContextVisibility != NOT_GENERATE;

        final ClientMethod withResponseMethod = baseMethod.newBuilder()
            .returnValue(methodsReturnDescription.getReturnValue(clientMethodType))
            .onlyRequiredParameters(false)
            .name(methodName)
            .type(clientMethodType)
            .groupedParameterRequired(false)
            .hasWithContextOverload(hasContextOverload)
            .methodVisibility(methodVisibility)
            .build();
        // Always generate an overload of WithResponse with non-required parameters without Context. It is only for sync
        // proxy method, and is usually filtered out in methodVisibility function.
        methods.add(withResponseMethod);
        addClientMethodWithContext(methods, withResponseMethod, methodWithContextVisibility, isProtocolMethod);
    }

    private void createSimpleValueClientMethods(boolean isSync, ClientMethod baseMethod, List<ClientMethod> methods,
        CreateMethodArgs createMethodArgs) {

        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType methodOverloadType = createMethodArgs.methodOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final boolean generateRequiredOnlyParametersOverload
            = createMethodArgs.generateRequiredOnlyParamsMethodOverload;
        final MethodNamer methodNamer = createMethodArgs.methodNamer;

        // Simple '[Operation]' sync or async methods.
        //
        final String methodName;
        final ClientMethodType clientMethodType;
        if (isSync) {
            methodName = methodNamer.getMethodName();
            clientMethodType = ClientMethodType.SimpleSync;
        } else {
            methodName = methodNamer.getSimpleAsyncMethodName();
            clientMethodType = ClientMethodType.SimpleAsync;
        }
        final JavaVisibility methodVisibility
            = methodVisibility(clientMethodType, methodOverloadType, false, isProtocolMethod);
        final JavaVisibility methodWithRequiredParametersVisibility
            = methodVisibility(clientMethodType, MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod);
        final JavaVisibility methodWithContextVisibility
            = methodVisibility(clientMethodType, methodOverloadType, true, isProtocolMethod);

        final ClientMethod simpleMethod = baseMethod.newBuilder()
            .returnValue(methodsReturnDescription.getReturnValue(clientMethodType))
            .name(methodName)
            .type(clientMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(methodVisibility)
            .build();
        methods.add(simpleMethod);

        // overload for versioning
        createOverloadForVersioning(isProtocolMethod, methods, simpleMethod);

        if (generateRequiredOnlyParametersOverload) {
            final ClientMethod simpleMethodWithRequiredParameters = simpleMethod.newBuilder()
                .methodVisibility(methodWithRequiredParametersVisibility)
                .onlyRequiredParameters(true)
                .build();
            methods.add(simpleMethodWithRequiredParameters);
        }
        addClientMethodWithContext(methods, simpleMethod, methodWithContextVisibility, isProtocolMethod);
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
     * @param isProtocolMethod Whether the client method using the Context is a protocol method.
     * @return The Context parameter.
     */
    protected ClientMethodParameter getContextParameter(boolean isProtocolMethod) {
        if (isProtocolMethod) {
            return ClientMethodParameter.REQUEST_OPTIONS_PARAMETER;
        } else {
            return ClientMethodParameter.CONTEXT_PARAMETER;
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
        if (JavaSettings.getInstance().isAzureV1()
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
     * Type holding immutable common arguments shared across all client method creator functions.
     */
    protected static class CreateMethodArgs {
        public final JavaSettings settings;
        public final boolean isProtocolMethod;
        public final ClientMethodsReturnDescription methodsReturnDescription;
        public final MethodOverloadType methodOverloadType;
        public final MethodNamer methodNamer;
        public final boolean generateRequiredOnlyParamsMethodOverload;

        CreateMethodArgs(JavaSettings settings, boolean isProtocolMethod,
            ClientMethodsReturnDescription methodsReturnDescription, MethodNamer methodNamer,
            MethodOverloadType methodOverloadType) {
            this.settings = settings;
            this.isProtocolMethod = isProtocolMethod;
            this.methodsReturnDescription = methodsReturnDescription;
            this.methodOverloadType = methodOverloadType;
            this.methodNamer = methodNamer;
            this.generateRequiredOnlyParamsMethodOverload = settings.isRequiredParameterClientMethods()
                && methodOverloadType == MethodOverloadType.OVERLOAD_MAXIMUM;
        }

        CreateMethodArgs forPaging(PagingMetadata pagingMetadata, ClientMethodParametersDetails paramsDetails) {
            return new CreateMethodArgs(this.settings, this.isProtocolMethod, this.methodsReturnDescription,
                this.methodNamer, getPageMethodOverloadType(pagingMetadata, paramsDetails));
        }
    }

    private static MethodOverloadType getMethodOverloadType(ClientMethodParametersDetails paramsDetails) {
        if (paramsDetails.hasNonRequiredParameters()) {
            return MethodOverloadType.OVERLOAD_MAXIMUM;
        } else {
            return MethodOverloadType.OVERLOAD_MINIMUM_MAXIMUM;
        }
    }

    private static MethodOverloadType getPageMethodOverloadType(PagingMetadata pagingMetadata,
        ClientMethodParametersDetails paramsDetails) {
        if (paramsDetails.hasNonRequiredParameters(pagingMetadata.asMethodPageDetails(false))) {
            return MethodOverloadType.OVERLOAD_MAXIMUM;
        } else {
            return MethodOverloadType.OVERLOAD_MINIMUM_MAXIMUM;
        }
    }
}
