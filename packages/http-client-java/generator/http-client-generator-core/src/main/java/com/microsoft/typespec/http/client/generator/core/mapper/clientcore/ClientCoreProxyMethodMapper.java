// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.clientcore;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.CustomProxyParameterMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.MapperUtils;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.mapper.ProxyMethodMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import com.microsoft.typespec.http.client.generator.core.util.XmsExampleWrapper;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.utils.CoreUtils;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;

public class ClientCoreProxyMethodMapper extends ProxyMethodMapper {
    private static final ClientCoreProxyMethodMapper INSTANCE = new ClientCoreProxyMethodMapper();

    private ClientCoreProxyMethodMapper() {
    }

    public static ClientCoreProxyMethodMapper getInstance() {
        return INSTANCE;
    }

    private final Logger logger = new PluginLogger(Javagen.getPluginInstance(), ProxyMethodMapper.class);

    private static final List<IType> RETURN_VALUE_WIRE_TYPE_OPTIONS
        = Arrays.asList(ClassType.BASE_64_URL, ClassType.DATE_TIME_RFC_1123, PrimitiveType.DURATION_LONG,
            PrimitiveType.DURATION_DOUBLE, ClassType.DURATION_LONG, ClassType.DURATION_DOUBLE,
            PrimitiveType.UNIX_TIME_LONG, ClassType.UNIX_TIME_LONG, ClassType.UNIX_TIME_DATE_TIME);

    private final Map<Request, List<ProxyMethod>> parsed = new ConcurrentHashMap<>();

