// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.android;

import com.microsoft.typespec.http.client.generator.core.mapper.MethodGroupMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.android.AndroidMethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.android.AndroidProxy;

public class AndroidMethodGroupMapper extends MethodGroupMapper {
    private static final MethodGroupMapper INSTANCE = new AndroidMethodGroupMapper();

    protected AndroidMethodGroupMapper() {
    }

    public static MethodGroupMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected Proxy.Builder createProxyBuilder() {
        return new AndroidProxy.Builder();
    }

    @Override
    protected MethodGroupClient.Builder createMethodGroupClientBuilder() {
        return new AndroidMethodGroupClient.Builder();
    }
}
