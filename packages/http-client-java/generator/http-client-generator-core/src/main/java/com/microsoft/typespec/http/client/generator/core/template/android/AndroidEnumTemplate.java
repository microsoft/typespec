// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.android;

import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaEnum;
import com.microsoft.typespec.http.client.generator.core.template.EnumTemplate;

import java.util.Set;

public class AndroidEnumTemplate extends EnumTemplate {

    private static final EnumTemplate INSTANCE = new AndroidEnumTemplate();

    private AndroidEnumTemplate() {
    }

    public static EnumTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected String getStringEnumImport() {
        return "com.azure.android.core.util.ExpandableStringEnum";
    }

    @Override
    protected void addGeneratedImport(Set<String> imports) {
    }

    @Override
    protected void addGeneratedAnnotation(JavaContext context) {
    }

    @Override
    protected void addGeneratedAnnotation(JavaEnum context) {
    }
}
