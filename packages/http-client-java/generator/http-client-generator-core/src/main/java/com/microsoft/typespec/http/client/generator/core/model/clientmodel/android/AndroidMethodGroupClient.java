// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.android;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;

import java.util.List;

public class AndroidMethodGroupClient extends MethodGroupClient {
    protected AndroidMethodGroupClient(String packageKeyword, String className, String interfaceName,
        List<String> implementedInterfaces, Proxy proxy, String serviceClientName, String variableType,
        String variableName, List<ClientMethod> clientMethods, List<IType> supportedInterfaces, String classBaseName) {
        super(packageKeyword, className, interfaceName, implementedInterfaces, proxy, serviceClientName, variableType,
            variableName, clientMethods, supportedInterfaces, classBaseName != null
                ? classBaseName
                : (className.endsWith("Impl") ? className.substring(0, className.length() - 4) : className), null);
    }

    @Override
    protected ClassType getProxyClassType() {
        return ClassType.ANDROID_REST_PROXY;
    }

    public static class Builder extends MethodGroupClient.Builder {
        @Override
        public MethodGroupClient build() {
            return new AndroidMethodGroupClient(packageName, className, interfaceName, implementedInterfaces, proxy,
                serviceClientName, variableType, variableName, clientMethods, supportedInterfaces, classBaseName);
        }
    }
}
