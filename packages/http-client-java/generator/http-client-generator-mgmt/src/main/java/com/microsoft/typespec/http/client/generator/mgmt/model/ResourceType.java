// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model;

public enum ResourceType {

    RESOURCE(ResourceTypeName.RESOURCE),
    PROXY_RESOURCE(ResourceTypeName.PROXY_RESOURCE),
    SUB_RESOURCE(ResourceTypeName.SUB_RESOURCE);

    private String className;

    ResourceType(String className) {
        this.className = className;
    }

    public String getClassName() {
        return className;
    }
}
