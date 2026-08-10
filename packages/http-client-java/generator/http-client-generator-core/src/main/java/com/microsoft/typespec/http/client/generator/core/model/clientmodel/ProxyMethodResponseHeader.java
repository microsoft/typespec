// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

/**
 * A response header returned by a {@link ProxyMethod}.
 */
public final class ProxyMethodResponseHeader {
    private final String serializedName;

    // Javadoc only needs the public client type. Add raw and wire types if response generation needs them in future.
    private final IType clientType;

    private final String description;

    /**
     * Creates a response header.
     *
     * @param serializedName the serialized header name.
     * @param clientType the client type of the header value.
     * @param description the header description.
     */
    public ProxyMethodResponseHeader(String serializedName, IType clientType, String description) {
        this.serializedName = serializedName;
        this.clientType = clientType;
        this.description = description;
    }

    /**
     * Gets the serialized header name.
     *
     * @return the serialized header name.
     */
    public String getSerializedName() {
        return serializedName;
    }

    /**
     * Gets the client type of the header value.
     *
     * @return the client type of the header value.
     */
    public IType getClientType() {
        return clientType;
    }

    /**
     * Gets the header description.
     *
     * @return the header description.
     */
    public String getDescription() {
        return description;
    }
}
