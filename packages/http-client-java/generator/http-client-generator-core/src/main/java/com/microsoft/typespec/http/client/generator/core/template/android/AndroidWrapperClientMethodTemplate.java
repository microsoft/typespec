// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.android;

import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaType;
import com.microsoft.typespec.http.client.generator.core.template.WrapperClientMethodTemplate;

public class AndroidWrapperClientMethodTemplate extends WrapperClientMethodTemplate {

    private static final WrapperClientMethodTemplate INSTANCE = new AndroidWrapperClientMethodTemplate();

    public static WrapperClientMethodTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void addGeneratedAnnotation(JavaType typeBlock) {
    }
}
