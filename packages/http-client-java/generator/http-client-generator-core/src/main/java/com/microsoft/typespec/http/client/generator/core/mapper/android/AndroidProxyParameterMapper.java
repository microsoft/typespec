// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.android;

import com.microsoft.typespec.http.client.generator.core.mapper.ProxyParameterMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.android.AndroidProxyMethodParameter;

public class AndroidProxyParameterMapper extends ProxyParameterMapper {
    private static final ProxyParameterMapper INSTANCE = new AndroidProxyParameterMapper();

    protected AndroidProxyParameterMapper() {
    }

    public static ProxyParameterMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected ProxyMethodParameter.Builder createProxyMethodParameterBuilder() {
        return new AndroidProxyMethodParameter.Builder();
    }
}