    @Override
    public Map<Request, List<ProxyMethod>> map(Operation operation) {
        JavaSettings settings = JavaSettings.getInstance();
        Map<Request, List<ProxyMethod>> result = new LinkedHashMap<>();

        String operationName = operation.getLanguage().getJava().getName();
        ProxyMethod.Builder builder
            = createProxyMethodBuilder().description(operation.getDescription()).name(operationName).isResumable(false);

        String operationId = operation.getOperationId();
        if (CoreUtils.isNullOrEmpty(operationId)
            && operation.getLanguage() != null
            && operation.getLanguage().getDefault() != null) {  // operationId or language.default could be null for
            // generated method like "listNext"
            if (operationGroupNotNull(operation, settings)) {
                operationId = operation.getOperationGroup().getLanguage().getDefault().getName() + "_"
                    + operation.getLanguage().getDefault().getName();
            } else {
                operationId = operation.getLanguage().getDefault().getName();
            }
        }
        builder.operationId(operationId);

        List<Integer> expectedStatusCodes = operation.getResponses()
            .stream()
            .flatMap(r -> r.getProtocol().getHttp().getStatusCodes().stream())
            .map(s -> s.replace("'", ""))
            .map(Integer::parseInt)
            .sorted()
            .collect(Collectors.toList());
        builder.responseExpectedStatusCodes(expectedStatusCodes);

        IType responseBodyType = MapperUtils.getExpectedResponseBodyType(operation, settings);
        builder.responseBodyType(responseBodyType);
        IType asyncRestResponseReturnType
            = getAsyncRestResponseReturnType(operation, responseBodyType, settings.isDataPlaneClient(), settings);
        builder.returnType(asyncRestResponseReturnType);

        buildUnexpectedResponseExceptionTypes(builder, operation, expectedStatusCodes, settings);

        AtomicReference<IType> responseBodyTypeReference = new AtomicReference<>(responseBodyType);
        builder.returnValueWireType(RETURN_VALUE_WIRE_TYPE_OPTIONS.stream()
            .filter(type -> responseBodyTypeReference.get().contains(type))
            .findFirst()
            .orElse(null));

        Set<String> responseContentTypes = operation.getResponses()
            .stream()
            .filter(r -> r.getProtocol() != null
                && r.getProtocol().getHttp() != null
                && r.getProtocol().getHttp().getMediaTypes() != null)
            .flatMap(r -> r.getProtocol().getHttp().getMediaTypes().stream())
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
        if (!responseContentTypes.contains("application/json")) {
            responseContentTypes.add(MethodUtil.CONTENT_TYPE_APPLICATION_JSON_ERROR_WEIGHT);
        }
        builder.responseContentTypes(responseContentTypes);

        List<Request> requests = operation.getRequests();
        // Used to deduplicate method with same signature.
        // E.g. one request takes "application/json" and another takes "text/plain", which both are String type
        Set<List<String>> methodSignatures = new HashSet<>();

        for (Request request : requests) {
            if (parsed.containsKey(request)) {
                result.put(request, parsed.get(request));
                continue;
            }

            String requestContentType = "application/json";

            // check for mediaTypes first as that is more specific than the knownMediaType
            // if there are multiple, we'll use the generic type
            if (request.getProtocol().getHttp().getMediaTypes() != null
                && request.getProtocol().getHttp().getMediaTypes().size() == 1) {
                requestContentType = request.getProtocol().getHttp().getMediaTypes().get(0);
            } else if (request.getProtocol().getHttp().getKnownMediaType() != null) {
                requestContentType = request.getProtocol().getHttp().getKnownMediaType().getContentType();
            }
            builder.requestContentType(requestContentType);
            builder.baseURL(request.getProtocol().getHttp().getUri());
            builder.urlPath(request.getProtocol().getHttp().getPath());
            builder.httpMethod(HttpMethod.valueOf(request.getProtocol().getHttp().getMethod().toUpperCase()));

            List<ProxyMethodParameter> parameters = new ArrayList<>();
            List<ProxyMethodParameter> allParameters = new ArrayList<>();
            List<ProxyMethod> proxyMethods = new ArrayList<>();
            // add content-type parameter to allParameters when body is optional and there is single content type
//            if (settings.isDataPlaneClient()
//                // only if "content-type" is not already defined in parameters
//                && request.getParameters()
//                    .stream()
//                    .noneMatch(p -> p.getProtocol() != null
//                        && p.getProtocol().getHttp() != null
//                        && p.getProtocol().getHttp().getIn() == RequestParameterLocation.HEADER
//                        && "content-type".equalsIgnoreCase(p.getLanguage().getDefault().getSerializedName()))) {
//                boolean isBodyParamRequired = request.getParameters()
//                    .stream()
//                    .filter(p -> p.getProtocol() != null
//                        && p.getProtocol().getHttp() != null
//                        && p.getProtocol().getHttp().getIn() == RequestParameterLocation.BODY)
//                    .map(Parameter::isRequired)
//                    .findFirst()
//                    .orElse(false);
//                if (MethodUtil.getContentTypeCount(operation.getRequests()) == 1 && !isBodyParamRequired) {
//                    Parameter contentTypeParameter = MethodUtil.createContentTypeParameter(request, operation);
//                    allParameters.add(Mappers.getProxyParameterMapper().map(contentTypeParameter));
//                }
//            }

            for (Parameter parameter : request.getParameters()
                .stream()
                .filter(p -> p.getProtocol() != null && p.getProtocol().getHttp() != null)
                .collect(Collectors.toList())) {
                parameter.setOperation(operation);
                ProxyMethodParameter proxyMethodParameter = Mappers.getProxyParameterMapper().map(parameter);
                if (requestContentType.startsWith("application/json-patch+json")) {
                    proxyMethodParameter = CustomProxyParameterMapper.getInstance().map(parameter);
                }
                allParameters.add(proxyMethodParameter);
                parameters.add(proxyMethodParameter);

            }
            List<ProxyMethodParameter> specialParameters = getSpecialParameters(operation);
            if (!CoreUtils.isNullOrEmpty(specialParameters)) {
                builder.specialHeaders(specialParameters.stream()
                    .map(ProxyMethodParameter::getRequestParameterName)
                    .collect(Collectors.toList()));
            }
            parameters.addAll(specialParameters);
            allParameters.addAll(specialParameters);

            String name = deduplicateMethodName(operationName, parameters, requestContentType, methodSignatures);
            builder.name(name);

            ProxyMethodParameter requestContext = ProxyMethodParameter.REQUEST_CONTEXT_PARAMETER;
            allParameters.add(requestContext);
            parameters.add(requestContext);

            appendCallbackParameter(parameters, responseBodyType);
            builder.allParameters(allParameters);
            builder.parameters(parameters);

            if (operation.getExtensions() != null
                && operation.getExtensions().getXmsExamples() != null
                && operation.getExtensions().getXmsExamples().getExamples() != null
                && !operation.getExtensions().getXmsExamples().getExamples().isEmpty()) {
                String operationIdLocal = operationId;
                Map<String, ProxyMethodExample> examples = operation.getExtensions()
                    .getXmsExamples()
                    .getExamples()
                    .entrySet()
                    .stream()
                    .collect(Collectors.toMap(Map.Entry::getKey, e -> Mappers.getProxyMethodExampleMapper()
                        .map(new XmsExampleWrapper(e.getValue(), operationIdLocal, e.getKey()))));
                builder.examples(examples);
            }

            ProxyMethod proxyMethod = builder.build();
            proxyMethods.add(proxyMethod);

            final List<ProxyMethod> asyncProxyMethods = new ArrayList<>(proxyMethods);
            addSyncProxyMethods(proxyMethods);
            proxyMethods.removeAll(asyncProxyMethods);
            result.put(request, proxyMethods);
            parsed.put(request, proxyMethods);
        }
        return result;
    }

