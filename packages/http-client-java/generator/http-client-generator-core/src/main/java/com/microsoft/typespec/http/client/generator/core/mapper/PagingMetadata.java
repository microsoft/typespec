// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsPageable;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelPropertySegment;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import java.util.Collections;
import java.util.List;
import java.util.stream.Stream;

final class PagingMetadata {
    private final Operation operation;
    private final Operation nextOperation;
    private final ModelPropertySegment itemPropertyReference;
    private final ModelPropertySegment nextLinkPropertyReference;
    private final List<ClientMethod> nextMethods;
    private final IType lroIntermediateType;
    private final MethodPageDetails.ContinuationToken continuationToken;

    static PagingMetadata create(Operation operation, ProxyMethod proxyMethod, JavaSettings settings) {
        assert operation != null && operation.isPageable();
        final XmsPageable xmsPageable = operation.getExtensions().getXmsPageable();
        final IType responseType = proxyMethod.getResponseType();
        final ModelPropertySegment itemPropertyReference = getPageableItem(xmsPageable, responseType);
        if (itemPropertyReference == null) {
            // No PagingMetadata to create if no pageable item-name for this operation.
            return null;
        }
        final ModelPropertySegment nextLinkPropertyReference = getPageableNextLink(xmsPageable, responseType);
        final Operation nextOperation = xmsPageable.getNextOperation();
        final List<ClientMethod> nextMethods;
        if (nextOperation != null && nextOperation != operation) {
            nextMethods = Mappers.getClientMethodMapper().map(nextOperation);
        } else {
            nextMethods = Collections.emptyList();
        }
        final IType lroIntermediateType;
        if (operation.isLro() && nextOperation != operation) {
            lroIntermediateType = SchemaUtil.getOperationResponseType(operation, settings);
        } else {
            lroIntermediateType = null;
        }
        final MethodPageDetails.ContinuationToken continuationToken = MethodPageDetails.ContinuationToken
            .fromContinuationToken(xmsPageable.getContinuationToken(), responseType);

        return new PagingMetadata(operation, nextOperation, itemPropertyReference, nextLinkPropertyReference,
            nextMethods, lroIntermediateType, continuationToken);
    }

    boolean isNextMethod() {
        return operation == nextOperation;
    }

    MethodPageDetails asMethodPageDetails(boolean isSync) {
        final ClientMethodType nextMethodType = nextMethodType(isSync);
        final ClientMethod nextMethod = enumerateNextMethodsOfType(nextMethodType).findFirst().orElse(null);
        return new MethodPageDetails(itemPropertyReference, nextLinkPropertyReference, nextMethod, lroIntermediateType,
            continuationToken);
    }

    MethodPageDetails asMethodPageDetailsForContext(boolean isSync, final ClientMethodParameter contextParameter) {
        if (nextMethods.isEmpty()) {
            return null;
        }
        final ClientMethodType nextMethodType = nextMethodType(isSync);
        final IType contextWireType = contextParameter.getWireType();
        // Match to the nextMethod with Context
        final ClientMethod nextMethodWithContext
            = enumerateNextMethodsOfType(nextMethodType).filter(cm -> cm.hasMethodParameterOfType(contextWireType))
                .findFirst()
                .orElse(null);
        if (nextMethodWithContext == null) {
            return null;
        }
        return new MethodPageDetails(itemPropertyReference, nextLinkPropertyReference, nextMethodWithContext,
            lroIntermediateType, continuationToken);
    }

    private Stream<ClientMethod> enumerateNextMethodsOfType(ClientMethodType nextMethodType) {
        return nextMethods.stream().filter(m -> m.getType() == nextMethodType);
    }

    private static ModelPropertySegment getPageableItem(XmsPageable xmsPageable, IType responseType) {
        return ClientModelUtil.getModelPropertySegment(responseType, xmsPageable.getItemName());
    }

    private static ModelPropertySegment getPageableNextLink(XmsPageable xmsPageable, IType responseBodyType) {
        return ClientModelUtil.getModelPropertySegment(responseBodyType, xmsPageable.getNextLinkName());
    }

    private static ClientMethodType nextMethodType(boolean isSync) {
        return isSync ? ClientMethodType.PagingSyncSinglePage : ClientMethodType.PagingAsyncSinglePage;
    }

    private PagingMetadata(Operation operation, Operation nextOperation, ModelPropertySegment itemPropertyReference,
        ModelPropertySegment nextLinkPropertyReference, List<ClientMethod> nextMethods, IType lroIntermediateType,
        MethodPageDetails.ContinuationToken continuationToken) {
        this.operation = operation;
        this.nextOperation = nextOperation;
        this.itemPropertyReference = itemPropertyReference;
        this.nextLinkPropertyReference = nextLinkPropertyReference;
        this.nextMethods = nextMethods;
        this.lroIntermediateType = lroIntermediateType;
        this.continuationToken = continuationToken;
    }
}
