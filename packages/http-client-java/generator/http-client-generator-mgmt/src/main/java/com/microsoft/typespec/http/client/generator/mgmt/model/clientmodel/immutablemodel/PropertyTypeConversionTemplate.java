// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.immutablemodel;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentModelProperty;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelProperty;
import com.microsoft.typespec.http.client.generator.mgmt.util.TypeConversionUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

// Implementation method template for property requires conversion.
// E.g.
//    BlobRestoreStatusInner inner = this.inner().blobRestoreStatus();
//    if (inner != null) {
//        return new BlobRestoreStatusImpl(inner, this.manager());
//    } else {
//        return null;
//    }
public class PropertyTypeConversionTemplate implements ImmutableMethod {

    private final MethodTemplate conversionMethodTemplate;

    public PropertyTypeConversionTemplate(FluentModelProperty fluentProperty, ModelProperty property) {
        Set<String> imports = new HashSet<>();
        fluentProperty.getFluentType().addImportsTo(imports, false);
        // Type inner = ...
        property.getClientType().addImportsTo(imports, false);
        if (property.getClientType() instanceof ListType || property.getClientType() instanceof MapType) {
            // Collectors.toList
            imports.add(Collectors.class.getName());

            // Collections.unmodifiableList
            imports.add(Collections.class.getName());
        }

        conversionMethodTemplate = MethodTemplate.builder()
                .imports(imports)
                .methodSignature(fluentProperty.getMethodSignature())
                .method(block -> {
                    block.line(String.format("%1$s %2$s = this.%3$s().%4$s();", property.getClientType().toString(), TypeConversionUtils.tempVariableName(), ModelNaming.METHOD_INNER_MODEL, property.getGetterName()));
                    block.ifBlock(String.format("%1$s != null", TypeConversionUtils.tempVariableName()), ifBlock -> {
                        String expression = TypeConversionUtils.conversionExpression(property.getClientType(), TypeConversionUtils.tempVariableName());
                        block.methodReturn(TypeConversionUtils.objectOrUnmodifiableCollection(property.getClientType(), expression));
                    }).elseBlock(elseBlock -> {
                        block.methodReturn(TypeConversionUtils.nullOrEmptyCollection(property.getClientType()));
                    });
                })
                .build();
    }

    @Override
    public MethodTemplate getMethodTemplate() {
        return conversionMethodTemplate;
    }
}
