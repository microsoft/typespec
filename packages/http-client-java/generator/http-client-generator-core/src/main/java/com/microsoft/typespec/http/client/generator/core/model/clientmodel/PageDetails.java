// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

/**
 * A page class that contains results that are received from a service request.
 */
public class PageDetails {
    public String packageName;
    private String nextLinkName;
    private String itemName;
    private String className;

    public PageDetails(String packageKeyword, String nextLinkName, String itemName, String className) {
        packageName = packageKeyword;
        this.nextLinkName = nextLinkName;
        this.itemName = itemName;
        this.className = className;
    }

    public final String getNextLinkName() {
        return nextLinkName;
    }

    public final String getItemName() {
        return itemName;
    }

    public final String getClassName() {
        return className;
    }
}
