// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.android;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;

import java.util.List;
import java.util.Set;

public class AndroidProxy extends Proxy {
    protected AndroidProxy(String name, String clientTypeName, String baseURL, List<ProxyMethod> methods) {
        super(name, clientTypeName, baseURL, methods);
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports, JavaSettings settings) {
        if (includeImplementationImports) {
            imports.add("com.azure.android.core.rest.annotation.Host");
            imports.add("com.azure.android.core.rest.annotation.ServiceInterface");
        }

        for (ProxyMethod method : getMethods()) {
            method.addImportsTo(imports, includeImplementationImports, settings);
        }
    }

    public static final class Builder extends Proxy.Builder {
        @Override
        public Proxy build() {
            return new AndroidProxy(name, clientTypeName, baseURL, methods);
        }
    }
}
