// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.PageableContinuationToken;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsPageable;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelPropertySegment;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

/**
 * Type that parses and holds pagination metadata of an {@link Operation}, and exposes a view of the metadata as
 * {@link MethodPageDetails}.
 */
final class PagingMetadata {
    private final Operation operation;
    private final Operation nextOperation;
    private final ModelPropertySegment itemPropertyReference;
    private final ModelPropertySegment nextLinkPropertyReference;
    private final IType lroPollResultType;
    private final List<ClientMethod> nextMethods;
    private final ClientMethodParameter maxPageSizeParameter;
    private final MethodPageDetails.ContinuationToken continuationToken;

    /**
     * Creates paging meta data for an {@link Operation}.
     *
     * @param operation the operation to create the paging metadata for.
     * @param parametersDetails the details about all parameters of the page api.
     * @param proxyMethod the proxy method representing the page api.
     * @param settings the java settings.
     *
     * @return the paged metadata, or {@code null} if the {@code operation} is not a pageable operation.
     */
    static PagingMetadata create(Operation operation, ProxyMethod proxyMethod,
        ClientMethodParametersDetails parametersDetails, JavaSettings settings) {
        if (!operation.isPageable()) {
            return null;
        }
        final XmsPageable xmsPageable = operation.getExtensions().getXmsPageable();
        final IType responseType = proxyMethod.getResponseType();

        final ModelPropertySegment itemPropertyReference = getPageableItem(xmsPageable, responseType);
        if (itemPropertyReference == null) {
            // No PagingMetadata to create if operation has no pageable-item property.
            return null;
        }
        final ModelPropertySegment nextLinkPropertyReference = getPageableNextLink(xmsPageable, responseType);
        final Operation nextOperation = xmsPageable.getNextOperation();
        final IType lroPollResultType;
        if (operation.isLro() && nextOperation != operation) {
            // For a paging Operation, the ProxyMethod return type is Flux<ByteBuffer> and ClientMethod return type is
            // PagedResponse<>. The 'lroIntermediateType' is the type of pagination response - the type with values and
            // nextLink.
            lroPollResultType = SchemaUtil.getOperationResponseType(operation, settings);
        } else {
            lroPollResultType = null;
        }

        final List<ClientMethod> nextMethods;
        if (nextOperation != null && nextOperation != operation) {
            nextMethods = Mappers.getClientMethodMapper().map(nextOperation);
        } else {
            nextMethods = Collections.emptyList();
        }

        final MethodPageDetails.ContinuationToken continuationToken
            = getContinuationToken(xmsPageable, responseType, parametersDetails);
        final ClientMethodParameter maxPageSizeParameter = getPageSizeClientMethodParameter(parametersDetails);

        return new PagingMetadata(operation, nextOperation, itemPropertyReference, nextLinkPropertyReference,
            nextMethods, lroPollResultType, continuationToken, maxPageSizeParameter);
    }

    boolean isMethodForNextPage() {
        return operation == nextOperation;
    }

    /**
     * Gets the view of the paging metadata as {@link MethodPageDetails}.
     * <p>
     * The resulting {@link MethodPageDetails} is used for pageable {@link ClientMethod} without context parameter.
     * </p>
     *
     * @param isSync {@code true} when metadata is used for synchronous {@link ClientMethod}, {@code false} for async.
     * @return the page metadata.
     */
    MethodPageDetails asMethodPageDetails(boolean isSync) {
        final ClientMethodType nextMethodType = nextMethodType(isSync);
        final ClientMethod nextMethod = enumerateNextMethodsOfType(nextMethodType).findFirst().orElse(null);
        return new MethodPageDetails(itemPropertyReference, nextLinkPropertyReference, nextMethod, lroPollResultType,
            continuationToken, maxPageSizeParameter);
    }

    /**
     * Gets the view of the paging metadata as {@link MethodPageDetails} to use for paging apis.
     * <p>
     * The resulting {@link MethodPageDetails} is used for pageable {@link ClientMethod} with context parameter.
     * </p>
     *
     * @param isSync {@code true} when metadata is used for synchronous {@link ClientMethod}, {@code false} for async.
     * @param contextParameter the context parameter.
     * @return the page metadata.
     */
    MethodPageDetails asMethodPageDetailsForContext(boolean isSync, final ClientMethodParameter contextParameter) {
        if (nextMethods.isEmpty()) {
            return null;
        }
        final ClientMethodType nextMethodType = nextMethodType(isSync);
        final IType contextWireType = contextParameter.getWireType();
        // Find the nextMethod with context parameter.
        final ClientMethod nextMethodWithContext
            = enumerateNextMethodsOfType(nextMethodType).filter(cm -> cm.hasMethodParameterOfType(contextWireType))
                .findFirst()
                .orElse(null);
        if (nextMethodWithContext == null) {
            return null;
        }
        return new MethodPageDetails(itemPropertyReference, nextLinkPropertyReference, nextMethodWithContext,
            lroPollResultType, continuationToken, maxPageSizeParameter);
    }

