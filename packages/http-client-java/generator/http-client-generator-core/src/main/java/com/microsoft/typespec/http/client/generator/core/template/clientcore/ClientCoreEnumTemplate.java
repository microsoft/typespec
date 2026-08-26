// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaEnum;
import com.microsoft.typespec.http.client.generator.core.template.EnumTemplate;

public class ClientCoreEnumTemplate extends EnumTemplate {

    private static final ClientCoreEnumTemplate INSTANCE = new ClientCoreEnumTemplate();

    private ClientCoreEnumTemplate() {
    }

    public static ClientCoreEnumTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void addGeneratedAnnotation(JavaContext classBlock) {
        classBlock.annotation(Annotation.METADATA.getName() + "(properties = {MetadataProperties.GENERATED})");
    }

    @Override
    protected void addGeneratedAnnotation(JavaEnum enumBlock) {
        enumBlock.annotation(Annotation.METADATA.getName() + "(properties = {MetadataProperties.GENERATED})");
    }
}