    private void addSyncProxyMethods(List<ProxyMethod> proxyMethods) {
        List<ProxyMethod> syncProxyMethods = new ArrayList<>();
        for (ProxyMethod asyncProxyMethod : proxyMethods) {
            if (asyncProxyMethod.getParameters()
                .stream()
                .anyMatch(param -> param.getClientType() == GenericType.FLUX_BYTE_BUFFER)) {
                continue;
            }
            ProxyMethod syncProxyMethod = asyncProxyMethod.toSync();
            syncProxyMethods.add(syncProxyMethod);

            IType responseBodyType = syncProxyMethod.getResponseBodyType();

            StringBuilder convenienceMethodImpl = new StringBuilder();
            convenienceMethodImpl.append(responseBodyType == PrimitiveType.VOID ? "" : "return ")
                .append(syncProxyMethod.getName())
                .append("(");

            List<ProxyMethodParameter> requiredParams = new ArrayList<>();

            boolean isFirst = true;
            for (ProxyMethodParameter param : syncProxyMethod.getAllParameters()) {
                if (!isFirst) {
                    convenienceMethodImpl.append(", ");
                }
                if (param.isRequired()) {
                    requiredParams.add(param);
                    convenienceMethodImpl.append(param.getName());
                } else {
                    convenienceMethodImpl.append("null");
                }
                if (isFirst) {
                    isFirst = false;
                }
            }
            convenienceMethodImpl.append(")");
            convenienceMethodImpl.append(responseBodyType == PrimitiveType.VOID ? ";" : ".getValue();");

            ProxyMethod newSyncProxyMethod = new ProxyMethod.Builder().baseName(syncProxyMethod.getBaseName())
                .name(syncProxyMethod.getName())
                .operationId(syncProxyMethod.getOperationId())
                .httpMethod(syncProxyMethod.getHttpMethod())
                .baseURL(syncProxyMethod.getBaseUrl())
                .rawResponseBodyType(syncProxyMethod.getRawResponseBodyType())
                .description(syncProxyMethod.getDescription())
                .responseBodyType(syncProxyMethod.getResponseBodyType())
                .requestContentType(syncProxyMethod.getRequestContentType())
                .returnType(responseBodyType)
                .returnValueWireType(syncProxyMethod.getReturnValueWireType())
                .unexpectedResponseExceptionTypes(syncProxyMethod.getUnexpectedResponseExceptionTypes())
                .unexpectedResponseExceptionType(syncProxyMethod.getUnexpectedResponseExceptionType())
                .isSync(syncProxyMethod.isSync())
                .isResumable(syncProxyMethod.isResumable())
                .customHeaderIgnored(syncProxyMethod.isCustomHeaderIgnored())
                .examples(syncProxyMethod.getExamples())
                .urlPath(syncProxyMethod.getUrlPath())
                .specialHeaders(syncProxyMethod.getSpecialHeaders())
                .responseContentTypes(syncProxyMethod.getResponseContentTypes())
                .responseExpectedStatusCodes(syncProxyMethod.getResponseExpectedStatusCodes())
                .allParameters(requiredParams)
                .parameters(requiredParams)
                .implementation(convenienceMethodImpl.toString())
                .build();

            if (syncProxyMethod.getAllParameters().size() != newSyncProxyMethod.getAllParameters().size()) {
//                syncProxyMethods.add(newSyncProxyMethod);
            }
        }
        proxyMethods.addAll(syncProxyMethods);
    }

