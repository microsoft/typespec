// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model;

public enum WellKnownMethodName {
    // client
    LIST("list"),
    LIST_BY_RESOURCE_GROUP("listByResourceGroup"),
    GET_BY_RESOURCE_GROUP("getByResourceGroup"),
    DELETE("delete"),

    // fluent
    DELETE_BY_RESOURCE_GROUP("deleteByResourceGroup");

    private final String methodName;

    WellKnownMethodName(String methodName) {
        this.methodName = methodName;
    }

    public String getMethodName() {
        return methodName;
    }

    public static WellKnownMethodName fromMethodName(String methodName) {
        for (WellKnownMethodName name : WellKnownMethodName.values()) {
            if (name.getMethodName().equals(methodName)) {
                return name;
            }
        }
        return null;
    }
}
