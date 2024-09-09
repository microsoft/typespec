// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.template.ClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.template.DefaultTemplateFactory;
import com.microsoft.typespec.http.client.generator.core.template.ModelTemplate;
import com.microsoft.typespec.http.client.generator.core.template.PomTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ProxyTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ServiceClientBuilderTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ServiceClientTemplate;
import com.microsoft.typespec.http.client.generator.core.template.StreamSerializationModelTemplate;

public class FluentTemplateFactory extends DefaultTemplateFactory {

    @Override
    public ProxyTemplate getProxyTemplate() {
        return FluentProxyTemplate.getInstance();
    }

    @Override
    public ClientMethodTemplate getClientMethodTemplate() {
        return FluentClientMethodTemplate.getInstance();
    }

    @Override
    public ServiceClientBuilderTemplate getServiceClientBuilderTemplate() {
        return FluentServiceClientBuilderTemplate.getInstance();
    }

    @Override
    public ModelTemplate getModelTemplate() {
        return FluentModelTemplate.getInstance();
    }

    @Override
    public StreamSerializationModelTemplate getStreamStyleModelTemplate() {
        return FluentStreamStyleSerializationModelTemplate.getInstance();
    }

    @Override
    public ServiceClientTemplate getServiceClientTemplate() {
        return FluentServiceClientTemplate.getInstance();
    }

    @Override
    public PomTemplate getPomTemplate() {
        return FluentPomTemplate.getInstance();
    }
}
