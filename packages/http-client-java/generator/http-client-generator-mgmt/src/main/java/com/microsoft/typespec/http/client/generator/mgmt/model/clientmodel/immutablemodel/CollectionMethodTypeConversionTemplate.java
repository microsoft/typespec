// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.immutablemodel;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.mgmt.util.TypeConversionUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;
import com.azure.core.http.rest.SimpleResponse;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

// Implementation method template for return type requires conversion.
// E.g.
//    PagedIterable<StorageAccountInner> inner = this.inner().list();
//    return ResourceManagerUtils.mapPage(inner, inner1 -> new StorageAccountImpl(inner1, this.manager()));
public class CollectionMethodTypeConversionTemplate implements ImmutableMethod {

    private final MethodTemplate conversionMethodTemplate;

    public CollectionMethodTypeConversionTemplate(FluentCollectionMethod fluentMethod, IType innerType) {
        Set<String> imports = new HashSet<>();
        fluentMethod.addImportsTo(imports, false);
        // Type inner = ...
        innerType.addImportsTo(imports, false);
        if (innerType instanceof ListType || innerType instanceof MapType) {
            // Collectors.toList
            imports.add(Collectors.class.getName());

            // Collections.unmodifiableList
            imports.add(Collections.class.getName());
        }
        if (FluentUtils.isResponseType(innerType)) {
            imports.add(SimpleResponse.class.getName());
        }

        conversionMethodTemplate = MethodTemplate.builder()
                .imports(imports)
                .methodSignature(fluentMethod.getMethodSignature())
                .method(block -> {
                    block.line(String.format("%1$s %2$s = this.%3$s().%4$s;", innerType, TypeConversionUtils.tempVariableName(), ModelNaming.METHOD_SERVICE_CLIENT, fluentMethod.getMethodInvocation()));
                    if (TypeConversionUtils.isPagedIterable(innerType)) {
                        block.methodReturn(TypeConversionUtils.conversionExpression(innerType, TypeConversionUtils.tempVariableName()));
                    } else {
                        block.ifBlock(String.format("%1$s != null", TypeConversionUtils.tempVariableName()), ifBlock -> {
                            String expression = TypeConversionUtils.conversionExpression(innerType, TypeConversionUtils.tempVariableName());
                            block.methodReturn(TypeConversionUtils.objectOrUnmodifiableCollection(innerType, expression));
                        }).elseBlock(elseBlock -> {
                            block.methodReturn(TypeConversionUtils.nullOrEmptyCollection(innerType));
                        });
                    }
                })
                .build();
    }

    @Override
    public MethodTemplate getMethodTemplate() {
        return conversionMethodTemplate;
    }
}
