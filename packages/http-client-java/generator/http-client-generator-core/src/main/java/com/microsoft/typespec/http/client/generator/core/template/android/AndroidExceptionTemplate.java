// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.android;

import com.microsoft.typespec.http.client.generator.core.template.ExceptionTemplate;

public class AndroidExceptionTemplate extends ExceptionTemplate {
    private static final ExceptionTemplate INSTANCE = new AndroidExceptionTemplate();

    protected AndroidExceptionTemplate() {
    }

    public static ExceptionTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected String getHttpResponseImport() {
        return "com.azure.android.core.http.HttpResponse";
    }
}
