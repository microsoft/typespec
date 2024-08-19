// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.mgmt.model.arm.ModelCategory;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.IJavaTemplate;

import java.util.HashSet;
import java.util.Set;

public class FluentResourceModelInterfaceTemplate implements IJavaTemplate<FluentResourceModel, JavaFile> {

    private static final FluentResourceModelInterfaceTemplate INSTANCE = new FluentResourceModelInterfaceTemplate();

    public static FluentResourceModelInterfaceTemplate getInstance() {
        return INSTANCE;
    }

    private static final FluentResourceModelInterfaceDefinitionTemplate DEFINITION_TEMPLATE = new FluentResourceModelInterfaceDefinitionTemplate();
    private static final FluentResourceModelInterfaceUpdateTemplate UPDATE_TEMPLATE = new FluentResourceModelInterfaceUpdateTemplate();

    @Override
    public void write(FluentResourceModel model, JavaFile javaFile) {
        Set<String> imports = new HashSet<>();
        //imports.add(Immutable.class.getName());
        model.addImportsTo(imports, false);
        javaFile.declareImport(imports);

        javaFile.javadocComment(comment -> {
            comment.description(model.getDescription());
        });

        //javaFile.annotation("Immutable");
        javaFile.publicInterface(model.getInterfaceType().getName(), interfaceBlock -> {
            // method for properties
            model.getProperties().forEach(property -> {
                interfaceBlock.javadocComment(comment -> {
                    comment.description(String.format("Gets the %1$s property: %2$s", property.getName(), property.getDescription()));
                    comment.methodReturns(String.format("the %1$s value", property.getName()));
                });
                interfaceBlock.publicMethod(property.getMethodSignature());
            });

            // additional methods
            model.getAdditionalMethods().forEach(m -> m.writeMethodInterface(interfaceBlock));

            // method for inner model
            interfaceBlock.javadocComment(comment -> {
                comment.description(String.format("Gets the inner %s object", model.getInnerModel().getFullName()));
                comment.methodReturns("the inner object");
            });
            interfaceBlock.publicMethod(model.getInnerMethodSignature());

            // Fluent interfaces and methods
            if (model.getCategory() != ModelCategory.IMMUTABLE) {
                // create flow
                if (model.getResourceCreate() != null) {
                    DEFINITION_TEMPLATE.write(model.getResourceCreate(), interfaceBlock);
                }
                // update flow
                if (model.getResourceUpdate() != null) {
                    UPDATE_TEMPLATE.write(model.getResourceUpdate(), interfaceBlock);
                }
                // refresh
                if (model.getResourceRefresh() != null) {
                    model.getResourceRefresh().getFluentMethods().forEach(
                            refreshMethod -> {
                                interfaceBlock.javadocComment(refreshMethod::writeJavadoc);
                                interfaceBlock.publicMethod(refreshMethod.getInterfaceMethodSignature());
                            });
                }
                if (model.getResourceActions() != null) {
                    model.getResourceActions().getFluentMethods().forEach(
                            refreshMethod -> {
                                interfaceBlock.javadocComment(refreshMethod::writeJavadoc);
                                interfaceBlock.publicMethod(refreshMethod.getInterfaceMethodSignature());
                            });
                }
            }
        });
    }
}
