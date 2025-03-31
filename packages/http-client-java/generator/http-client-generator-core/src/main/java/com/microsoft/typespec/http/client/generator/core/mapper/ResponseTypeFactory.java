// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;

/**
 * A factory to create the response type client model representing method's return value.
 */
final class ResponseTypeFactory {
    private ResponseTypeFactory() {
    }

    /**
     * Create a response type client model representing async method return value.
     *
     * @param operation the operation.
     * @param bodyType the type of the response body.
     * @param isProtocolMethod whether the client method to be simplified for resilience to API changes.
     * @param settings the JavaSettings.
     * @param ignoreTypedHeaders Ignores typed headers when creating the return type, if this is set to true.
     * @return the async response type client model.
     */
    static IType createAsyncResponse(Operation operation, IType bodyType, boolean isProtocolMethod,
        JavaSettings settings, boolean ignoreTypedHeaders) {

        if (isProtocolMethod) {
            if (bodyType.equals(PrimitiveType.VOID)) {
                return mono(GenericType.Response(ClassType.VOID));
            }
            return mono(GenericType.Response(bodyType));
        }

        if (settings.isFluent()) {
            if (isLongRunningOperation(operation) && isNotNextPageOperation(operation)) {
                // LRO in fluent uses Flux<ByteBuffer> for com.azure.core.management.polling.PollerFactory
                return mono(GenericType.Response(GenericType.FLUX_BYTE_BUFFER));
            }
        }

        if (SchemaUtil.responseContainsHeaderSchemas(operation, settings)) {
            final boolean useNamedResponseType = !settings.isGenericResponseTypes();
            if (useNamedResponseType) {
                final ClassType namedResponseType = ClientMapper.getClientResponseClassType(operation,
                    ClientModels.getInstance().getModels(), settings);
                return mono(namedResponseType);
            }

            final boolean typedHeadersDisallowed = ignoreTypedHeaders || settings.isDisableTypedHeadersMethods();
            if (typedHeadersDisallowed) {
                return isByteStream(bodyType) ? mono(ClassType.STREAM_RESPONSE) : mono(GenericType.Response(bodyType));
            }

            final ObjectSchema headersSchema = ClientMapper.parseHeader(operation, settings);
            final IType headersType = Mappers.getSchemaMapper().map(headersSchema);
            // If the responseBodyType is InputStream it needs to be converted to Flux<ByteBuffer> so
            // that it is a valid return type for async method.
            final IType bType = (bodyType == ClassType.INPUT_STREAM) ? GenericType.FLUX_BYTE_BUFFER : bodyType;
            return mono(GenericType.RestResponse(headersType, bType));
        }

        if (bodyType.equals(ClassType.INPUT_STREAM)) {
            return mono(ClassType.STREAM_RESPONSE);
        }

        if (bodyType.equals(ClassType.BINARY_DATA)) {
            final boolean useInputStream
                = settings.isInputStreamForBinary() && !settings.isDataPlaneClient() && !settings.isSyncStackEnabled();
            if (useInputStream) {
                return mono(ClassType.STREAM_RESPONSE);
            }
        }

        if (bodyType.equals(PrimitiveType.VOID)) {
            return mono(GenericType.Response(ClassType.VOID));
        }

        return mono(GenericType.Response(bodyType));
    }

    /**
     * Create a response type client model representing 'WithResponse' sync method return value.
     *
     * @param operation the operation.
     * @param syncReturnType the return type.
     * @param isProtocolMethod whether the client method to be simplified for resilience to API changes.
     * @param settings the JavaSettings.
     * @param ignoreTypedHeaders Ignores typed headers when creating the return type, if this is set to true.
     * @return the async response type client model.
     */
    static IType createSyncResponse(Operation operation, IType syncReturnType, boolean isProtocolMethod,
        JavaSettings settings, boolean ignoreTypedHeaders) {

        if (isProtocolMethod) {
            return GenericType.Response(syncReturnType);
        }

        if (SchemaUtil.responseContainsHeaderSchemas(operation, settings)) {
            final boolean useNamedResponseType = !settings.isGenericResponseTypes();
            if (useNamedResponseType) {
                return ClientMapper.getClientResponseClassType(operation, ClientModels.getInstance().getModels(),
                    settings);
            }
            final boolean typedHeadersDisallowed = ignoreTypedHeaders || settings.isDisableTypedHeadersMethods();
            if (typedHeadersDisallowed) {
                return GenericType.Response(syncReturnType);
            }
            final ObjectSchema headersSchema = ClientMapper.parseHeader(operation, settings);
            final IType headersType = Mappers.getSchemaMapper().map(headersSchema);
            return GenericType.RestResponse(headersType, syncReturnType);
        }

        return GenericType.Response(syncReturnType);
    }

    private static IType mono(IType type) {
        return GenericType.Mono(type);
    }

    private static boolean isLongRunningOperation(Operation operation) {
        return operation.getExtensions() != null && operation.getExtensions().isXmsLongRunningOperation();
    }

    private static boolean isNotNextPageOperation(Operation operation) {
        return operation.getExtensions().getXmsPageable() == null
            || operation.getExtensions().getXmsPageable().getNextOperation() != operation;
    }

    private static boolean isByteStream(IType type) {
        return (type == ClassType.INPUT_STREAM) || (type == GenericType.FLUX_BYTE_BUFFER);
    }
}
