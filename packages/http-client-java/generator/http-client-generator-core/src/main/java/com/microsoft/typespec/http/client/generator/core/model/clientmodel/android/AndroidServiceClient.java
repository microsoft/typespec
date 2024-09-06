// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.android;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Constructor;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.SecurityInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClientProperty;

import java.util.List;
import java.util.Set;

public class AndroidServiceClient extends ServiceClient {

    protected AndroidServiceClient(String packageName, String className, String interfaceName, Proxy proxy,
        List<MethodGroupClient> methodGroupClients, List<ServiceClientProperty> properties,
        List<Constructor> constructors, List<ClientMethod> clientMethods,
        ClientMethodParameter azureEnvironmentParameter, ClientMethodParameter tokenCredentialParameter,
        ClientMethodParameter httpPipelineParameter, ClientMethodParameter serializerAdapterParameter,
        ClientMethodParameter defaultPollIntervalParameter, String defaultCredentialScopes, boolean builderDisabled,
        SecurityInfo securityInfo, String baseUrl) {
        super(packageName, className, interfaceName, proxy, methodGroupClients, properties, constructors, clientMethods,
            azureEnvironmentParameter, tokenCredentialParameter, httpPipelineParameter, serializerAdapterParameter,
            defaultPollIntervalParameter, defaultCredentialScopes, builderDisabled, null, securityInfo, baseUrl, null,
            null);
    }

    @Override
    protected void addRestProxyImport(Set<String> imports) {
        imports.add("com.azure.android.core.rest.RestProxy");
    }

    @Override
    protected void addPipelineBuilderImport(Set<String> imports) {
        imports.add("com.azure.android.core.http.HttpPipelineBuilder");
    }

    @Override
    protected void addHttpPolicyImports(Set<String> imports) {
        imports.add("com.azure.android.core.http.policy.CookiePolicy");
        imports.add("com.azure.android.core.http.policy.RetryPolicy");
        imports.add("com.azure.android.core.http.policy.UserAgentPolicy");
    }

    public static class Builder extends ServiceClient.Builder {
        @Override
        public ServiceClient build() {
            return new AndroidServiceClient(packageName, className, interfaceName, proxy, methodGroupClients,
                properties, constructors, clientMethods, azureEnvironmentParameter, tokenCredentialParameter,
                httpPipelineParameter, serializerAdapterParameter, defaultPollIntervalParameter,
                defaultCredentialScopes, builderDisabled, securityInfo, baseUrl);
        }
    }
}
