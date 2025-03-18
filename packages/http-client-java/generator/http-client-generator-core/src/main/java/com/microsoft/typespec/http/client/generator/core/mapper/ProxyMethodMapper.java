// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.core.http.HttpMethod;
import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import com.microsoft.typespec.http.client.generator.core.util.XmsExampleWrapper;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import org.slf4j.Logger;

/**
 * Maps Swagger definition into the interface methods that RestProxy consumes.
 */
public class ProxyMethodMapper implements IMapper<Operation, Map<Request, List<ProxyMethod>>> {
    private static final String APPLICATION_JSON = "application/json";
    private static final List<IType> RETURN_VALUE_WIRE_TYPE_OPTIONS
        = Arrays.asList(ClassType.BASE_64_URL, ClassType.DATE_TIME_RFC_1123, PrimitiveType.DURATION_LONG,
            PrimitiveType.DURATION_DOUBLE, ClassType.DURATION_LONG, ClassType.DURATION_DOUBLE,
            PrimitiveType.UNIX_TIME_LONG, ClassType.UNIX_TIME_LONG, ClassType.UNIX_TIME_DATE_TIME);
    private static final ProxyMethodMapper INSTANCE = new ProxyMethodMapper();

    private final Logger logger = new PluginLogger(Javagen.getPluginInstance(), ProxyMethodMapper.class);
    private final Map<Request, List<ProxyMethod>> parsed = new ConcurrentHashMap<>();

    protected ProxyMethodMapper() {
    }

    public static ProxyMethodMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public Map<Request, List<ProxyMethod>> map(Operation operation) {
        final JavaSettings settings = JavaSettings.getInstance();
        final Map<Request, List<ProxyMethod>> result = new LinkedHashMap<>();

        final String operationName = operation.getLanguage().getJava().getName();
        final ProxyMethod.Builder baseBuilder
            = new ProxyMethod.Builder().description(operation.getDescription()).name(operationName).isResumable(false);
        baseBuilder.operationId(getOperationId(operation, settings));

        final List<Integer> expectedStatusCodes = getExpectedResponseStatusCodes(operation);
        baseBuilder.responseExpectedStatusCodes(expectedStatusCodes);
        buildExpectedResponseFields(operation, settings, baseBuilder);
        buildUnexpectedResponseExceptionFields(baseBuilder, operation, expectedStatusCodes, settings);
        baseBuilder.responseContentTypes(getResponseContentTypes(operation));

        final ProxyMethod baseMethod = baseBuilder.build();
        final ProxyMethodParameterProcessor parameterProcessor = new ProxyMethodParameterProcessor(operation, settings);
        final UniqueProxyMethodNameGenerator methodNameGenerator
            = new UniqueProxyMethodNameGenerator(operationName, logger);
        for (Request request : operation.getRequests()) {
            if (parsed.containsKey(request)) {
                result.put(request, parsed.get(request));
                continue;
            }

            final ProxyMethod.Builder builder = baseMethod.newBuilder();
            builder.baseURL(request.getProtocol().getHttp().getUri());
            builder.urlPath(request.getProtocol().getHttp().getPath());
            builder.httpMethod(HttpMethod.valueOf(request.getProtocol().getHttp().getMethod().toUpperCase()));
            final String contentType = getRequestContentType(request);
            builder.requestContentType(contentType);

            final ProxyMethodParameterProcessor.Result r = parameterProcessor.process(request, contentType);
            builder.parameters(r.parameters);
            builder.allParameters(r.allParameters);
            builder.specialHeaders(r.specialHeaderParameterNames);
            builder.name(methodNameGenerator.getUniqueName(r.parameters.stream(), contentType));
            builder.examples(getExamples(operation, baseMethod.getOperationId()));

            final List<ProxyMethod> proxyMethods = createProxyMethods(builder, operation, operationName, settings);
            result.put(request, proxyMethods);
            parsed.put(request, proxyMethods);
        }
        return result;
    }

    /**
     * Gets the operation id defined for the operation.
     * <p>
     * operationId or language.default could be null for generated method like "listNext"
     * </p>
     * 
     * @param operation the operation.
     * @param settings the settings that may use to resolve the operation id.
     * @return the operation id.
     */
    private String getOperationId(Operation operation, JavaSettings settings) {
        if (!CoreUtils.isNullOrEmpty(operation.getOperationId())) {
            return operation.getOperationId();
        }
        if (operation.getLanguage() == null || operation.getLanguage().getDefault() == null) {
            return null;
        }
        final String operationId = operation.getLanguage().getDefault().getName();
        if (belongsToOperationGroup(operation, settings)) {
            return operation.getOperationGroup().getLanguage().getDefault().getName() + "_" + operationId;
        } else {
            return operationId;
        }
    }

