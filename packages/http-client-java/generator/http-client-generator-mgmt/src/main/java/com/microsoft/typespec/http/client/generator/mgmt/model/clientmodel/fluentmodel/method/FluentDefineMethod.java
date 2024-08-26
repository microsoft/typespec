// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

import java.util.Set;

public class FluentDefineMethod extends FluentMethod {

    private final boolean constantResourceName; // resource name is constant, "name" is not needed
    private final ClientMethodParameter methodParameter;
    private final IType resourceNameType;

    public static FluentDefineMethod defineMethodWithConstantResourceName(
            FluentResourceModel model, FluentMethodType type, String resourceName) {
        return new FluentDefineMethod(model, type, resourceName, null);
    }

    public FluentDefineMethod(FluentResourceModel model, FluentMethodType type,
                              String resourceName, ClientMethodParameter methodParameter) {
        super(model, type);

        this.constantResourceName = methodParameter == null;
        this.methodParameter = methodParameter;
        this.resourceNameType = constantResourceName ? null : methodParameter.getClientType();

        this.name = "define" + resourceName;
        String interfaceTypeName = model.getInterfaceType().getName();
        this.description = String.format("Begins definition for a new %1$s resource.", interfaceTypeName);

        this.interfaceReturnValue = new ReturnValue(String.format("the first stage of the new %1$s definition.", interfaceTypeName),
                new ClassType.Builder()
                        .name(String.format("%1$s.%2$s.Blank", interfaceTypeName, ModelNaming.MODEL_FLUENT_INTERFACE_DEFINITION_STAGES))
                        .build());
        this.implementationReturnValue = new ReturnValue("", model.getImplementationType());

        if (methodParameter != null) {
            this.parameters.add(methodParameter);
        }
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public MethodTemplate getMethodTemplate() {
        if (this.implementationMethodTemplate == null) {
            this.implementationMethodTemplate = MethodTemplate.builder()
                    .methodSignature(this.getImplementationMethodSignature())
                    .method(block -> {
                        if (constantResourceName) {
                            block.methodReturn(String.format("new %1$s(this.%2$s())",
                                    fluentResourceModel.getImplementationType().toString(),
                                    ModelNaming.METHOD_MANAGER));
                        } else {
                            block.methodReturn(String.format("new %1$s(name, this.%2$s())",
                                    fluentResourceModel.getImplementationType().toString(),
                                    ModelNaming.METHOD_MANAGER));
                        }
                    })
                    .build();
        }
        return this.implementationMethodTemplate;
    }

    @Override
    protected String getBaseMethodSignature() {
        if (constantResourceName) {
            return String.format("%1$s()", this.name);
        } else {
            return String.format("%1$s(%2$s name)", this.name, resourceNameType.toString());
        }
    }

    @Override
    public void writeJavadoc(JavaJavadocComment commentBlock) {
        commentBlock.description(description);
        if (!constantResourceName) {
            commentBlock.param("name", "resource name.");
        }
        commentBlock.methodReturns(interfaceReturnValue.getDescription());
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        if (includeImplementationImports) {
            fluentResourceModel.getInterfaceType().addImportsTo(imports, false);
        } else {
            fluentResourceModel.getImplementationType().addImportsTo(imports, false);
        }
        if (resourceNameType != null) {
            resourceNameType.addImportsTo(imports, false);
        }
    }

    public ClientMethodParameter getMethodParameter() {
        return methodParameter;
    }
}
