// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.PageableContinuationToken;
import com.microsoft.typespec.http.client.generator.core.mapper.ProxyParameterMapper;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import java.util.ArrayList;
import java.util.List;

/**
 * A page class that contains results that are received from a service request.
 */
public final class MethodPageDetails {
    /**
     * Get whether or not this method is a request to get the next page of a sequence of pages.
     */
    private final ModelPropertySegment nextLinkPropertyReference;
    private final ModelPropertySegment itemPropertyReference;

    private final ClientMethod nextMethod;

    // Proxy method return type is Flux<ByteBuffer>. Client method return type is PagedResponse<>.
    // This intermediate type is the type of pagination response (the type with values and nextLink).
    private final IType lroIntermediateType;

    public static final class ContinuationToken {
        private final ProxyMethodParameter requestParameter;
        private final List<ModelPropertySegment> responsePropertyReference;
        private final String responseHeaderSerializedName;

        private ContinuationToken(PageableContinuationToken continuationToken, IType responseBodyType) {
            this.requestParameter = ProxyParameterMapper.getInstance().map(continuationToken.getParameter());
            this.responseHeaderSerializedName = continuationToken.getResponseHeader() == null
                ? null
                : continuationToken.getResponseHeader().getHeader();

            List<ModelPropertySegment> responsePropertyReference = null;
            if (continuationToken.getResponseProperty() != null) {
                responsePropertyReference = new ArrayList<>();
                IType modelType = responseBodyType;
                for (Property p : continuationToken.getResponseProperty()) {
                    ModelPropertySegment segment
                        = ClientModelUtil.getModelPropertySegment(modelType, p.getSerializedName());
                    if (segment != null) {
                        responsePropertyReference.add(segment);
                    } else {
                        throw new RuntimeException(
                            String.format("Property of serialized name '%s' is not found in model '%s'.",
                                p.getSerializedName(), modelType.toString()));
                    }

                    modelType = segment.getProperty().getClientType();
                }
            }
            this.responsePropertyReference = responsePropertyReference;
        }

        public static ContinuationToken fromContinuationToken(PageableContinuationToken continuationToken,
            IType responseBodyType) {
            return continuationToken == null ? null : new ContinuationToken(continuationToken, responseBodyType);
        }

        public ProxyMethodParameter getRequestParameter() {
            return requestParameter;
        }

        public List<ModelPropertySegment> getResponsePropertyReference() {
            return responsePropertyReference;
        }

        public String getResponseHeaderSerializedName() {
            return responseHeaderSerializedName;
        }
    }

    private ContinuationToken continuationToken;

    public MethodPageDetails(ModelPropertySegment itemPropertyReference, ModelPropertySegment nextLinkPropertyReference,
        ClientMethod nextMethod, IType lroIntermediateType, ContinuationToken continuationToken) {
        this.itemPropertyReference = itemPropertyReference;
        this.nextLinkPropertyReference = nextLinkPropertyReference;
        this.nextMethod = nextMethod;
        this.lroIntermediateType = lroIntermediateType;
        this.continuationToken = continuationToken;
    }

    public String getNextLinkName() {
        return nextLinkPropertyReference == null ? null : nextLinkPropertyReference.getProperty().getName();
    }

    public IType getNextLinkType() {
        return nextLinkPropertyReference == null ? null : nextLinkPropertyReference.getProperty().getClientType();
    }

    public String getSerializedNextLinkName() {
        return nextLinkPropertyReference.getProperty().getSerializedName();
    }

    public String getItemName() {
        return itemPropertyReference == null ? null : itemPropertyReference.getProperty().getName();
    }

    public String getSerializedItemName() {
        return itemPropertyReference == null ? null : itemPropertyReference.getProperty().getSerializedName();
    }

    public ClientMethod getNextMethod() {
        return nextMethod;
    }

    public IType getLroIntermediateType() {
        return lroIntermediateType;
    }

    public boolean nonNullNextLink() {
        return getNextLinkName() != null && !getNextLinkName().isEmpty();
    }

    public ContinuationToken getContinuationToken() {
        return continuationToken;
    }
}
