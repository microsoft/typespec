// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent;

import com.microsoft.typespec.http.client.generator.core.template.EnumTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentTemplateFactory;
import com.microsoft.typespec.http.client.generator.template.TypeSpecEnumTemplate;

/**
 * TypeSpec mgmt template factory.
 */
public class TypeSpecFluentTemplateFactory extends FluentTemplateFactory {
    @Override
    public EnumTemplate getEnumTemplate() {
        return TypeSpecEnumTemplate.getInstance();
    }
}
