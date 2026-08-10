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

    private ProxyMethodResponseHeader(String serializedName, IType clientType, String description) {
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

    /**
     * Builder for {@link ProxyMethodResponseHeader}.
     */
    public static final class Builder {
        private String serializedName;
        private IType clientType;
        private String description;

        /**
         * Sets the serialized header name.
         *
         * @param serializedName the serialized header name.
         * @return the Builder itself.
         */
        public Builder serializedName(String serializedName) {
            this.serializedName = serializedName;
            return this;
        }

        /**
         * Sets the client type of the header value.
         *
         * @param clientType the client type of the header value.
         * @return the Builder itself.
         */
        public Builder clientType(IType clientType) {
            this.clientType = clientType;
            return this;
        }

        /**
         * Sets the header description.
         *
         * @param description the header description.
         * @return the Builder itself.
         */
        public Builder description(String description) {
            this.description = description;
            return this;
        }

        /**
         * Builds the response header.
         *
         * @return the response header.
         */
        public ProxyMethodResponseHeader build() {
            return new ProxyMethodResponseHeader(serializedName, clientType, description);
        }
    }
}
