// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.template.ServiceSyncClientTemplate;

/**
 * Template to create a synchronous client.
 */
public class ClientCoreServiceSyncClientTemplate extends ServiceSyncClientTemplate {

    private static final ClientCoreServiceSyncClientTemplate INSTANCE = new ClientCoreServiceSyncClientTemplate();

    protected ClientCoreServiceSyncClientTemplate() {
    }

    public static ClientCoreServiceSyncClientTemplate getInstance() {
        return INSTANCE;
    }

    protected void addGeneratedAnnotation(JavaContext classBlock) {
        classBlock.annotation(Annotation.METADATA.getName() + "(properties = {MetadataProperties.GENERATED})");
    }
}
