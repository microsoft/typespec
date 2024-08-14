// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.model.clientmodel.examplemodel;

import com.azure.autorest.model.clientmodel.IType;

/**
 * Example node for BinaryData.
 */
public class BinaryDataNode extends ExampleNode {
    public BinaryDataNode(IType clientType, Object objectValue) {
        super(clientType, objectValue);
    }

    /**
     * Get example value as string.
     * We treat all example values for BinaryData as string and generate BinaryData.fromBytes(exampleValue.getBytes()).
     * @return example value as string
     */
    public String getExampleValue() {
        return getObjectValue() == null ? null : getObjectValue().toString();
    }
}
