// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.template;

import com.microsoft.typespec.http.client.generator.core.template.DefaultTemplateFactory;
import com.microsoft.typespec.http.client.generator.core.template.EnumTemplate;

/**
 * TypeSpec template factory.
 */
public class TypeSpecTemplateFactory extends DefaultTemplateFactory {
    @Override
    public EnumTemplate getEnumTemplate() {
        return TypeSpecEnumTemplate.getInstance();
    }
}
