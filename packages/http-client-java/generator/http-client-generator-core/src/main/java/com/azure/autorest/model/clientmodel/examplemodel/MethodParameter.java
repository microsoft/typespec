// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.model.clientmodel.examplemodel;

import com.azure.autorest.model.clientmodel.ClientMethodParameter;
import com.azure.autorest.model.clientmodel.ProxyMethodParameter;

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