    /**
     * Gets http status codes for all expected (successful) responses from this operation.
     *
     * @param operation the operation
     * @return a sorted list of http status codes.
     */
    private static List<Integer> getExpectedResponseStatusCodes(Operation operation) {
        return operation.getResponses()
            .stream()
            .flatMap(r -> r.getProtocol().getHttp().getStatusCodes().stream())
            .map(s -> s.replace("'", ""))
            .map(Integer::parseInt)
            .sorted()
            .collect(Collectors.toList());
    }

    /**
     * Resolve and update the builder with the expected response (successful response) body type, wire type and the
     * return
     * type for the proxy method.
     *
     * @param operation the operation to resolve the expected response for.
     * @param settings the settings that may use to resolve the expected response.
     * @param builder the builder to update with the expected response fields.
     */
    private void buildExpectedResponseFields(Operation operation, JavaSettings settings, ProxyMethod.Builder builder) {
        final boolean isDataPlaneClient = settings.isDataPlaneClient();
        final IType bodyType = MapperUtils.getExpectedResponseBodyType(operation, settings);
        final IType bodyTypeMapped;
        if (isDataPlaneClient && settings.isBranded()) {
            builder.rawResponseBodyType(bodyType);
            // branded (azure flavor) uses BinaryData as return type not the model.
            bodyTypeMapped = SchemaUtil.tryMapToBinaryData(bodyType, operation);
        } else {
            // unbranded uses the actual model as return type.
            bodyTypeMapped = bodyType;
        }
        builder.responseBodyType(bodyTypeMapped);

        final IType wireValueType
            = RETURN_VALUE_WIRE_TYPE_OPTIONS.stream().filter(bodyTypeMapped::contains).findFirst().orElse(null);
        builder.returnValueWireType(wireValueType);

        final IType methodReturnType
            = AsyncResponseTypeFactory.create(operation, bodyTypeMapped, isDataPlaneClient, settings, false);
        builder.returnType(methodReturnType);
    }

    /**
     * Check if the operation belongs to an operation group.
     *
     * @param operation the operation.
     * @param settings the settings may use to determine if the operation belongs to an operation group.
     * @return true if the operation belongs to an operation group, false otherwise.
     */
    protected boolean belongsToOperationGroup(Operation operation, JavaSettings settings) {
        return operation.getOperationGroup() != null
            && operation.getOperationGroup().getLanguage() != null
            && operation.getOperationGroup().getLanguage().getDefault() != null
            && !CoreUtils.isNullOrEmpty(operation.getOperationGroup().getLanguage().getDefault().getName());
    }

    /**
     * Extension for configure on unexpected response exception types to builder.
     *
     * @param builder the ProxyMethod builder
     * @param operation the operation
     * @param expectedStatusCodes the expected status codes
     * @param settings the settings
     */
    protected void buildUnexpectedResponseExceptionFields(ProxyMethod.Builder builder, Operation operation,
        List<Integer> expectedStatusCodes, JavaSettings settings) {
        final SwaggerExceptionDefinitions exceptionDefinitions
            = SwaggerExceptionDefinitions.create(this, operation, settings);
        final ClassType settingsDefaultExceptionType = ExceptionSettings.getDefaultHttpExceptionType(settings);

        // Use the settings defined default exception type over the Swagger defined default exception type.
        final ClassType defaultErrorType = (settingsDefaultExceptionType == null)
            ? exceptionDefinitions.getDefaultExceptionType()
            : settingsDefaultExceptionType;

        if (defaultErrorType != null) {
            builder.unexpectedResponseExceptionType(defaultErrorType);
        } else {
            builder.unexpectedResponseExceptionType(getHttpResponseExceptionType());
        }

        // Initialize the merged map with the Swagger defined configurations so that the settings configurations
        // overrides it.
        final Map<Integer, ClassType> mergedExceptionTypeMapping
            = new TreeMap<>(exceptionDefinitions.getExceptionTypeMapping());
        mergedExceptionTypeMapping.putAll(ExceptionSettings.getHttpStatusToExceptionTypeMapping(settings));

        // remove expected status codes
        expectedStatusCodes.forEach(mergedExceptionTypeMapping::remove);

        // Convert the exception type mapping into what code generation uses elsewhere.
        final Map<ClassType, List<Integer>> processedMapping = new HashMap<>();
        for (Map.Entry<Integer, ClassType> kvp : mergedExceptionTypeMapping.entrySet()) {
            processedMapping.compute(kvp.getValue(), (errorType, statuses) -> {
                if (statuses == null) {
                    List<Integer> statusList = new ArrayList<>();
                    statusList.add(kvp.getKey());
                    return statusList;
                }
                statuses.add(kvp.getKey());
                return statuses;
            });
        }

        if (!processedMapping.isEmpty()) {
            builder.unexpectedResponseExceptionTypes(processedMapping);
        }
    }

