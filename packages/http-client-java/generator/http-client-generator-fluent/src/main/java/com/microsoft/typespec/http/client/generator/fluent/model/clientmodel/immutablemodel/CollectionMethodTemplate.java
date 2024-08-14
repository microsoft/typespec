// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent.model.clientmodel.immutablemodel;

import com.microsoft.typespec.http.client.generator.fluent.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.fluent.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.fluent.util.TypeConversionUtils;
import com.azure.autorest.model.clientmodel.IType;
import com.azure.autorest.model.clientmodel.ListType;
import com.azure.autorest.model.clientmodel.MapType;
import com.azure.autorest.model.clientmodel.PrimitiveType;
import com.azure.autorest.template.prototype.MethodTemplate;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

// Implementation method template for simple return type
// E.g. "return this.inner().checkExistence(...)"
public class CollectionMethodTemplate implements ImmutableMethod {

    private final MethodTemplate implementationMethodTemplate;

    public CollectionMethodTemplate(FluentCollectionMethod fluentMethod, IType innerType) {
        Set<String> imports = new HashSet<>();
        fluentMethod.addImportsTo(imports, false);
        // Type inner = ...
        innerType.addImportsTo(imports, false);
        if (innerType instanceof ListType || innerType instanceof MapType) {
            // Collections.unmodifiableList
            imports.add(Collections.class.getName());
        }

        implementationMethodTemplate = MethodTemplate.builder()
                .imports(imports)
                .methodSignature(fluentMethod.getMethodSignature())
                .method(block -> {
                    String expression = String.format("this.%1$s().%2$s", ModelNaming.METHOD_SERVICE_CLIENT, fluentMethod.getMethodInvocation());
                    if (innerType == PrimitiveType.VOID || innerType == PrimitiveType.VOID.asNullable()) {
                        block.line(String.format("this.%1$s().%2$s;", ModelNaming.METHOD_SERVICE_CLIENT, fluentMethod.getMethodInvocation()));
                    } else {
                        if (innerType instanceof ListType || innerType instanceof MapType) {
                            block.line(String.format("%1$s %2$s = %3$s;", innerType, TypeConversionUtils.tempVariableName(), expression));
                            block.ifBlock(String.format("%1$s != null", TypeConversionUtils.tempVariableName()), ifBlock -> {
                                block.methodReturn(TypeConversionUtils.objectOrUnmodifiableCollection(innerType, TypeConversionUtils.tempVariableName()));
                            }).elseBlock(elseBlock -> {
                                block.methodReturn(TypeConversionUtils.nullOrEmptyCollection(innerType));
                            });
                        } else {
                            block.methodReturn(expression);
                        }
                    }
                })
                .build();
    }

    @Override
    public MethodTemplate getMethodTemplate() {
        return implementationMethodTemplate;
    }
}
