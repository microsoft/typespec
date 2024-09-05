// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.android;

import com.microsoft.typespec.http.client.generator.core.template.ClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.template.DefaultTemplateFactory;
import com.microsoft.typespec.http.client.generator.core.template.EnumTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ExceptionTemplate;
import com.microsoft.typespec.http.client.generator.core.template.MethodGroupTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ProxyTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ResponseTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ServiceAsyncClientTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ServiceClientBuilderTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ServiceClientTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ServiceSyncClientTemplate;
import com.microsoft.typespec.http.client.generator.core.template.WrapperClientMethodTemplate;

public class AndroidTemplateFactory extends DefaultTemplateFactory {

    @Override
    public ProxyTemplate getProxyTemplate() {
        return AndroidProxyTemplate.getInstance();
    }

    @Override
    public ClientMethodTemplate getClientMethodTemplate() {
        return AndroidClientMethodTemplate.getInstance();
    }

    @Override
    public MethodGroupTemplate getMethodGroupTemplate() {
        return AndroidMethodGroupTemplate.getInstance();
    }

    @Override
    public ServiceClientTemplate getServiceClientTemplate() {
        return AndroidServiceClientTemplate.getInstance();
    }

    @Override
    public ServiceClientBuilderTemplate getServiceClientBuilderTemplate() {
        return AndroidServiceClientBuilderTemplate.getInstance();
    }

    @Override
    public EnumTemplate getEnumTemplate() {
        return AndroidEnumTemplate.getInstance();
    }

    @Override
    public ExceptionTemplate getExceptionTemplate() {
        return AndroidExceptionTemplate.getInstance();
    }

    @Override
    public ServiceAsyncClientTemplate getServiceAsyncClientTemplate() {
        return AndroidServiceAsyncClientTemplate.getInstance();
    }

    @Override
    public ServiceSyncClientTemplate getServiceSynClientTemplate() {
        return AndroidServiceSyncClientTemplate.getInstance();
    }

    @Override
    public ResponseTemplate getResponseTemplate() {
        return AndroidResponseTemplate.getInstance();
    }

    @Override
    public WrapperClientMethodTemplate getWrapperClientMethodTemplate() {
        return AndroidWrapperClientMethodTemplate.getInstance();
    }
}
