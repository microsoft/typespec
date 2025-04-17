// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

/**
 * Represents an anonymous schema.
 */
public class XmsInternalAutorestAnonymousSchema {
    private boolean anonymous = true;

    /**
     * Creates a new instance of the XmsInternalAutorestAnonymousSchema class.
     */
    public XmsInternalAutorestAnonymousSchema() {
    }

    /**
     * Gets whether the schema is anonymous.
     *
     * @return Whether the schema is anonymous.
     */
    public boolean isAnonymous() {
        return anonymous;
    }

    /**
     * Sets whether the schema is anonymous.
     *
     * @param anonymous Whether the schema is anonymous.
     */
    public void setAnonymous(boolean anonymous) {
        this.anonymous = anonymous;
    }
}
