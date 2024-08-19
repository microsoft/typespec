// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.azure.core.http.rest.PagedFlux;
import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.Response;
import com.azure.core.util.polling.PollerFlux;
import com.azure.core.util.polling.SyncPoller;
import reactor.core.publisher.Mono;

public class ReturnTypeDescriptionAssembler {

    /**
     * Assemble description for return types.
     * @param description   parsed swagger description of the returnType, either from operation description, or schema itself
     * @param returnType    actual returnType that needs documentation
     * @param baseType      baseType of the returnType
     * @return  assembled description
     */
    public static String assemble(String description, IType returnType, IType baseType) {
        return (returnType instanceof GenericType)
            ? assembleForGeneric(description, (GenericType) returnType, baseType)
            : description;
    }

    private static String assembleForGeneric(String description, GenericType returnType, IType baseType) {
        if (TypeUtil.isGenericTypeClassSubclassOf(returnType, Mono.class)) {
            return assembleForMono(description, returnType, baseType);
        } else if (TypeUtil.isGenericTypeClassSubclassOf(returnType, Response.class)) {
            return assembleForResponse(description, returnType, baseType);
        } else if (TypeUtil.isGenericTypeClassSubclassOf(returnType, PagedIterable.class, PagedFlux.class)) {
            return assembleForPagination(description, returnType);
        } else if (TypeUtil.isGenericTypeClassSubclassOf(returnType, SyncPoller.class, PollerFlux.class)) {
            return assembleForPoller(description, returnType);
        }

        return description;
    }

    /*
    Mono<Void> - A {@link Mono} that completes when a successful response is received
    Mono<Response<?>> - "Response return type description" on successful completion of {@link Mono}
    Mono<T> - "something" on successful completion of {@link Mono} (something here is the description in the operation)
    Mono<OtherType> - the response body on successful completion of {@link Mono}
     */
    private static String assembleForMono(String description, GenericType returnType, IType baseType) {
        if (TypeUtil.isGenericTypeClassSubclassOf(returnType.getTypeArguments()[0], Response.class)) { // Mono<Response<?>>
            return assembleForResponse(description, (GenericType) returnType.getTypeArguments()[0], baseType)
                + " on successful completion of {@link Mono}";
        } else {
            if (description == null) {
                if (ClassType.VOID == baseType.asNullable()) { // Mono<Void>
                    return "A {@link " + returnType.getName() + "} that completes when a successful response is received";
                } else { // Mono<OtherType>
                    return  "the response body on successful completion of {@link " + returnType.getName() + "}";
                }
            } else { // Mono<T>
                return description + " on successful completion of {@link " + returnType.getName() + "}";
            }
        }
    }

    /*
    Response<Void> - the {@link Response}
    Response<T> - "something" along with {@link Response}
    Response<OtherType> - the response body along with {@link Response}
     */
    private static String assembleForResponse(String description, GenericType returnType, IType baseType) {
        if (description == null) {
            if (ClassType.VOID == baseType.asNullable()) { // Response<Void>
                return "the {@link " + returnType.getName() + "}";
            } else { // Response<OtherType>
                return "the response body along with {@link " + returnType.getName() + "}";
            }
        } else { // Response<T>
            return description + " along with {@link " + returnType.getName() + "}";
        }
    }

    /*
    PagedIterable<T> - "something" as paginated response with {@link PagedIterable}
    PagedIterable<OtherType> - the paginated response with {@link PagedIterable}
     */
    private static String assembleForPagination(String description, GenericType returnType) {
        if (description == null) {
            return "the paginated response with {@link " + returnType.getName() + "}";
        } else { // Response<T>
            return description + " as paginated response with {@link " + returnType.getName() + "}";
        }
    }

    /*
    SyncPoller<S, T> - the {@link SyncPoller} for polling of "something"
    SyncPoller<S, OtherType> - the {@link SyncPoller} for polling of long-running operation
     */
    private static String assembleForPoller(String description, GenericType returnType) {
        if (description == null) {
            return "the {@link " + returnType.getName() + "} for polling of long-running operation";
        } else { // Response<T>
            return "the {@link " + returnType.getName() + "} for polling of " + description;
        }
    }
}
