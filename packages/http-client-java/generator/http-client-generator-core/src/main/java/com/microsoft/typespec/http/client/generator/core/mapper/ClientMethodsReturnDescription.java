// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.core.http.HttpMethod;
import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPollingDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.microsoft.typespec.http.client.generator.core.util.ReturnTypeJavaDocAssembler;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * This class describes the return types of client methods. It provides apis to create {@link ReturnValue} for different
 * client method types, {@link ClientMethodType}. A return value is composed of the client method return type and
 * the JavaDoc for the return type.
 */
public final class ClientMethodsReturnDescription {
    private final Operation operation;
    private final IType asyncRestResponseReturnType;
    private final IType asyncReturnType;
    private final IType syncReturnType;
    private final IType syncReturnWithResponse;

    /**
     * Create a {@link ClientMethodsReturnDescription} for the given operation. The description allows obtaining
     * {@link ReturnValue} for different client methods based on the operation.
     *
     * @param operation the operation.
     * @param isProtocolMethod whether the operation is a protocol method.
     * @param isCustomHeaderIgnored whether the custom header is ignored.
     * @return the {@link ClientMethodsReturnDescription} for the given operation.
     */
    public static ClientMethodsReturnDescription create(Operation operation, boolean isProtocolMethod,
        boolean isCustomHeaderIgnored) {
        final JavaSettings settings = JavaSettings.getInstance();

        if (operation.isPageable()) {
            return createForPageable(operation, isProtocolMethod, settings);
        }

        final IType responseBodyType = getResponseBodyType(operation, isProtocolMethod, settings);

        if (responseBodyType == ClassType.INPUT_STREAM) {
            return createForInputStream(operation, isProtocolMethod, isCustomHeaderIgnored, settings);
        }

        final IType asyncRestResponseReturnType;
        final IType asyncReturnType;
        final IType syncReturnType;
        final IType syncReturnWithResponse;
        //
        asyncRestResponseReturnType = ResponseTypeFactory
            .createAsyncResponse(operation, responseBodyType, isProtocolMethod, settings, isCustomHeaderIgnored)
            .getClientType();
        final IType restAPIMethodReturnBodyClientType = responseBodyType.getClientType();
        if (restAPIMethodReturnBodyClientType == PrimitiveType.VOID) {
            asyncReturnType = mono(ClassType.VOID);
        } else {
            asyncReturnType = mono(restAPIMethodReturnBodyClientType);
        }
        if (responseBodyType == GenericType.FLUX_BYTE_BUFFER && settings.isVanilla()) {
            // for vanilla + text/xx(e.g. text/powershell) Content-Type
            syncReturnType = settings.isInputStreamForBinary() ? ClassType.INPUT_STREAM : ClassType.BINARY_DATA;
        } else {
            syncReturnType = responseBodyType.getClientType();
        }
        syncReturnWithResponse = ResponseTypeFactory.createSyncResponse(operation, syncReturnType, isProtocolMethod,
            settings, isCustomHeaderIgnored);
        return new ClientMethodsReturnDescription(operation, asyncRestResponseReturnType, asyncReturnType,
            syncReturnType, syncReturnWithResponse);
    }

    /**
     * Get the {@link ReturnValue} for the given client method type.
     * <p>
     * the return value is composed of the client method return type and the JavaDoc for the return type.
     * </p>
     *
     * @param methodType the client method type.
     * @return the return value.
     */
    public ReturnValue getReturnValue(ClientMethodType methodType) {
        switch (methodType) {
            case PagingSyncSinglePage:
                return createReturnValue(syncReturnWithResponse, syncReturnType);

            case PagingAsyncSinglePage:
                return createReturnValue(asyncRestResponseReturnType, syncReturnType);

            case PagingSync:
                return createReturnValue(syncReturnType, syncReturnType);

            case PagingAsync:
                return createReturnValue(asyncReturnType, syncReturnType);

            case SimpleSyncRestResponse:
                return createReturnValue(syncReturnWithResponse, syncReturnType);

            case SimpleAsyncRestResponse:
                return createReturnValue(asyncRestResponseReturnType, syncReturnType);

            case SimpleSync:
                return createReturnValue(syncReturnType, syncReturnType);

            case SimpleAsync:
                return createReturnValue(asyncReturnType, syncReturnType);

            case LongRunningSync:
                return createReturnValue(syncReturnType, syncReturnType);

            case LongRunningAsync:
                return createReturnValue(asyncReturnType, syncReturnType);

            case LongRunningBeginSync:
            case LongRunningBeginAsync:
                throw new UnsupportedOperationException(
                    "Use 'getReturnValue(ClientMethodType, MethodPollingDetails)' for 'LongRunningBegin' method types.");

            default:
                throw new IllegalArgumentException("Unsupported method type: " + methodType);
        }
    }

