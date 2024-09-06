// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.android;

import com.microsoft.typespec.http.client.generator.core.mapper.ExceptionMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientException;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.android.AndroidClientException;

public class AndroidExceptionMapper extends ExceptionMapper {
    private static final ExceptionMapper INSTANCE = new AndroidExceptionMapper();

    protected AndroidExceptionMapper() {
    }

    public static ExceptionMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected ClientException.Builder createClientExceptionBuilder() {
        return new AndroidClientException.Builder();
    }
}
