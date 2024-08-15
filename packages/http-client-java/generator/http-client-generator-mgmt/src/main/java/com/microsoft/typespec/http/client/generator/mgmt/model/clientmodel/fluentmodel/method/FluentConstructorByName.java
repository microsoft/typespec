// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.LocalVariable;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceLocalVariables;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

import java.util.Set;

public class FluentConstructorByName extends FluentMethod {

    private final boolean constantResourceName; // resource name is constant, "name" is not needed
    private final IType resourceNameType;
    private final ClassType managerType;

    public static FluentConstructorByName constructorMethodWithConstantResourceName(
            FluentResourceModel model, FluentMethodType type, ClassType managerType, ResourceLocalVariables resourceLocalVariables) {
        return new FluentConstructorByName(model, type, null, null, managerType, resourceLocalVariables);
    }

    public FluentConstructorByName(FluentResourceModel model, FluentMethodType type,
                                   IType resourceNameType, String propertyNameForResourceName, ClassType managerType,
                                   ResourceLocalVariables resourceLocalVariables) {
        super(model, type);

        this.constantResourceName = resourceNameType == null;
        this.resourceNameType = resourceNameType;
        this.managerType = managerType;

        this.implementationReturnValue = new ReturnValue("", model.getImplementationType());

        this.implementationMethodTemplate = MethodTemplate.builder()
                .visibility(JavaVisibility.PackagePrivate)
                .methodSignature(this.getImplementationMethodSignature())
                .method(block -> {
                    block.line(String.format("this.%1$s = new %2$s();", ModelNaming.MODEL_PROPERTY_INNER, model.getInnerModel().getName()));
                    block.line(String.format("this.%1$s = %2$s;", ModelNaming.MODEL_PROPERTY_MANAGER, ModelNaming.MODEL_PROPERTY_MANAGER));
                    if (!constantResourceName) {
                        block.line(String.format("this.%1$s = name;", propertyNameForResourceName));
                    }

                    // init
                    resourceLocalVariables.getLocalVariablesMap().values().stream()
                            .filter(LocalVariable::isInitializeRequired)
                            .forEach(var -> {
                                block.line(String.format("this.%1$s = %2$s;", var.getName(), var.getInitializeExpression()));
                            });
                })
                .build();
    }

    @Override
    public String getImplementationMethodSignature() {
        if (constantResourceName) {
            return String.format("%1$s(%2$s %3$s)",
                    implementationReturnValue.getType().toString(),
                    managerType.getFullName(), ModelNaming.MODEL_PROPERTY_MANAGER);
        } else {
            return String.format("%1$s(%2$s name, %3$s %4$s)",
                    implementationReturnValue.getType().toString(),
                    resourceNameType.toString(),
                    managerType.getFullName(), ModelNaming.MODEL_PROPERTY_MANAGER);
        }
    }

    @Override
    protected String getBaseMethodSignature() {
        throw new UnsupportedOperationException();
    }

    @Override
    public void writeJavadoc(JavaJavadocComment commentBlock) {
        // NOOP
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        if (includeImplementationImports) {
            if (resourceNameType != null) {
                resourceNameType.addImportsTo(imports, false);
            }
            /* use full name for FooManager, to avoid naming conflict
            managerType.addImportsTo(imports, false);
             */
        }
    }
}