    /**
     * Gets the response content types defined for the operation.
     *
     * @param operation the operation.
     * @return the set of response content types defined for the operation.
     */
    private static Set<String> getResponseContentTypes(Operation operation) {
        final Predicate<Response> hasMediaTypes = response -> response.getProtocol() != null
            && response.getProtocol().getHttp() != null
            && response.getProtocol().getHttp().getMediaTypes() != null
            && !response.getProtocol().getHttp().getMediaTypes().isEmpty();

        final Set<String> contentTypes = operation.getResponses()
            .stream()
            .filter(hasMediaTypes)
            .flatMap(r -> r.getProtocol().getHttp().getMediaTypes().stream())
            .collect(Collectors.toSet());
        if (!contentTypes.contains(APPLICATION_JSON)) {
            contentTypes.add(MethodUtil.CONTENT_TYPE_APPLICATION_JSON_ERROR_WEIGHT);
        }
        return contentTypes;
    }

    /**
     * Gets the content type defined for the request.'
     * <p>
     * the method check for mediaTypes first as that is more specific than the knownMediaType
     * if there are multiple, we'll use the generic type
     * </p>
     * 
     * @param request the request.
     * @return the content type defined for the request.
     */
    private static String getRequestContentType(Request request) {
        if (request.getProtocol().getHttp().getMediaTypes() != null
            && request.getProtocol().getHttp().getMediaTypes().size() == 1) {
            return request.getProtocol().getHttp().getMediaTypes().get(0);
        } else if (request.getProtocol().getHttp().getKnownMediaType() != null) {
            return request.getProtocol().getHttp().getKnownMediaType().getContentType();
        }
        return APPLICATION_JSON;
    }

    /**
     * Create proxy methods for a request in an operation.
     *
     * @param builder the builder to build the base proxy method (the base proxy method will be used to build other
     * proxy method variants).
     * @param operation the parent operation of the request.
     * @param operationName the operation name.
     * @param settings the settings.
     * @return the list of all proxy methods.
     */
    private static List<ProxyMethod> createProxyMethods(ProxyMethod.Builder builder, Operation operation,
        String operationName, JavaSettings settings) {
        final List<ProxyMethod> methods = new ArrayList<>();

        // The base async proxy method.
        //
        final ProxyMethod proxyMethod = builder.build();
        methods.add(proxyMethod);

        // The async proxy method variant with custom headers.
        //
        final ProxyMethod customHeaderProxyMethod
            = createCustomHeaderMethod(operation, settings, operationName, proxyMethod);
        if (customHeaderProxyMethod != null) {
            methods.add(customHeaderProxyMethod);
        }

        // The BinaryData overloaded async proxy method variant, and
        // the async proxy method with BinaryData and custom headers.
        //
        final ProxyMethod binaryDataProxyMethod
            = createMethodOverloadForBinaryData(proxyMethod, proxyMethod.getParameters());
        if (binaryDataProxyMethod != null) {
            methods.add(binaryDataProxyMethod);
            final ProxyMethod customHeaderBinaryDataProxyMethod
                = createCustomHeaderMethod(operation, settings, operationName, binaryDataProxyMethod);
            if (customHeaderBinaryDataProxyMethod != null) {
                methods.add(customHeaderBinaryDataProxyMethod);
            }
        }

        // The sync proxy method variants.
        //
        final List<ProxyMethod> asyncProxyMethods = new ArrayList<>(methods);
        if (settings.isSyncStackEnabled()) {
            final List<ProxyMethod> syncMethods = createSyncProxyMethods(methods);
            methods.addAll(syncMethods);
        }
        if (settings.getSyncMethods() == JavaSettings.SyncMethodsGeneration.SYNC_ONLY) {
            methods.removeAll(asyncProxyMethods);
        }
        return methods;
    }

