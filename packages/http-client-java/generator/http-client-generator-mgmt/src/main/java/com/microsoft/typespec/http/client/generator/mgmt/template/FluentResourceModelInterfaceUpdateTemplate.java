// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.ResourceUpdate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.UpdateStage;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaInterface;
import com.microsoft.typespec.http.client.generator.core.template.IJavaTemplate;

import java.util.List;
import java.util.stream.Collectors;

public class FluentResourceModelInterfaceUpdateTemplate implements IJavaTemplate<ResourceUpdate, JavaInterface> {

    @Override
    public void write(ResourceUpdate resourceUpdate, JavaInterface interfaceBlock) {
        FluentMethod updateMethod = resourceUpdate.getUpdateMethod();

        interfaceBlock.javadocComment(updateMethod::writeJavadoc);
        interfaceBlock.publicMethod(updateMethod.getInterfaceMethodSignature());

        List<UpdateStage> updateStages = resourceUpdate.getUpdateStages();

        final String modelName = resourceUpdate.getResourceModel().getInterfaceType().getName();

        // Update interface
        interfaceBlock.javadocComment(commentBlock -> {
            commentBlock.description(String.format("The template for %1$s update.", modelName));
        });
        String definitionInterfaceSignature = ModelNaming.MODEL_FLUENT_INTERFACE_UPDATE;
        String updateExtendsStr = updateStages.stream()
                .map(s -> String.format("%1$s.%2$s", ModelNaming.MODEL_FLUENT_INTERFACE_UPDATE_STAGES, s.getName()))
                .collect(Collectors.joining(", "));
        if (!updateExtendsStr.isEmpty()) {
            definitionInterfaceSignature += String.format(" extends %1$s",
                    updateExtendsStr);
        }
        interfaceBlock.interfaceBlock(definitionInterfaceSignature, block1 -> {
            List<FluentMethod> applyMethods = resourceUpdate.getApplyMethods();
            applyMethods.forEach(method -> {
                block1.javadocComment(method::writeJavadoc);
                block1.publicMethod(method.getInterfaceMethodSignature());
            });
        });

        // UpdateStages interface
        interfaceBlock.javadocComment(commentBlock -> {
            commentBlock.description(String.format("The %1$s update stages.", modelName));
        });
        interfaceBlock.interfaceBlock(ModelNaming.MODEL_FLUENT_INTERFACE_UPDATE_STAGES, block1 -> {
            for (UpdateStage stage : updateStages) {
                block1.javadocComment(commentBlock -> {
                    commentBlock.description(stage.getDescription(modelName));
                });
                String interfaceSignature = stage.getName();
                block1.interfaceBlock(interfaceSignature, block2 -> {
                    for (FluentMethod method : stage.getMethods()) {
                        block2.javadocComment(method::writeJavadoc);
                        block2.publicMethod(method.getInterfaceMethodSignature());
                    }
                });
            }
        });
    }
}