    /**
     * Get the {@link ReturnValue} for the given long-running client method type.
     * <p>
     * the return value is composed of the client method return type and the JavaDoc for the return type.
     * </p>
     *
     * @param methodType the long-running client method type.
     * @param pollingDetails the long-running polling details.
     * @return the return value.
     */
    public ReturnValue getReturnValue(ClientMethodType methodType, MethodPollingDetails pollingDetails) {
        final JavaSettings settings = JavaSettings.getInstance();
        switch (methodType) {
            case LongRunningBeginSync:
                if (settings.isFluent()) {
                    final IType returnType = GenericType.SyncPoller(GenericType.PollResult(syncReturnType.asNullable()),
                        syncReturnType.asNullable());
                    return createReturnValue(returnType, syncReturnType);
                } else if (settings.isAzureV2()) {
                    IType returnType = GenericType.AzureVNextPoller(pollingDetails.getIntermediateType(),
                        pollingDetails.getFinalType());
                    return createReturnValue(returnType, pollingDetails.getFinalType());
                } else {
                    IType returnType
                        = GenericType.SyncPoller(pollingDetails.getIntermediateType(), pollingDetails.getFinalType());
                    return createReturnValue(returnType, pollingDetails.getFinalType());
                }
            case LongRunningBeginAsync:
                if (settings.isFluent()) {
                    IType returnType = GenericType.PollerFlux(GenericType.PollResult(syncReturnType.asNullable()),
                        syncReturnType.asNullable());
                    return createReturnValue(returnType, syncReturnType);
                } else {
                    IType returnType
                        = GenericType.PollerFlux(pollingDetails.getIntermediateType(), pollingDetails.getFinalType());
                    return createReturnValue(returnType, pollingDetails.getFinalType());
                }
            default:
                throw new IllegalArgumentException("Unsupported method type: " + methodType
                    + ". Use 'getReturnValue(ClientMethodType)' for non-'LongRunningBegin' method types.");
        }
    }

    /**
     * Creates a {@link ReturnValue} for the given return type and base type.
     *
     * @param returnType the return type.
     * @param baseType the base type of the return type.
     * @return the {@link ReturnValue} for the given return type and base type.
     */
    public ReturnValue createReturnValue(IType returnType, IType baseType) {
        return new ReturnValue(returnTypeJavaDoc(operation, returnType, baseType), returnType);
    }

    public IType getSyncReturnType() {
        return syncReturnType;
    }