    protected boolean operationGroupNotNull(Operation operation, JavaSettings settings) {
        return operation.getOperationGroup() != null
            && operation.getOperationGroup().getLanguage() != null
            && operation.getOperationGroup().getLanguage().getDefault() != null
            && !CoreUtils.isNullOrEmpty(operation.getOperationGroup().getLanguage().getDefault().getName());
    }

    protected void appendCallbackParameter(List<ProxyMethodParameter> parameters, IType responseBodyType) {
    }

    /**
     * Gets the type for AsyncRestResponse.
     *
     * @param operation the operation.
     * @param responseBodyType the type of the response body.
     * @param isProtocolMethod whether the client method to be simplified for resilience to API changes.
     * @param settings the JavaSettings.
     * @return the type for AsyncRestResponse.
     */
    protected IType getAsyncRestResponseReturnType(Operation operation, IType responseBodyType,
        boolean isProtocolMethod, JavaSettings settings) {
        return this.getAsyncRestResponseReturnType(operation, responseBodyType, isProtocolMethod, settings, false);
    }

    /**
     * Gets the type for AsyncRestResponse.
     *
     * @param operation the operation.
     * @param responseBodyType the type of the response body.
     * @param isProtocolMethod whether the client method to be simplified for resilience to API changes.
     * @param settings the JavaSettings.
     * @param ignoreTypedHeaders Ignores typed headers when creating the return type, if this is set to true.
     * @return the type for AsyncRestResponse.
     */
    public IType getAsyncRestResponseReturnType(Operation operation, IType responseBodyType, boolean isProtocolMethod,
        JavaSettings settings, boolean ignoreTypedHeaders) {
        if (isProtocolMethod) {
            IType singleValueType;
            if (responseBodyType.equals(PrimitiveType.VOID)) {
                singleValueType = GenericType.response(ClassType.VOID);
            } else {
                singleValueType = GenericType.response(responseBodyType);
            }
            return createSingleValueAsyncReturnType(singleValueType);
        } else if (operation.getExtensions() != null
            && operation.getExtensions().isXmsLongRunningOperation()
            && settings.isFluent()
            && (operation.getExtensions().getXmsPageable() == null
                || !(operation.getExtensions().getXmsPageable().getNextOperation() == operation))) {
            // LRO in fluent uses Flux<ByteBuffer> for PollerFactory in azure-core-management
            return createBinaryContentAsyncReturnType();
        } else if (SchemaUtil.responseContainsHeaderSchemas(operation, settings)) {
            // SchemaResponse
            // method with schema in headers would require a ClientResponse
            if (settings.isGenericResponseTypes()) {
                // If the response body type is InputStream it needs to be converted to Flux<ByteBuffer> to be
                // asynchronous, unless this is sync-stack.
                if (responseBodyType == ClassType.INPUT_STREAM) {
                    responseBodyType = GenericType.FLUX_BYTE_BUFFER;
                }
                IType genericResponseType = GenericType.restResponse(
                    Mappers.getSchemaMapper().map(Mappers.getClientMapper().parseHeader(operation, settings)),
                    responseBodyType);

                if (ignoreTypedHeaders || settings.isDisableTypedHeadersMethods()) {
                    if (responseBodyType == GenericType.FLUX_BYTE_BUFFER) {
                        return createStreamContentAsyncReturnType();
                    }
                    genericResponseType = GenericType.response(responseBodyType);
                }
                return createSingleValueAsyncReturnType(genericResponseType);
            } else {
                ClassType clientResponseClassType = ClientMapper.getClientResponseClassType(operation,
                    ClientModels.getInstance().getModels(), settings);
                return createClientResponseAsyncReturnType(clientResponseClassType);
            }
        } else {
            if ((!settings.isDataPlaneClient()
                && !settings.isSyncStackEnabled()
                && settings.isInputStreamForBinary()
                && responseBodyType.equals(ClassType.BINARY_DATA)) || responseBodyType.equals(ClassType.INPUT_STREAM)) {
                return createStreamContentAsyncReturnType();
            } else if (responseBodyType.equals(PrimitiveType.VOID)) {
                IType singleValueType = GenericType.response(ClassType.VOID);
                return createSingleValueAsyncReturnType(singleValueType);
            } else {
                IType singleValueType = GenericType.response(responseBodyType);
                return createSingleValueAsyncReturnType(singleValueType);
            }
        }
    }

