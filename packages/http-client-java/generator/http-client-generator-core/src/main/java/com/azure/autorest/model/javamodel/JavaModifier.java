// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.model.javamodel;

/**
 * Modifiers that can be applied to Java types or members.
 */
public enum JavaModifier {
    Final("final"),

    Static("static"),
    Abstract("abstract");

    private final String keyword;

    JavaModifier(String keyword) {
        this.keyword = keyword;
    }

    public int getValue() {
        return this.ordinal();
    }

    @Override
    public String toString() {
        return keyword;
    }
}
