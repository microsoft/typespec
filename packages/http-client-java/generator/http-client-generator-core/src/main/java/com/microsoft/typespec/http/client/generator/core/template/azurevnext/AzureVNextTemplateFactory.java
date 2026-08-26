// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.azurevnext;

import com.microsoft.typespec.http.client.generator.core.template.ClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.template.PomTemplate;
import com.microsoft.typespec.http.client.generator.core.template.clientcore.ClientCoreTemplateFactory;

public class AzureVNextTemplateFactory extends ClientCoreTemplateFactory {

    @Override
    public PomTemplate getPomTemplate() {
        return AzureVNextPomTemplate.getInstance();
    }

    @Override
    public ClientMethodTemplate getClientMethodTemplate() {
        return AzureVNextClientMethodTemplate.getInstance();
    }
}