    /**
     * Create a {@link ClientMethodsReturnDescription} for pageable client methods.
     *
     * @param operation the pagination operation.
     * @param isProtocolMethod whether the operation is a protocol method.
     * @param settings the Java settings.
     * @return the {@link ClientMethodsReturnDescription} for pageable client methods.
     */
    private static ClientMethodsReturnDescription createForPageable(Operation operation, boolean isProtocolMethod,
        JavaSettings settings) {
        assert operation.isPageable();
        final Schema pageResponseSchema = SchemaUtil.getLowestCommonParent(operation.getResponseSchemas().iterator());
        if (!(pageResponseSchema instanceof ObjectSchema)) {
            throw new IllegalArgumentException(
                String.format("[JavaCheck/SchemaError] no common parent found for client models %s",
                    operation.getResponseSchemas().map(SchemaUtil::getJavaName).collect(Collectors.toList())));
        }
        final ClientModel pageResponseModel = Mappers.getModelMapper().map((ObjectSchema) pageResponseSchema);
        final String pageItemName = operation.getExtensions().getXmsPageable().getItemName();
        final Optional<ClientModelProperty> pageItemPropertyOpt
            = ClientModelUtil.findProperty(pageResponseModel, pageItemName);
        if (pageItemPropertyOpt.isEmpty()) {
            throw new IllegalArgumentException(
                String.format("[JavaCheck/SchemaError] item name %s not found among properties of client model %s",
                    pageItemName, pageResponseModel.getName()));
        }

        if (isProtocolMethod && settings.isAzureV1()) {
            IType asyncRestResponseReturnType = mono(GenericType.PagedResponse(ClassType.BINARY_DATA));
            IType asyncReturnType = GenericType.PagedFlux(ClassType.BINARY_DATA);
            IType syncReturnType = GenericType.PagedIterable(ClassType.BINARY_DATA);
            IType syncReturnWithResponse = GenericType.PagedResponse(ClassType.BINARY_DATA);
            return new ClientMethodsReturnDescription(operation, asyncRestResponseReturnType, asyncReturnType,
                syncReturnType, syncReturnWithResponse);
        }

        // unbranded paging methods would use the model as return type, instead of BinaryData.
        //
        final ClientModelProperty property = pageItemPropertyOpt.get();
        final IType listType = property.getWireType();
        final IType elementType = ((ListType) listType).getElementType();
        IType asyncRestResponseReturnType = mono(GenericType.PagedResponse(elementType));
        IType asyncReturnType = GenericType.PagedFlux(elementType);
        IType syncReturnType = GenericType.PagedIterable(elementType);
        IType syncReturnWithResponse = GenericType.PagedResponse(elementType);
        return new ClientMethodsReturnDescription(operation, asyncRestResponseReturnType, asyncReturnType,
            syncReturnType, syncReturnWithResponse);
    }

    /**
     * Create a {@link ClientMethodsReturnDescription} for client methods returning streams ({@link java.io.InputStream}
     * for synchronous methods and Flux of ByteBuffer for asynchronous methods).
     *
     * @param operation the byte stream operation.
     * @param isProtocolMethod whether the operation is a protocol method.
     * @param isCustomHeaderIgnored whether the custom header is ignored.
     * @param settings the Java settings.
     * @return the {@link ClientMethodsReturnDescription} for client methods returning streams.
     */
    private static ClientMethodsReturnDescription createForInputStream(Operation operation, boolean isProtocolMethod,
        boolean isCustomHeaderIgnored, JavaSettings settings) {
        final IType asyncRestResponseReturnType = ResponseTypeFactory
            .createAsyncResponse(operation, ClassType.INPUT_STREAM, isProtocolMethod, settings, isCustomHeaderIgnored)
            .getClientType();
        final IType asyncReturnType = GenericType.FLUX_BYTE_BUFFER;
        final IType syncReturnType = ClassType.INPUT_STREAM;
        final IType syncReturnWithResponse = ResponseTypeFactory.createSyncResponse(operation, syncReturnType,
            isProtocolMethod, settings, isCustomHeaderIgnored);
        return new ClientMethodsReturnDescription(operation, asyncRestResponseReturnType, asyncReturnType,
            syncReturnType, syncReturnWithResponse);
    }

    /**
     * Gets the body type for the given operation's response.
     *
     * @param operation the operation.
     * @param isProtocolMethod whether the operation is a protocol method.
     * @param settings the Java settings.
     * @return the response body type.
     */
    private static IType getResponseBodyType(Operation operation, boolean isProtocolMethod, JavaSettings settings) {
        final IType expectedResponseBodyType = MapperUtils.getExpectedResponseBodyType(operation, settings);
        if (isProtocolMethod && settings.isAzureV1()) {
            return SchemaUtil.tryMapToBinaryData(expectedResponseBodyType, operation);
        }
        return expectedResponseBodyType;
    }

