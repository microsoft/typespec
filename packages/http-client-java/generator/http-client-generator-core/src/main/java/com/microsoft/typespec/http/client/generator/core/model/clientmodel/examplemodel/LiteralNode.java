// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

/**
 * Example node of an external node, which is primitive type, or can be converted from a primitive type.
 */
public class LiteralNode extends ExampleNode {

    private String literalsValue;

    public LiteralNode(IType clientType, Object objectValue) {
        super(clientType, objectValue);
    }

    public String getLiteralsValue() {
        return literalsValue;
    }

    public LiteralNode setLiteralsValue(String literalsValue) {
        this.literalsValue = literalsValue;
        return this;
    }
}
