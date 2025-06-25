// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import java.util.Set;

public class Annotation {
    private static final String CLIENT_CORE_HTTP_ANNOTATIONS_PACKAGE = "io.clientcore.core.http.annotations";
    private static final String CLIENT_CORE_ANNOTATIONS_PACKAGE = "io.clientcore.core.annotations";

    public static final Annotation GENERATED
        = new Annotation.Builder().knownClass(com.azure.core.annotation.Generated.class).build();

    public static final Annotation HOST
        = new Annotation.Builder().knownClass(com.azure.core.annotation.Host.class).build();

    public static final Annotation SERVICE_INTERFACE
        = new Annotation.Builder().knownClass(com.azure.core.annotation.ServiceInterface.class).build();

    public static final Annotation SERVICE_CLIENT
        = new Annotation.Builder().knownClass(com.azure.core.annotation.ServiceClient.class).build();

    public static final Annotation SERVICE_METHOD
        = new Annotation.Builder().knownClass(com.azure.core.annotation.ServiceMethod.class).build();

    public static final Annotation SERVICE_CLIENT_BUILDER
        = new Annotation.Builder().knownClass(com.azure.core.annotation.ServiceClientBuilder.class).build();

    public static final Annotation UNEXPECTED_RESPONSE_EXCEPTION_TYPE
        = new Annotation.Builder().knownClass(com.azure.core.annotation.UnexpectedResponseExceptionType.class).build();

    public static final Annotation EXPECTED_RESPONSE
        = new Annotation.Builder().knownClass(com.azure.core.annotation.ExpectedResponses.class).build();

    public static final Annotation HEADERS
        = new Annotation.Builder().knownClass(com.azure.core.annotation.Headers.class).build();

    public static final Annotation FORM_PARAM
        = new Annotation.Builder().knownClass(com.azure.core.annotation.FormParam.class).build();

    public static final Annotation RETURN_VALUE_WIRE_TYPE
        = new Annotation.Builder().knownClass(com.azure.core.annotation.ReturnValueWireType.class).build();

    public static final Annotation RETURN_TYPE
        = new Annotation.Builder().knownClass(com.azure.core.annotation.ReturnType.class).build();

    public static final Annotation IMMUTABLE
        = new Annotation.Builder().knownClass(com.azure.core.annotation.Immutable.class).build();

    public static final Annotation FLUENT
        = new Annotation.Builder().knownClass(com.azure.core.annotation.Fluent.class).build();

    public static final Annotation HEADER_COLLECTION
        = new Annotation.Builder().knownClass(com.azure.core.annotation.HeaderCollection.class).build();

    public static final Annotation METADATA = new Annotation(CLIENT_CORE_ANNOTATIONS_PACKAGE, "Metadata");
    public static final Annotation METADATA_PROPERTIES
        = new Annotation(CLIENT_CORE_ANNOTATIONS_PACKAGE, "MetadataProperties");

    public static final Annotation HTTP_REQUEST_INFORMATION
        = new Annotation(CLIENT_CORE_HTTP_ANNOTATIONS_PACKAGE, "HttpRequestInformation");
    public static final Annotation UNEXPECTED_RESPONSE_EXCEPTION_INFORMATION
        = new Annotation(CLIENT_CORE_HTTP_ANNOTATIONS_PACKAGE, "UnexpectedResponseExceptionDetail");

    private final String fullName;
    private final String packageName;
    private final String name;

    private Annotation(String packageName, String name) {
        this.packageName = packageName;
        this.name = name;
        this.fullName = packageName + "." + name;
    }

    public final String getPackage() {
        return packageName;
    }

    public final String getName() {
        return name;
    }

    public final void addImportsTo(Set<String> imports) {
        imports.add(fullName);
    }

    public static class Builder {

        private String packageName;
        private String name;

        public Builder packageName(String packageName) {
            this.packageName = packageName;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder knownClass(Class<?> clazz) {
            this.packageName(clazz.getPackage().getName()).name(clazz.getSimpleName());

            if (!JavaSettings.getInstance().isAzureV1()) {
                this.packageName(clazz.getPackage()
                    .getName()
                    .replace(ExternalPackage.AZURE_CORE_PACKAGE_NAME, ExternalPackage.CLIENTCORE_PACKAGE_NAME)
                    .replace(ExternalPackage.AZURE_JSON_PACKAGE_NAME, ExternalPackage.CLIENTCORE_JSON_PACKAGE_NAME)
                    .replace(".annotation", ".annotations"));
            }

            return this;
        }

        public Annotation build() {
            return new Annotation(packageName, name);
        }
    }
}
