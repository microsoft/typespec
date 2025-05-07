// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.microsoft.typespec.http.client.generator.core.template.ClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ConvenienceSyncMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.template.DefaultTemplateFactory;
import com.microsoft.typespec.http.client.generator.core.template.EnumTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ExceptionTemplate;
import com.microsoft.typespec.http.client.generator.core.template.MethodGroupTemplate;
import com.microsoft.typespec.http.client.generator.core.template.PomTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ServiceClientTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ServiceSyncClientTemplate;
import com.microsoft.typespec.http.client.generator.core.template.WrapperClientMethodTemplate;

public class ClientCoreTemplateFactory extends DefaultTemplateFactory {

    @Override
    public ServiceClientTemplate getServiceClientTemplate() {
        return ClientCoreServiceClientTemplate.getInstance();
    }

    @Override
    public ClientMethodTemplate getClientMethodTemplate() {
        return ClientCoreClientMethodTemplate.getInstance();
    }

    @Override
    public ExceptionTemplate getExceptionTemplate() {
        return ClientCoreExceptionTemplate.getInstance();
    }

    @Override
    public PomTemplate getPomTemplate() {
        return ClientCorePomTemplate.getInstance();
    }

    @Override
    public MethodGroupTemplate getMethodGroupTemplate() {
        return ClientCoreMethodGroupTemplate.getInstance();
    }

    @Override
    public ConvenienceSyncMethodTemplate getConvenienceSyncMethodTemplate() {
        return ClientCoreConvenienceSyncMethodTemplate.getInstance();
    }

    @Override
    public ServiceSyncClientTemplate getServiceSynClientTemplate() {
        return ClientCoreServiceSyncClientTemplate.getInstance();
    }

    @Override
    public WrapperClientMethodTemplate getWrapperClientMethodTemplate() {
        return ClientCoreWrapperClientMethodTemplate.getInstance();
    }

    @Override
    public EnumTemplate getEnumTemplate() {
        return ClientCoreEnumTemplate.getInstance();
    }
}