    protected IType createSingleValueAsyncReturnType(IType singleValueType) {
        return GenericType.mono(singleValueType);
    }

    protected IType createClientResponseAsyncReturnType(ClassType clientResponseClassType) {
        return GenericType.mono(clientResponseClassType);
    }

    protected IType createStreamContentAsyncReturnType() {
        IType singleValueType = ClassType.STREAM_RESPONSE;
        return GenericType.mono(singleValueType);
    }

    protected IType createBinaryContentAsyncReturnType() {
        IType returnType = GenericType.response(GenericType.FLUX_BYTE_BUFFER);    // raw response for LRO
        return GenericType.mono(returnType);
    }

    protected ProxyMethod.Builder createProxyMethodBuilder() {
        return new ProxyMethod.Builder();
    }

    /**
     * Extension for configure on unexpected response exception types to builder.
     *
     * @param builder the ProxyMethod builder
     * @param operation the operation
     * @param expectedStatusCodes the expected status codes
     * @param settings the settings
     */
    protected void buildUnexpectedResponseExceptionTypes(ProxyMethod.Builder builder, Operation operation,
        List<Integer> expectedStatusCodes, JavaSettings settings) {
        SwaggerExceptionDefinitions swaggerExceptionDefinitions = getSwaggerExceptionDefinitions(operation, settings);
        ClassType settingsDefaultExceptionType = getDefaultHttpExceptionTypeFromSettings(settings);

        // Use the settings defined default exception type over the Swagger defined default exception type.
        ClassType defaultErrorType = (settingsDefaultExceptionType == null)
            ? swaggerExceptionDefinitions.defaultExceptionType
            : settingsDefaultExceptionType;

        if (defaultErrorType != null) {
            builder.unexpectedResponseExceptionType(defaultErrorType);
        } else {
            builder.unexpectedResponseExceptionType(getHttpResponseExceptionType());
        }

        Map<Integer, ClassType> settingsExceptionTypeMap = getHttpStatusToExceptionTypeMappingFromSettings(settings);

        // Initialize the merged map with the Swagger defined configurations so that the settings configurations
        // overrides it.
        Map<Integer, ClassType> mergedExceptionTypeMapping
            = new TreeMap<>(swaggerExceptionDefinitions.exceptionTypeMapping);
        mergedExceptionTypeMapping.putAll(settingsExceptionTypeMap);

        // remove expected status codes
        expectedStatusCodes.forEach(mergedExceptionTypeMapping::remove);

        // Convert the exception type mapping into what code generation uses elsewhere.
        Map<ClassType, List<Integer>> processedMapping = new HashMap<>();
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

    private SwaggerExceptionDefinitions getSwaggerExceptionDefinitions(Operation operation, JavaSettings settings) {

        SwaggerExceptionDefinitions exceptionDefinitions = new SwaggerExceptionDefinitions();
        ClassType swaggerDefaultExceptionType = null;
        Map<Integer, ClassType> swaggerExceptionTypeMap = new HashMap<>();

        if (settings.isDataPlaneClient() && settings.isAzureV1()) {
            // LLC does not use model, hence exception from swagger
            swaggerDefaultExceptionType = ClassType.HTTP_RESPONSE_EXCEPTION;
            exceptionDefinitions.defaultExceptionType = swaggerDefaultExceptionType;
            exceptionDefinitions.exceptionTypeMapping = swaggerExceptionTypeMap;
        } else {
            /*
             * 1. If exception has valid numeric status codes, group them to unexpectedResponseExceptionTypes
             * 2. If exception does not have status codes, or have 'default' or invalid number, put the first to
             * unexpectedResponseExceptionType, ignore the rest
             * 3. After processing, if no model in unexpectedResponseExceptionType, take any from
             * unexpectedResponseExceptionTypes and put it to unexpectedResponseExceptionType
             */
            if (operation.getExceptions() != null && !operation.getExceptions().isEmpty()) {
                for (Response exception : operation.getExceptions()) {
                    // Exception doesn't have HTTP configurations, skip it.
                    if (exception.getProtocol() == null || exception.getProtocol().getHttp() == null) {
                        continue;
                    }

                    boolean isDefaultError = true;
                    List<String> statusCodes = exception.getProtocol().getHttp().getStatusCodes();
                    if (statusCodes != null && !statusCodes.isEmpty()) {
                        try {
                            ClassType exceptionType = getExceptionType(exception, settings);
                            statusCodes.stream()
                                .map(Integer::parseInt)
                                .forEach(status -> swaggerExceptionTypeMap.putIfAbsent(status, exceptionType));

                            isDefaultError = false;
                        } catch (NumberFormatException ex) {
                            // statusCodes can be 'default'
                            // logger.warn("Failed to parse status code, exception {}", ex.toString());
                        }
                    }

                    if (swaggerDefaultExceptionType == null && isDefaultError && exception.getSchema() != null) {
                        swaggerDefaultExceptionType = processExceptionClassType(
                            (ClassType) Mappers.getSchemaMapper().map(exception.getSchema()), settings);
                    }
                }

                // m4 could return Response without schema, when the Swagger uses e.g. "produces: [ application/x-rdp ]"
                if (swaggerDefaultExceptionType == null
                    && settings.isAzureV1()
                    && !CoreUtils.isNullOrEmpty(operation.getExceptions())
                    && operation.getExceptions().get(0).getSchema() != null) {
                    // no default error, use the 1st to keep backward compatibility
                    swaggerDefaultExceptionType = processExceptionClassType(
                        (ClassType) Mappers.getSchemaMapper().map(operation.getExceptions().get(0).getSchema()),
                        settings);
                }
            }

            exceptionDefinitions.defaultExceptionType = swaggerDefaultExceptionType;
            exceptionDefinitions.exceptionTypeMapping = swaggerExceptionTypeMap;
        }

        return exceptionDefinitions;
    }

    private static final class SwaggerExceptionDefinitions {
        private ClassType defaultExceptionType;
        private Map<Integer, ClassType> exceptionTypeMapping;
    }

    private ClassType getExceptionType(Response exception, JavaSettings settings) {
        ClassType exceptionType = getHttpResponseExceptionType();  // default as HttpResponseException

        if (exception != null && exception.getSchema() != null) {
            ClassType errorType = (ClassType) Mappers.getSchemaMapper().map(exception.getSchema());
            if (errorType != null) {
                exceptionType = processExceptionClassType(errorType, settings);
            }
        }

        return exceptionType;
    }

    /**
     * Extension for map error ClassType to exception ClassType.
     *
     * @param errorType the error class.
     * @param settings the Java settings.
     * @return the exception ClassType.
     */
    protected ClassType processExceptionClassType(ClassType errorType, JavaSettings settings) {
        if (errorType == null) {
            return null;
        }

        String exceptionName = errorType.getExtensions() == null ? null : errorType.getExtensions().getXmsClientName();
        if (exceptionName == null || exceptionName.isEmpty()) {
            exceptionName = errorType.getName();
            exceptionName += "Exception";
        }

        String exceptionPackage = (settings.isCustomType(exceptionName))
            ? settings.getPackage(settings.getCustomTypesSubpackage())
            : settings.getPackage(settings.getModelsSubpackage());

        return new ClassType.Builder().packageName(exceptionPackage).name(exceptionName).build();
    }

    private String deduplicateMethodName(String operationName, List<ProxyMethodParameter> parameters,
        String requestContentType, Set<List<String>> methodSignatures) {
        String name = operationName;
        List<String> methodSignature = new ArrayList<>();
        methodSignature.add(operationName);
        methodSignature.addAll(parameters.stream()
            .map(p -> p.getWireType().toString())   // simple class name should be enough?
            .collect(Collectors.toList()));
        if (methodSignatures.contains(methodSignature)) {
            // got a conflict on method signature
            String conflictMethodSignature = methodSignature.toString();

            // first try to append media type
            if (!CoreUtils.isNullOrEmpty(requestContentType)) {
                methodSignature.set(0,
                    operationName + CodeNamer.toPascalCase(CodeNamer.removeInvalidCharacters(requestContentType)));
            }

            // if not working, then just append increasing index no.
            int indexNo = 1;
            while (methodSignatures.contains(methodSignature)) {
                methodSignature.set(0, operationName + indexNo);
                ++indexNo;
            }

            // let's hope the new name does not conflict with name from another operation
            name = methodSignature.get(0);
            logger.warn("Rename method to '{}', due to conflict on method signature {}", name, conflictMethodSignature);
        }
        methodSignatures.add(methodSignature);
        return name;
    }

    private static ClassType getDefaultHttpExceptionTypeFromSettings(JavaSettings settings) {
        String defaultHttpExceptionType = settings.getDefaultHttpExceptionType();

        return CoreUtils.isNullOrEmpty(defaultHttpExceptionType)
            ? null
            : createExceptionTypeFromFullyQualifiedClass(defaultHttpExceptionType);
    }

    private Map<Integer, ClassType> getHttpStatusToExceptionTypeMappingFromSettings(JavaSettings settings) {
        // Use a status code to error type mapping initial so that the custom mapping can override the default mapping,
        // if the default mapping is being used.
        Map<Integer, ClassType> exceptionMapping = new HashMap<>();

        if (settings.isUseDefaultHttpStatusCodeToExceptionTypeMapping()) {
            exceptionMapping.putAll(getDefaultHttpStatusCodeToExceptionTypeMapping());
        }

        Map<Integer, String> customExceptionMapping = settings.getHttpStatusCodeToExceptionTypeMapping();
        if (!CoreUtils.isNullOrEmpty(customExceptionMapping)) {
            customExceptionMapping
                .forEach((key, value) -> exceptionMapping.put(key, createExceptionTypeFromFullyQualifiedClass(value)));
        }

        return exceptionMapping;
    }

    private static ClassType createExceptionTypeFromFullyQualifiedClass(String fullyQualifiedClass) {
        int classStart = fullyQualifiedClass.lastIndexOf(".");
        return new ClassType.Builder().packageName(fullyQualifiedClass.substring(0, classStart))
            .name(fullyQualifiedClass.substring(classStart + 1))
            .build();
    }

    /**
     * Gets the default HTTP status code to exception type mapping.
     * <p>
     * This is only used when {@link JavaSettings#isUseDefaultHttpStatusCodeToExceptionTypeMapping()} is true. The
     * values in this mapping may also be overridden if {@link JavaSettings#getHttpStatusCodeToExceptionTypeMapping()}
     * is configured.
     *
     * @return The default HTTP status code to exception type mapping.
     */
    protected Map<Integer, ClassType> getDefaultHttpStatusCodeToExceptionTypeMapping() {
        Map<Integer, ClassType> defaultMapping = new HashMap<>();
        defaultMapping.put(401, ClassType.CLIENT_AUTHENTICATION_EXCEPTION);
        defaultMapping.put(404, ClassType.RESOURCE_NOT_FOUND_EXCEPTION);
        defaultMapping.put(409, ClassType.RESOURCE_MODIFIED_EXCEPTION);

        return defaultMapping;
    }

    /**
     * Gets the special parameters.
     *
     * @param operation the operation
     * @return the special parameters.
     */
    protected List<ProxyMethodParameter> getSpecialParameters(Operation operation) {
        List<ProxyMethodParameter> specialParameters = new ArrayList<>();
        if (!CoreUtils.isNullOrEmpty(operation.getSpecialHeaders())
            && !CoreUtils.isNullOrEmpty(operation.getRequests())) {
            HttpMethod httpMethod = MethodUtil.getHttpMethod(operation);
            if (MethodUtil.isHttpMethodSupportRepeatableRequestHeaders(httpMethod)) {
                List<String> specialHeaders = operation.getSpecialHeaders()
                    .stream()
                    .map(s -> s.toLowerCase(Locale.ROOT))
                    .collect(Collectors.toList());
                boolean supportRepeatabilityRequest
                    = specialHeaders.contains(MethodUtil.REPEATABILITY_REQUEST_ID_HEADER);
                if (supportRepeatabilityRequest) {
                    Function<ProxyMethodParameter.Builder, ProxyMethodParameter.Builder> commonBuilderSetting
                        = builder -> {
                            builder.rawType(ClassType.STRING)
                                .wireType(ClassType.STRING)
                                .clientType(ClassType.STRING)
                                .requestParameterLocation(RequestParameterLocation.HEADER)
                                .required(false)
                                .nullable(true)
                                .fromClient(false);
                            return builder;
                        };

                    specialParameters.add(commonBuilderSetting.apply(
                        new ProxyMethodParameter.Builder().name(MethodUtil.REPEATABILITY_REQUEST_ID_VARIABLE_NAME)
                            .parameterReference(MethodUtil.REPEATABILITY_REQUEST_ID_EXPRESSION)
                            .requestParameterName(MethodUtil.REPEATABILITY_REQUEST_ID_HEADER)
                            .description("Repeatability request ID header"))
                        .build());
                    if (specialHeaders.contains(MethodUtil.REPEATABILITY_FIRST_SENT_HEADER)) {
                        specialParameters.add(commonBuilderSetting.apply(
                            new ProxyMethodParameter.Builder().name(MethodUtil.REPEATABILITY_FIRST_SENT_VARIABLE_NAME)
                                .parameterReference(MethodUtil.REPEATABILITY_FIRST_SENT_EXPRESSION)
                                .requestParameterName(MethodUtil.REPEATABILITY_FIRST_SENT_HEADER)
                                .description("Repeatability first sent header as HTTP-date"))
                            .build());
                    }
                }
            }
        }
        return specialParameters;
    }
}
