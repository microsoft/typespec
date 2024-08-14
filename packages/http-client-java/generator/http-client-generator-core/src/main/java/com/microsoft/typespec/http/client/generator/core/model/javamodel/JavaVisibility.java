// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

/**
 * The visibility of a Java type or member.
 */
public enum JavaVisibility {
    Public("public"),

    Protected("protected"),

    Private("private"),

    PackagePrivate("");

    private final String keyword;

    JavaVisibility(String keyword) {
        this.keyword = keyword;
    }


    @Override
    public String toString() {
        return keyword;
    }
}
