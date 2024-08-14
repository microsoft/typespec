// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

/**
 * A sequence type used by a client.
 */
public class ListType extends IterableType {
    /**
     * Create a new ListType from the provided properties.
     * @param elementType The type of elements that are stored in this sequence.
     */
    public ListType(IType elementType) {
        super("java.util", "List", elementType);
    }
}