    private static ProxyMethod createCustomHeaderMethod(Operation operation, JavaSettings settings,
        String operationName, ProxyMethod baseMethod) {
        if (settings.isDisableTypedHeadersMethods()) {
            return null;
        }
        final IType responseBodyType = baseMethod.getResponseBodyType();
        final IType asyncRestResponseReturnType = baseMethod.getReturnType();
        final ProxyMethod.Builder builder = baseMethod.newBuilder();
        if (settings.isNoCustomHeaders()
            && asyncRestResponseReturnType instanceof GenericType
            && ((GenericType) asyncRestResponseReturnType).getTypeArguments()[0] instanceof GenericType
            && ((GenericType) ((GenericType) asyncRestResponseReturnType).getTypeArguments()[0]).getName()
                .equals("ResponseBase")) {
            final IType asyncResponseWithNoHeaders = AsyncResponseTypeFactory.create(operation, responseBodyType,
                settings.isDataPlaneClient(), settings, true);
            builder.returnType(asyncResponseWithNoHeaders);
            builder.name(operationName + "NoCustomHeaders");
            builder.customHeaderIgnored(true);
            return builder.build();
        }
        return null;
    }

    /**
     * if the given method has a Flux of ByteBuffer parameter, create a method overload for it with BinaryData.
     *
     * @param method the method to check and create overload for.
     * @param parameters the parameters.
     * @return the new method overload with BinaryData parameter, or null if no Flux of ByteBuffer parameter found.
     */
    private static ProxyMethod createMethodOverloadForBinaryData(ProxyMethod method,
        List<ProxyMethodParameter> parameters) {
        final ProxyMethodParameter fluxByteBufferParameter = parameters.stream()
            .filter(parameter -> parameter.getClientType() == GenericType.FLUX_BYTE_BUFFER)
            .findFirst()
            .orElse(null);
        if (fluxByteBufferParameter == null) {
            return null;
        }
        final ProxyMethod.Builder builder = method.newBuilder();
        final List<ProxyMethodParameter> methodParameters = new ArrayList<>(parameters);
        final int i = parameters.indexOf(fluxByteBufferParameter);
        methodParameters.remove(i);
        final ProxyMethodParameter binaryDataParameter = fluxByteBufferParameter.newBuilder()
            .wireType(ClassType.BINARY_DATA)
            .rawType(ClassType.BINARY_DATA)
            .clientType(ClassType.BINARY_DATA)
            .build();
        methodParameters.add(i, binaryDataParameter);
        builder.parameters(methodParameters);
        return builder.build();
    }

    /**
     * Create equivalent sync proxy methods for the given async proxy methods.
     *
     * @param asyncProxyMethods the async proxy methods.
     * @return the sync proxy methods.
     */
    private static List<ProxyMethod> createSyncProxyMethods(List<ProxyMethod> asyncProxyMethods) {
        List<ProxyMethod> syncMethods = new ArrayList<>();
        for (ProxyMethod asyncMethod : asyncProxyMethods) {
            if (asyncMethod.getParameters()
                .stream()
                .anyMatch(param -> param.getClientType() == GenericType.FLUX_BYTE_BUFFER)) {
                continue;
            }
            syncMethods.add(asyncMethod.toSync());
        }
        return syncMethods;
    }

    /**
     * Gets the exception type for the given response representing operation error.
     *
     * @param exception the operation error.
     * @param settings the Java settings.
     * @return the client model exception type representing the given operation error.
     */
    private ClassType getExceptionType(Response exception, JavaSettings settings) {
        if (exception != null && exception.getSchema() != null) {
            final ClassType errorType = (ClassType) Mappers.getSchemaMapper().map(exception.getSchema());
            if (errorType != null) {
                return mapToExceptionClassType(errorType, settings);
            }
        }
        // default exception type.
        return getHttpResponseExceptionType();
    }

    /**
     * Maps the error ClassType to exception ClassType.
     *
     * @param errorType the error class type.
     * @param settings the Java settings.
     *
     * @return the exception ClassType.
     */
    protected ClassType mapToExceptionClassType(ClassType errorType, JavaSettings settings) {
        if (errorType == null) {
            return null;
        }
        String exceptionName = errorType.getExtensions() == null ? null : errorType.getExtensions().getXmsClientName();
        if (CoreUtils.isNullOrEmpty(exceptionName)) {
            exceptionName = errorType.getName();
            exceptionName += "Exception";
        }

        final String exceptionPackage = (settings.isCustomType(exceptionName))
            ? settings.getPackage(settings.getCustomTypesSubpackage())
            : settings.getPackage(settings.getModelsSubpackage());

        return new ClassType.Builder().packageName(exceptionPackage).name(exceptionName).build();
    }

