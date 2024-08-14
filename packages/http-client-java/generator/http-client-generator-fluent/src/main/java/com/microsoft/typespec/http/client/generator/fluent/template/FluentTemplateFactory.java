// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent.template;

import com.azure.autorest.template.ClientMethodTemplate;
import com.azure.autorest.template.DefaultTemplateFactory;
import com.azure.autorest.template.ModelTemplate;
import com.azure.autorest.template.PomTemplate;
import com.azure.autorest.template.ProxyTemplate;
import com.azure.autorest.template.ServiceClientBuilderTemplate;
import com.azure.autorest.template.ServiceClientTemplate;
import com.azure.autorest.template.StreamSerializationModelTemplate;

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
