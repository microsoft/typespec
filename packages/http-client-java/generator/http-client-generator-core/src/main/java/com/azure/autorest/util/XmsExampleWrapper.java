// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.util;

public class XmsExampleWrapper {

    private final Object xmsExample;
    private final String operationId;
    private final String exampleName;

    public XmsExampleWrapper(Object xmsExample, String operationId, String exampleName) {
        this.xmsExample = xmsExample;
        this.operationId = operationId;
        this.exampleName = exampleName;
    }

    public String getExampleName() {
        return exampleName;
    }

    public Object getXmsExample() {
        return xmsExample;
    }

    public String getOperationId() {
        return operationId;
    }
}
