// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.List;
import java.util.Objects;

public final class MethodPageDetails {
    private final ModelPropertySegment nextLinkPropertyReference;
    private final ModelPropertySegment itemPropertyReference;
    private final IType lroIntermediateType;
    private final ClientMethod nextMethod;
    private final ContinuationToken continuationToken;

    public MethodPageDetails(ModelPropertySegment itemPropertyReference, ModelPropertySegment nextLinkPropertyReference,
        ClientMethod nextMethod, IType lroIntermediateType, ContinuationToken continuationToken) {
        this.itemPropertyReference = Objects.requireNonNull(itemPropertyReference);
        this.nextLinkPropertyReference = nextLinkPropertyReference;
        this.lroIntermediateType = lroIntermediateType;
        this.nextMethod = nextMethod;
        this.continuationToken = continuationToken;
    }

    public String getNextLinkName() {
        if (nextLinkPropertyReference == null) {
            return null;
        }
        return nextLinkPropertyReference.getProperty().getName();
    }

    public IType getNextLinkType() {
        if (nextLinkPropertyReference == null) {
            return null;
        }
        return nextLinkPropertyReference.getProperty().getClientType();
    }

    public String getSerializedNextLinkName() {
        if (nextLinkPropertyReference == null) {
            return null;
        }
        return nextLinkPropertyReference.getProperty().getSerializedName();
    }

    public String getItemName() {
        return itemPropertyReference.getProperty().getName();
    }

    public String getSerializedItemName() {
        return itemPropertyReference.getProperty().getSerializedName();
    }

    public ClientMethod getNextMethod() {
        return nextMethod;
    }

    public IType getLroIntermediateType() {
        return lroIntermediateType;
    }

    public ContinuationToken getContinuationToken() {
        return continuationToken;
    }

    public boolean nonNullNextLink() {
        return getNextLinkName() != null && !getNextLinkName().isEmpty();
    }

    public static final class ContinuationToken {
        private final ProxyMethodParameter requestParameter;
        private final String responseHeaderSerializedName;
        private final List<ModelPropertySegment> responsePropertyReference;

        public ContinuationToken(ProxyMethodParameter requestParameter, String responseHeaderSerializedName,
            List<ModelPropertySegment> responsePropertyReference) {
            this.requestParameter = requestParameter;
            this.responseHeaderSerializedName = responseHeaderSerializedName;
            this.responsePropertyReference = responsePropertyReference;
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
}