    private static ModelPropertySegment getPageableItem(XmsPageable xmsPageable, IType responseType) {
        return ClientModelUtil.getModelPropertySegment(responseType, xmsPageable.getItemName());
    }

    private static ModelPropertySegment getPageableNextLink(XmsPageable xmsPageable, IType responseBodyType) {
        return ClientModelUtil.getModelPropertySegment(responseBodyType, xmsPageable.getNextLinkName());
    }

    /**
     * Inspects the given {@link ClientMethodParametersDetails} for a code model query {@link Parameter} representing
     * the page size (commonly named "maxpagesize" or "maxPageSize"), and returns the corresponding
     * {@link ClientMethodParameter}.
     *
     * @param parametersDetails the {@link ClientMethodParametersDetails} to inspect.
     * @return the {@link ClientMethodParameter} representing the page size, or {@code null} if not found.
     */
    private static ClientMethodParameter
        getPageSizeClientMethodParameter(ClientMethodParametersDetails parametersDetails) {
        return parametersDetails.getParameterTuples().filter(t -> {
            final Parameter cmParameter = t.codeModelParameter;
            final Protocols protocol = cmParameter.getProtocol();
            final boolean isQuery = protocol != null
                && protocol.getHttp() != null
                && protocol.getHttp().getIn() == RequestParameterLocation.QUERY;
            if (!isQuery) {
                return false;
            }
            final String serializedName = cmParameter.getLanguage().getDefault().getSerializedName();
            if (Objects.equals(serializedName, "maxpagesize")) {
                return true;
            }
            //
            // Note: The below fallback logic using Java name exists because, according to the REST API Guidelines for
            // Swagger, the standard query parameter name for page size is "maxpagesize".
            // However, some services were designed before this guideline and may use a different serialized name (e.g.,
            // "$maxpagesize" or "maxPageSize").
            // In such cases, spec authors were instructed to add directive to make it "maxpagesize" that produces
            // "maxPageSize" Java name in the SDK.
            //
            final String javaName = SchemaUtil.getJavaName(cmParameter);
            return Objects.equals(javaName, "maxPageSize");
        }).map(t -> t.clientMethodParameter).findFirst().orElse(null);
    }

    private static MethodPageDetails.ContinuationToken getContinuationToken(XmsPageable xmsPageable,
        IType responseBodyType, ClientMethodParametersDetails parametersDetails) {
        final PageableContinuationToken rawContinuationToken = xmsPageable.getContinuationToken();
        if (rawContinuationToken == null) {
            return null;
        }

        final Parameter codeModelParameter = rawContinuationToken.getParameter();
        final ClientMethodParameter clientMethodParameter
            = parametersDetails.getClientMethodParameter(codeModelParameter);
        final ProxyMethodParameter requestParameter = ProxyParameterMapper.getInstance().map(codeModelParameter);
        final String responseHeaderSerializedName;
        if (rawContinuationToken.getResponseHeader() != null) {
            responseHeaderSerializedName = rawContinuationToken.getResponseHeader().getHeader();
        } else {
            responseHeaderSerializedName = null;
        }

        final List<ModelPropertySegment> responsePropertyReference;
        final List<Property> responseProperties = rawContinuationToken.getResponseProperty();
        if (responseProperties != null) {
            responsePropertyReference = new ArrayList<>(responseProperties.size());
            IType modelType = responseBodyType;
            for (Property p : responseProperties) {
                final ModelPropertySegment segment
                    = ClientModelUtil.getModelPropertySegment(modelType, p.getSerializedName());
                if (segment == null) {
                    throw new RuntimeException(
                        String.format("Property of serialized name '%s' is not found in model '%s'.",
                            p.getSerializedName(), modelType));
                }
                responsePropertyReference.add(segment);
                modelType = segment.getProperty().getClientType();
            }
        } else {
            responsePropertyReference = null;
        }

        return new MethodPageDetails.ContinuationToken(requestParameter, clientMethodParameter,
            responseHeaderSerializedName, responsePropertyReference);
    }

    private Stream<ClientMethod> enumerateNextMethodsOfType(ClientMethodType nextMethodType) {
        return nextMethods.stream().filter(m -> m.getType() == nextMethodType);
    }

    private static ClientMethodType nextMethodType(boolean isSync) {
        return isSync ? ClientMethodType.PagingSyncSinglePage : ClientMethodType.PagingAsyncSinglePage;
    }

    private PagingMetadata(Operation operation, Operation nextOperation, ModelPropertySegment itemPropertyReference,
        ModelPropertySegment nextLinkPropertyReference, List<ClientMethod> nextMethods, IType lroPollResultType,
        MethodPageDetails.ContinuationToken continuationToken, ClientMethodParameter maxPageSizeParameter) {
        this.operation = operation;
        this.nextOperation = nextOperation;
        this.itemPropertyReference = itemPropertyReference;
        this.nextLinkPropertyReference = nextLinkPropertyReference;
        this.nextMethods = nextMethods;
        this.lroPollResultType = lroPollResultType;
        this.continuationToken = continuationToken;
        this.maxPageSizeParameter = maxPageSizeParameter;
    }
}
