// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Experimental;

/**
 * Metadata associated with a generated API.
 */
public final class ApiMetadata {
    private final String crossLanguageDefinitionId;
    private final String devMessage;
    private final Experimental experimental;

    private ApiMetadata(String crossLanguageDefinitionId, String devMessage, Experimental experimental) {
        this.crossLanguageDefinitionId = crossLanguageDefinitionId;
        this.devMessage = devMessage;
        this.experimental = experimental;
    }

    /**
     * Gets the cross-language definition ID.
     *
     * @return the cross-language definition ID.
     */
    public String getCrossLanguageDefinitionId() {
        return crossLanguageDefinitionId;
    }

    /**
     * Gets the message for SDK developers.
     *
     * @return the message for SDK developers.
     */
    public String getDevMessage() {
        return devMessage;
    }

    /**
     * Gets the experimental API metadata.
     *
     * @return the experimental API metadata.
     */
    public Experimental getExperimental() {
        return experimental;
    }

    /**
     * Creates a builder initialized with this metadata.
     *
     * @return the initialized builder.
     */
    public Builder newBuilder() {
        return new Builder().crossLanguageDefinitionId(crossLanguageDefinitionId)
            .devMessage(devMessage)
            .experimental(experimental);
    }

    /**
     * Builder for {@link ApiMetadata}.
     */
    public static final class Builder {
        private String crossLanguageDefinitionId;
        private String devMessage;
        private Experimental experimental;

        /**
         * Sets the cross-language definition ID.
         *
         * @param crossLanguageDefinitionId the cross-language definition ID.
         * @return this builder.
         */
        public Builder crossLanguageDefinitionId(String crossLanguageDefinitionId) {
            this.crossLanguageDefinitionId = crossLanguageDefinitionId;
            return this;
        }

        /**
         * Sets the message for SDK developers.
         *
         * @param devMessage the message for SDK developers.
         * @return this builder.
         */
        public Builder devMessage(String devMessage) {
            this.devMessage = devMessage;
            return this;
        }

        /**
         * Sets the experimental API metadata.
         *
         * @param experimental the experimental API metadata.
         * @return this builder.
         */
        public Builder experimental(Experimental experimental) {
            this.experimental = experimental;
            return this;
        }

        /**
         * Builds the API metadata.
         *
         * @return the API metadata.
         */
        public ApiMetadata build() {
            return new ApiMetadata(crossLanguageDefinitionId, devMessage, experimental);
        }
    }
}
