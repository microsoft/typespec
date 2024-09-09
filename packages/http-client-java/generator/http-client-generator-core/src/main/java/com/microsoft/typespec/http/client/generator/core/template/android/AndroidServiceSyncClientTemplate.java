// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.android;

import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.template.ServiceSyncClientTemplate;

public class AndroidServiceSyncClientTemplate extends ServiceSyncClientTemplate {
    private static final AndroidServiceSyncClientTemplate INSTANCE = new AndroidServiceSyncClientTemplate();

    protected AndroidServiceSyncClientTemplate() {
    }

    public static ServiceSyncClientTemplate getInstance() {
        return INSTANCE;
    }

    protected void addServiceClientAnnotationImport(java.util.Set<String> imports) {
        imports.add("com.azure.android.core.rest.annotation.ServiceClient");
    }

    @Override
    protected void addGeneratedAnnotation(JavaContext classBlock) {
    }
}
