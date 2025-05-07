// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaType;
import com.microsoft.typespec.http.client.generator.core.template.WrapperClientMethodTemplate;

public class ClientCoreWrapperClientMethodTemplate extends WrapperClientMethodTemplate {

    private static final ClientCoreWrapperClientMethodTemplate INSTANCE = new ClientCoreWrapperClientMethodTemplate();

    private ClientCoreWrapperClientMethodTemplate() {
    }

    public static WrapperClientMethodTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void addGeneratedAnnotation(JavaType typeBlock) {
        typeBlock.annotation(Annotation.METADATA.getName() + "(properties = {MetadataProperties.GENERATED})");
    }
}
