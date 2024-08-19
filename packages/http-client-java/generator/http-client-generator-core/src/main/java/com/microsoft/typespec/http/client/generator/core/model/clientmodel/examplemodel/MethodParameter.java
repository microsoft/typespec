// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;

/** 1-1 pair of proxy method parameter and client method parameter */
public class MethodParameter {

    private final ProxyMethodParameter proxyMethodParameter;
    private final ClientMethodParameter clientMethodParameter;

    public MethodParameter(ProxyMethodParameter proxyMethodParameter, ClientMethodParameter clientMethodParameter) {
        this.proxyMethodParameter = proxyMethodParameter;
        this.clientMethodParameter = clientMethodParameter;
    }

    public ProxyMethodParameter getProxyMethodParameter() {
        return proxyMethodParameter;
    }

    public ClientMethodParameter getClientMethodParameter() {
        return clientMethodParameter;
    }

    public String getSerializedName() {
        return this.getProxyMethodParameter().getRequestParameterName();
    }
}
