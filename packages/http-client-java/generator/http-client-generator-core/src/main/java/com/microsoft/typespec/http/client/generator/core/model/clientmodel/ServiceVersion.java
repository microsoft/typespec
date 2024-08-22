// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.List;

public class ServiceVersion {

    private final String className;
    private final String serviceName;
    private final List<String> serviceVersions;

    public ServiceVersion(String className, String serviceName, List<String> serviceVersions) {
        this.className = className;
        this.serviceName = serviceName;
        this.serviceVersions = serviceVersions;
    }

    public String getClassName() {
        return className;
    }

    public String getServiceName() {
        return serviceName;
    }

    public List<String> getServiceVersions() {
        return serviceVersions;
    }
}
