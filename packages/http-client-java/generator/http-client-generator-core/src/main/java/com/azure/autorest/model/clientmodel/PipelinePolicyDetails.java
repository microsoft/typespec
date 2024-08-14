// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.model.clientmodel;

public class PipelinePolicyDetails {

    private String requestIdHeaderName;

    public String getRequestIdHeaderName() {
        return requestIdHeaderName;
    }

    public PipelinePolicyDetails setRequestIdHeaderName(String requestIdHeaderName) {
        this.requestIdHeaderName = requestIdHeaderName;
        return this;
    }
}
