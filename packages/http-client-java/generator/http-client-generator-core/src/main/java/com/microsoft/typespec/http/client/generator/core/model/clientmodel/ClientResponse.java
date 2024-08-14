// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

/**
 * The response that is returned by a ClientMethod.
 */
public final class ClientResponse {
    private String name;
    private String packageName;
    private String description;
    private IType headersType;
    private IType bodyType;
    private String crossLanguageDefinitionId;

    private ClientResponse(String name, String packageKeyword, String description, IType headersType, IType bodyType, String crossLanguageDefinitionId) {
        this.name = name;
        packageName = packageKeyword;
        this.description = description;
        this.headersType = headersType;
        this.bodyType = bodyType;
        this.crossLanguageDefinitionId = crossLanguageDefinitionId;
    }

    public String getName() {
        return name;
    }

    public String getPackage() {
        return packageName;
    }

    public String getDescription() {
        return description;
    }

    public IType getHeadersType() {
        return headersType;
    }

    public IType getBodyType() {
        return bodyType;
    }

    public String getCrossLanguageDefinitionId() {
        return crossLanguageDefinitionId;
    }

    public static class Builder {
        private String name;
        private String packageName;
        private String description;
        private IType headersType;
        private IType bodyType;

        private String crossLanguageDefinitionId;


        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder packageName(String packageName) {
            this.packageName = packageName;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder headersType(IType headersType) {
            this.headersType = headersType;
            return this;
        }

        public Builder bodyType(IType bodyType) {
            this.bodyType = bodyType;
            return this;
        }

        public Builder crossLanguageDefinitionId(String crossLanguageDefinitionId) {
            this.crossLanguageDefinitionId = crossLanguageDefinitionId;
            return this;
        }

        public ClientResponse build() {
            return new ClientResponse(name, packageName, description, headersType, bodyType, crossLanguageDefinitionId);
        }
    }
}
