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
 * A factory to create the response type client model representing async method's return value.
 */
final class AsyncResponseTypeFactory {
    private AsyncResponseTypeFactory() {
    }

    /**
     * Create a response type client model (representing an async method return value).
     *
     * @param operation the operation.
     * @param responseBodyType the type of the response body.
     * @param isProtocolMethod whether the client method to be simplified for resilience to API changes.
     * @param settings the JavaSettings.
     * @param ignoreTypedHeaders Ignores typed headers when creating the return type, if this is set to true.
     * @return the response type client model.
     */
    static IType create(Operation operation, IType responseBodyType, boolean isProtocolMethod, JavaSettings settings,
        boolean ignoreTypedHeaders) {

        if (isProtocolMethod) {
            if (responseBodyType.equals(PrimitiveType.VOID)) {
                return singleValueAsyncReturnType(GenericType.Response(ClassType.VOID));
            }
            return singleValueAsyncReturnType(GenericType.Response(responseBodyType));
        }

        if (settings.isFluent()) {
            if (isLongRunningOperation(operation) && isNotPagingOperation(operation)) {
                // LRO in fluent uses Flux<ByteBuffer> for PollerFactory in 'com.azure:azure-core-management'
                return binaryContentAsyncReturnType();
            }
        }

        if (SchemaUtil.responseContainsHeaderSchemas(operation, settings)) {
            final boolean genericResponsesDisallowed = !settings.isGenericResponseTypes();
            if (genericResponsesDisallowed) {
                final ClassType clientResponseClassType = ClientMapper.getClientResponseClassType(operation,
                    ClientModels.getInstance().getModels(), settings);
                return clientResponseAsyncReturnType(clientResponseClassType);
            }
            // produce generic response type.
            //
            final boolean typedHeadersAllowed = !ignoreTypedHeaders && !settings.isDisableTypedHeadersMethods();
            if (typedHeadersAllowed) {
                // If the response body type is InputStream it needs to be converted to Flux<ByteBuffer> so
                // that it is a valid return type for async method.
                final IType bodyType
                    = (responseBodyType == ClassType.INPUT_STREAM) ? GenericType.FLUX_BYTE_BUFFER : responseBodyType;
                final ObjectSchema headersSchema = ClientMapper.parseHeader(operation, settings);
                final IType headersType = Mappers.getSchemaMapper().map(headersSchema);
                return singleValueAsyncReturnType(GenericType.RestResponse(headersType, bodyType));
            }
            return isByteStream(responseBodyType)
                ? streamContentAsyncReturnType()
                : singleValueAsyncReturnType(GenericType.Response(responseBodyType));
        }

        if (responseBodyType.equals(ClassType.INPUT_STREAM)) {
            return streamContentAsyncReturnType();
        }

        if (responseBodyType.equals(ClassType.BINARY_DATA)) {
            final boolean streamAllowed
                = settings.isInputStreamForBinary() && !settings.isDataPlaneClient() && !settings.isSyncStackEnabled();
            if (streamAllowed) {
                return streamContentAsyncReturnType();
            }
        }

        if (responseBodyType.equals(PrimitiveType.VOID)) {
            return singleValueAsyncReturnType(GenericType.Response(ClassType.VOID));
        }

        return singleValueAsyncReturnType(GenericType.Response(responseBodyType));
    }

    private static IType singleValueAsyncReturnType(IType singleValueType) {
        return GenericType.Mono(singleValueType);
    }

    private static IType clientResponseAsyncReturnType(ClassType clientResponseClassType) {
        return GenericType.Mono(clientResponseClassType);
    }

    private static IType streamContentAsyncReturnType() {
        return GenericType.Mono(ClassType.STREAM_RESPONSE);
    }

    private static IType binaryContentAsyncReturnType() {
        // raw response for LRO
        return GenericType.Mono(GenericType.Response(GenericType.FLUX_BYTE_BUFFER));
    }

    private static boolean isLongRunningOperation(Operation operation) {
        return operation.getExtensions() != null && operation.getExtensions().isXmsLongRunningOperation();
    }

    private static boolean isNotPagingOperation(Operation operation) {
        return operation.getExtensions().getXmsPageable() == null
            || !(operation.getExtensions().getXmsPageable().getNextOperation() == operation);
    }

    private static boolean isByteStream(IType type) {
        return (type == ClassType.INPUT_STREAM) || (type == GenericType.FLUX_BYTE_BUFFER);
    }
}
