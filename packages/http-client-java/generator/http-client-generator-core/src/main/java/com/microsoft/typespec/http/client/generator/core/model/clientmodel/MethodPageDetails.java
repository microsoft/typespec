// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

/**
 * A page class that contains results that are received from a service request.
 */
public class MethodPageDetails {
    /**
     * Get whether or not this method is a request to get the next page of a sequence of pages.
     */
    private final String nextLinkName;
    private final IType nextLinkType;

    private final String itemName;

    /**
     * Serialized nextLink name. It is the name in swagger and in response.
     */
    private final String serializedNextLinkName;
    /**
     * Serialized item name. It is the name in swagger and in response.
     */
    private final String serializedItemName;

    private final ClientMethod nextMethod;

    // Proxy method return type is Flux<ByteBuffer>. Client method return type is PagedResponse<>.
    // This intermediate type is the type of pagination response (the type with values and nextLink).
    private final IType lroIntermediateType;

    public MethodPageDetails(String nextLinkName, IType nextLinkType, String itemName, ClientMethod nextMethod, IType lroIntermediateType,
                             String serializedNextLinkName, String serializedItemName) {
        this.nextLinkName = nextLinkName;
        this.nextLinkType = nextLinkType;
        this.itemName = itemName;
        this.nextMethod = nextMethod;
        this.lroIntermediateType = lroIntermediateType;
        this.serializedNextLinkName = serializedNextLinkName;
        this.serializedItemName = serializedItemName;
    }

    public String getNextLinkName() {
        return nextLinkName;
    }

    public IType getNextLinkType() {
        return nextLinkType;
    }

    public String getSerializedNextLinkName() {
        return serializedNextLinkName;
    }

    public String getItemName() {
        return itemName;
    }

    public String getSerializedItemName() {
        return serializedItemName;
    }

    public ClientMethod getNextMethod() {
        return nextMethod;
    }

    public IType getLroIntermediateType() {
        return lroIntermediateType;
    }

    public boolean nonNullNextLink() {
        return nextLinkName != null && !nextLinkName.isEmpty();
    }
}
