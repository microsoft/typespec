// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

/**
 * Example node of an external node, which is primitive type, or can be converted from a primitive type.
 */
public class LiteralNode extends ExampleNode {

    private final IType wireType;
    private String literalsValue;

    public LiteralNode(IType clientType, Object objectValue) {
        this(clientType, clientType, objectValue);
    }

    public LiteralNode(IType clientType, IType wireType, Object objectValue) {
        super(clientType, objectValue);
        this.wireType = wireType;
    }

    public String getLiteralsValue() {
        return literalsValue;
    }

    public LiteralNode setLiteralsValue(String literalsValue) {
        this.literalsValue = literalsValue;
        return this;
    }

    public IType getWireType() {
        return wireType;
    }
}