    /**
     * Gets the default HTTP response exception type.
     * <p>
     * The returned exception type is used as the default HTTP exception when both the Swagger doesn't define an HTTP
     * exception type and {@link JavaSettings} doesn't contain {@link JavaSettings#getDefaultHttpExceptionType()}.
     *
     * @return The default HTTP response exception type.
     */
    protected ClassType getHttpResponseExceptionType() {
        return ClassType.HTTP_RESPONSE_EXCEPTION;
    }

    /**
     * Gets the examples defined for the operation.
     *
     * @param operation the operation containing the examples.
     * @param operationId the operation ID.
     * @return a map of example names to `ProxyMethodExample` instances, or null if no examples are defined.
     */
    private static Map<String, ProxyMethodExample> getExamples(Operation operation, String operationId) {
        if (operation.getExtensions() != null
            && operation.getExtensions().getXmsExamples() != null
            && operation.getExtensions().getXmsExamples().getExamples() != null
            && !operation.getExtensions().getXmsExamples().getExamples().isEmpty()) {
            return operation.getExtensions()
                .getXmsExamples()
                .getExamples()
                .entrySet()
                .stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> Mappers.getProxyMethodExampleMapper()
                    .map(new XmsExampleWrapper(e.getValue(), operationId, e.getKey()))));
        }
        return null;
    }

    private static final class SwaggerExceptionDefinitions {
        private ClassType defaultExceptionType;
        private final Map<Integer, ClassType> exceptionTypeMapping;

        private SwaggerExceptionDefinitions() {
            defaultExceptionType = null;
            exceptionTypeMapping = new HashMap<>();
        }

        ClassType getDefaultExceptionType() {
            return defaultExceptionType;
        }

        Map<Integer, ClassType> getExceptionTypeMapping() {
            return exceptionTypeMapping;
        }

        static SwaggerExceptionDefinitions create(ProxyMethodMapper mapper, Operation operation,
            JavaSettings settings) {
            if (settings.isDataPlaneClient() && settings.isBranded()) {
                // LLC does not use model, hence exception from swagger
                final SwaggerExceptionDefinitions definitions = new SwaggerExceptionDefinitions();
                definitions.defaultExceptionType = ClassType.HTTP_RESPONSE_EXCEPTION;
                return definitions;
            }
            if (operation.getExceptions() == null || operation.getExceptions().isEmpty()) {
                return new SwaggerExceptionDefinitions();
            }

            final SwaggerExceptionDefinitions definitions = new SwaggerExceptionDefinitions();
            /*
             * 1. If exception has valid numeric status codes, group them to unexpectedResponseExceptionTypes
             * 2. If exception does not have status codes, or have 'default' or invalid number, put the first to
             * unexpectedResponseExceptionType, ignore the rest
             * 3. After processing, if no model in unexpectedResponseExceptionType, take any from
             * unexpectedResponseExceptionTypes and put it to unexpectedResponseExceptionType
             */
            for (Response exception : operation.getExceptions()) {
                // Exception doesn't have HTTP configurations, skip it.
                if (exception.getProtocol() == null || exception.getProtocol().getHttp() == null) {
                    continue;
                }
                boolean isDefaultError = true;
                List<String> statusCodes = exception.getProtocol().getHttp().getStatusCodes();
                if (statusCodes != null && !statusCodes.isEmpty()) {
                    try {
                        final ClassType exceptionType = mapper.getExceptionType(exception, settings);
                        statusCodes.stream()
                            .map(Integer::parseInt)
                            .forEach(status -> definitions.exceptionTypeMapping.putIfAbsent(status, exceptionType));
                        isDefaultError = false;
                    } catch (NumberFormatException ex) {
                        // statusCodes can be 'default'
                        // logger.warn("Failed to parse status code, exception {}", ex.toString());
                    }
                }

                if (definitions.defaultExceptionType == null && isDefaultError && exception.getSchema() != null) {
                    definitions.defaultExceptionType = mapper.mapToExceptionClassType(
                        (ClassType) Mappers.getSchemaMapper().map(exception.getSchema()), settings);
                }
            }
            // m4 could return Response without schema, when the Swagger uses e.g. "produces: [ application/x-rdp ]"
            if (definitions.defaultExceptionType == null
                && settings.isBranded()
                && !CoreUtils.isNullOrEmpty(operation.getExceptions())
                && operation.getExceptions().get(0).getSchema() != null) {
                // no default error, use the 1st to keep backward compatibility
                definitions.defaultExceptionType = mapper.mapToExceptionClassType(
                    (ClassType) Mappers.getSchemaMapper().map(operation.getExceptions().get(0).getSchema()), settings);
            }
            return definitions;
        }
    }
}
