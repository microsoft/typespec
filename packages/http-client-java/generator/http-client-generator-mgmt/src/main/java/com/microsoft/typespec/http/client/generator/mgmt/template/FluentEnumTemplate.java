// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaEnum;
import com.microsoft.typespec.http.client.generator.core.template.EnumTemplate;

public class FluentEnumTemplate extends EnumTemplate {
    private static final FluentEnumTemplate INSTANCE = new FluentEnumTemplate();

    private FluentEnumTemplate() {
    }

    public static FluentEnumTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void addGeneratedAnnotation(JavaContext classBlock) {
    }

    @Override
    protected void addGeneratedAnnotation(JavaEnum enumBlock) {
    }
}
