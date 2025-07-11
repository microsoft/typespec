// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public final class MethodPageDetails {
    private final List<ModelPropertySegment> pageItemsPropertyReference;
    private final List<ModelPropertySegment> nextLinkPropertyReference;
    private final IType lroIntermediateType;
    private final ClientMethod nextMethod;
    private final ContinuationToken continuationToken;
    private final ClientMethodParameter maxPageSizeParameter;
    private final NextLinkReInjection nextLinkReInjection;

    public MethodPageDetails(List<ModelPropertySegment> pageItemsPropertyReference,
        List<ModelPropertySegment> nextLinkPropertyReference, ClientMethod nextMethod, IType lroIntermediateType,
        ContinuationToken continuationToken, ClientMethodParameter maxPageSizeParameter,
        NextLinkReInjection nextLinkReInjectedParameterNames) {
        this.pageItemsPropertyReference = Objects.requireNonNull(pageItemsPropertyReference);
        this.nextLinkPropertyReference = nextLinkPropertyReference;
        this.lroIntermediateType = lroIntermediateType;
        this.nextMethod = nextMethod;
        this.continuationToken = continuationToken;
        this.maxPageSizeParameter = maxPageSizeParameter;
        this.nextLinkReInjection = nextLinkReInjectedParameterNames;
    }

    public String getNextLinkName() {
        if (CoreUtils.isNullOrEmpty(nextLinkPropertyReference)) {
            return null;
        }
        return nextLinkPropertyReference.get(0).getProperty().getName();
    }

    public IType getNextLinkType() {
        if (CoreUtils.isNullOrEmpty(nextLinkPropertyReference)) {
            return null;
        }
        return nextLinkPropertyReference.get(0).getProperty().getClientType();
    }

    public String getSerializedNextLinkName() {
        if (CoreUtils.isNullOrEmpty(nextLinkPropertyReference)) {
            return null;
        }
        return nextLinkPropertyReference.get(0).getProperty().getSerializedName();
    }

    public String getItemName() {
        return pageItemsPropertyReference.get(0).getProperty().getName();
    }

    public String getSerializedItemName() {
        return pageItemsPropertyReference.get(0).getProperty().getSerializedName();
    }

    public ClientMethod getNextMethod() {
        return nextMethod;
    }

    public IType getLroIntermediateType() {
        return lroIntermediateType;
    }

    public List<ModelPropertySegment> getPageItemsPropertyReference() {
        return pageItemsPropertyReference;
    }

    public List<ModelPropertySegment> getNextLinkPropertyReference() {
        return nextLinkPropertyReference;
    }

    public ContinuationToken getContinuationToken() {
        return continuationToken;
    }

    public boolean nonNullNextLink() {
        final String nextLinkName = getNextLinkName();
        return nextLinkName != null && !nextLinkName.isEmpty();
    }

    public boolean shouldHideParameter(ClientMethodParameter parameter) {
        if (continuationToken != null) {
            if (parameter == continuationToken.getClientMethodParameter()) {
                return true;
            }
        }
        if (JavaSettings.getInstance().isPageSizeEnabled()) {
            return parameter == maxPageSizeParameter;
        }
        return false;
    }

    public NextLinkReInjection getNextLinkReInjection() {
        return nextLinkReInjection;
    }

    public static final class ContinuationToken {
        private final ProxyMethodParameter requestParameter;
        private final ClientMethodParameter clientMethodParameter;
        private final String responseHeaderSerializedName;
        private final List<ModelPropertySegment> responsePropertyReference;

        public ContinuationToken(ProxyMethodParameter requestParameter, ClientMethodParameter clientMethodParameter,
            String responseHeaderSerializedName, List<ModelPropertySegment> responsePropertyReference) {
            this.requestParameter = requestParameter;
            this.clientMethodParameter = clientMethodParameter;
            this.responseHeaderSerializedName = responseHeaderSerializedName;
            this.responsePropertyReference = responsePropertyReference;
        }

        public ProxyMethodParameter getRequestParameter() {
            return requestParameter;
        }

        public ClientMethodParameter getClientMethodParameter() {
            return clientMethodParameter;
        }

        public List<ModelPropertySegment> getResponsePropertyReference() {
            return responsePropertyReference;
        }

        public String getResponseHeaderSerializedName() {
            return responseHeaderSerializedName;
        }
    }

    /**
     * Represents the nextLink re-injected parameters for paging. Legacy feature.
     * Only query parameters are included.
     */
    public static final class NextLinkReInjection {
        private final List<String> queryParameterSerializedNames;

        public NextLinkReInjection(List<String> queryParameterNames) {
            this.queryParameterSerializedNames = Collections.unmodifiableList(queryParameterNames);
        }

        public List<String> getQueryParameterSerializedNames() {
            return queryParameterSerializedNames;
        }
    }
}
