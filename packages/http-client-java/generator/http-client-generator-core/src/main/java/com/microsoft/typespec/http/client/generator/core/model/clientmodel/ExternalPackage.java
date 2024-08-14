// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;

public class ExternalPackage {

    public static final String CLIENTCORE_PACKAGE_NAME = "io.clientcore.core";
    public static final String CLIENTCORE_JSON_PACKAGE_NAME = "io.clientcore.core.json";

    public static final String AZURE_CORE_PACKAGE_NAME = "com.azure.core";
    public static final String AZURE_JSON_PACKAGE_NAME = "com.azure.json";

    public static final ExternalPackage CORE = new Builder().packageName(CLIENTCORE_PACKAGE_NAME)
        .groupId("io.clientcore")
        .artifactId("core")
        .build();

    public static final ExternalPackage JSON = new Builder().packageName(CLIENTCORE_JSON_PACKAGE_NAME)
        .groupId("io.clientcore")
        .artifactId("core-json")
        .build();

    private final String packageName;
    private final String groupId;
    private final String artifactId;

    private ExternalPackage(String packageName, String groupId, String artifactId) {
        this.packageName = packageName;
        this.groupId = groupId;
        this.artifactId = artifactId;
    }

    public String getPackageName() {
        return packageName;
    }

    public String getGroupId() {
        return groupId;
    }

    public String getArtifactId() {
        return artifactId;
    }

    public static final class Builder {
        private String packageName;
        private String groupId;
        private String artifactId;

        public Builder() {
        }

        public Builder packageName(String packageName) {
            this.packageName = packageName;
            return this;
        }

        public Builder groupId(String groupId) {
            this.groupId = groupId;
            return this;
        }

        public Builder artifactId(String artifactId) {
            this.artifactId = artifactId;
            return this;
        }

        public ExternalPackage build() {
            if (JavaSettings.getInstance().isBranded()) {
                switch (packageName) {
                    case CLIENTCORE_PACKAGE_NAME:
                        packageName = AZURE_CORE_PACKAGE_NAME;
                        groupId = "com.azure";
                        artifactId = "azure-core";
                        break;

                    case CLIENTCORE_JSON_PACKAGE_NAME:
                        packageName = AZURE_JSON_PACKAGE_NAME;
                        groupId = "com.azure";
                        artifactId = "azure-json";
                        break;
                }
            }
            return new ExternalPackage(packageName, groupId, artifactId);
        }
    }
}