    /**
     * Creates a {@link reactor.core.publisher.Mono} type wrapping the given type.
     *
     * @param type the type to wrap.
     * @return the Mono type wrapping the given type.
     */
    private static IType mono(IType type) {
        return GenericType.Mono(type);
    }

    /**
     * Util method to get the JavaDoc for a client method return type.
     *
     * @param operation the operation.
     * @param returnType the return type of the client method.
     * @param baseType the base type of the return type.
     * @return the JavaDoc.
     */
    public static String returnTypeJavaDoc(Operation operation, IType returnType, IType baseType) {
        if (returnType == PrimitiveType.VOID) {
            // void methods don't have a return value, therefore no return Javadoc.
            return null;
        }
        String javaDoc = null;
        // Create the JavaDoc from the operation's summary and description, if available.
        if (operation.getLanguage() != null && operation.getLanguage().getDefault() != null) {
            String operationDescription = SchemaUtil.mergeSummaryWithDescription(operation.getSummary(),
                operation.getLanguage().getDefault().getDescription());
            if (!CoreUtils.isNullOrEmpty(operationDescription)) {
                if (operationDescription.toLowerCase().startsWith("get ")
                    || operationDescription.toLowerCase().startsWith("gets ")) {
                    int startIndex = operationDescription.indexOf(" ") + 1;
                    javaDoc = formatReturnTypeJavaDoc(operationDescription.substring(startIndex));
                }
            }
        }

        // Create the JavaDoc from the operation's response schema (i.e, the return type), if available.
        if (javaDoc == null && operation.getResponses() != null && !operation.getResponses().isEmpty()) {
            Schema responseSchema = operation.getResponses().get(0).getSchema();
            if (responseSchema != null && !CoreUtils.isNullOrEmpty(responseSchema.getSummary())) {
                javaDoc = formatReturnTypeJavaDoc(responseSchema.getSummary());
            } else if (responseSchema != null
                && responseSchema.getLanguage() != null
                && responseSchema.getLanguage().getDefault() != null) {
                String responseSchemaDescription = responseSchema.getLanguage().getDefault().getDescription();
                if (!CoreUtils.isNullOrEmpty(responseSchemaDescription)) {
                    javaDoc = formatReturnTypeJavaDoc(responseSchemaDescription);
                }
            }
        }

        if (javaDoc == null
            && baseType == PrimitiveType.BOOLEAN
            && HttpMethod.HEAD == MethodUtil.getHttpMethod(operation)) {
            // Mono<Boolean> of HEAD method
            javaDoc = "whether resource exists";
        }

        javaDoc = ReturnTypeJavaDocAssembler.assemble(javaDoc, returnType, baseType);
        return javaDoc == null ? "the response" : javaDoc;
    }

    private static String formatReturnTypeJavaDoc(String javaDoc) {
        javaDoc = javaDoc.trim();
        int endIndex = javaDoc.indexOf(". ");   // Get 1st sentence.
        if (endIndex == -1 && !javaDoc.isEmpty() && javaDoc.charAt(javaDoc.length() - 1) == '.') {
            // Remove last period.
            endIndex = javaDoc.length() - 1;
        }
        if (endIndex != -1) {
            javaDoc = javaDoc.substring(0, endIndex);
        }
        if (!javaDoc.isEmpty() && Character.isUpperCase(javaDoc.charAt(0))) {
            javaDoc = javaDoc.substring(0, 1).toLowerCase() + javaDoc.substring(1);
        }
        return javaDoc;
    }

    private ClientMethodsReturnDescription(Operation operation, IType asyncRestResponseReturnType,
        IType asyncReturnType, IType syncReturnType, IType syncReturnWithResponse) {
        this.operation = operation;
        this.asyncRestResponseReturnType = asyncRestResponseReturnType;
        this.asyncReturnType = asyncReturnType;
        this.syncReturnType = syncReturnType;
        this.syncReturnWithResponse = syncReturnWithResponse;
    }
}
