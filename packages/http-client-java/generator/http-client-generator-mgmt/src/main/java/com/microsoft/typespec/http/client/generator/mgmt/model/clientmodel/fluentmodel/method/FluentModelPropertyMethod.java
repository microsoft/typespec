// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelProperty;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.FluentInterfaceStage;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.LocalVariable;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

import java.util.Objects;
import java.util.Set;

public class FluentModelPropertyMethod extends FluentMethod {

    private final ClientModel clientModel;
    protected final ModelProperty modelProperty;
    private final LocalVariable localVariable;

    public FluentModelPropertyMethod(FluentResourceModel model, FluentMethodType type,
                                     FluentInterfaceStage stage, ClientModel clientModel,
                                     ModelProperty modelProperty,
                                     LocalVariable localVariable) {
        this(model, type, stage, clientModel, modelProperty, localVariable,
                modelProperty.getSetterName(),
                String.format("Specifies the %1$s property: %2$s.", modelProperty.getName(), modelProperty.getDescription()));
    }

    public FluentModelPropertyMethod(FluentResourceModel model, FluentMethodType type,
                                     FluentInterfaceStage stage, ClientModel clientModel,
                                     ModelProperty modelProperty,
                                     LocalVariable localVariable,
                                     String name, String description) {
        super(model, type);

        this.clientModel = clientModel;
        this.modelProperty = modelProperty;
        this.localVariable = localVariable;

        this.name = name;
        this.description = description;
        this.interfaceReturnValue = new ReturnValue("the next definition stage.", new ClassType.Builder().name(stage.getNextStage().getName()).build());
        this.implementationReturnValue = new ReturnValue("", model.getImplementationType());

        this.implementationMethodTemplate = MethodTemplate.builder()
                .methodSignature(this.getImplementationMethodSignature())
                .method(block -> {
                    if (fluentResourceModel.getInnerModel() == clientModel) {
                        block.line("this.%1$s().%2$s(%3$s);", ModelNaming.METHOD_INNER_MODEL, modelProperty.getSetterName(), modelProperty.getName());
                    } else {
                        block.line("this.%1$s.%2$s(%3$s);", localVariable.getName(), modelProperty.getSetterName(), modelProperty.getName());
                    }
                    block.methodReturn("this");
                })
                .build();
    }

    public ClientModel getClientModel() {
        return clientModel;
    }

    public ModelProperty getModelProperty() {
        return modelProperty;
    }

    @Override
    protected String getBaseMethodSignature() {
        return String.format("%1$s(%2$s %3$s)",
                this.name,
                modelProperty.getClientType().toString(),
                modelProperty.getName());
    }

    @Override
    public void writeJavadoc(JavaJavadocComment commentBlock) {
        commentBlock.description(description);
        commentBlock.param(modelProperty.getName(), modelProperty.getDescription());
        commentBlock.methodReturns(interfaceReturnValue.getDescription());
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        modelProperty.addImportsTo(imports);
    }

    @Override
    public boolean equals(Object obj) {
        if (obj instanceof FluentModelPropertyMethod) {
            FluentModelPropertyMethod other = (FluentModelPropertyMethod) obj;
            return this.clientModel == other.clientModel && Objects.equals(this.modelProperty, other.modelProperty) && this.localVariable == other.localVariable;
        } else {
            return false;
        }
    }

    @Override
    public int hashCode() {
        return Objects.hash(clientModel, modelProperty, localVariable);
    }
}
