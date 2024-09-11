// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.mgmt.model.arm.ModelCategory;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.LocalVariable;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceImplementation;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.immutablemodel.ImmutableMethod;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.IJavaTemplate;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class FluentResourceModelImplementationTemplate implements IJavaTemplate<FluentResourceModel, JavaFile> {

    private static final FluentResourceModelImplementationTemplate INSTANCE = new FluentResourceModelImplementationTemplate();

    public static FluentResourceModelImplementationTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(FluentResourceModel model, JavaFile javaFile) {
        ClassType managerType = FluentStatic.getFluentManager().getType();

        List<MethodTemplate> methodTemplates = new ArrayList<>();
        model.getProperties().forEach(p -> methodTemplates.add(p.getImplementationMethodTemplate()));
        methodTemplates.addAll(model.getAdditionalMethods());

        Set<String> imports = new HashSet<>();
        /* use full name for FooManager, to avoid naming conflict
        // manager
        imports.add(managerType.getFullName());
         */
        model.addImportsTo(imports, true);
        javaFile.declareImport(imports);

        List<String> implementInterfaces = new ArrayList<>();
        implementInterfaces.add(model.getInterfaceType().getName());
        if (model.getResourceCreate() != null) {
            implementInterfaces.add(String.format("%1$s.%2$s", model.getInterfaceType().getName(), ModelNaming.MODEL_FLUENT_INTERFACE_DEFINITION));
        }
        if (model.getResourceUpdate() != null) {
            implementInterfaces.add(String.format("%1$s.%2$s", model.getInterfaceType().getName(), ModelNaming.MODEL_FLUENT_INTERFACE_UPDATE));
        }

        javaFile.publicFinalClass(String.format("%1$s implements %2$s", model.getImplementationType().getName(), String.join(", ", implementInterfaces)), classBlock -> {
            // variable for inner model
            classBlock.privateMemberVariable(model.getInnerModel().getName(), ModelNaming.MODEL_PROPERTY_INNER);

            // variable for manager
            classBlock.privateFinalMemberVariable(managerType.getFullName(), ModelNaming.MODEL_PROPERTY_MANAGER);

            // if resource is updatable, use the constructor from resourceUpdate
            if (model.getCategory() == ModelCategory.IMMUTABLE || model.getResourceUpdate() == null) {
                // constructor
                classBlock.packagePrivateConstructor(String.format("%1$s(%2$s %3$s, %4$s %5$s)", model.getImplementationType().getName(), model.getInnerModel().getName(), ModelNaming.MODEL_PROPERTY_INNER, managerType.getFullName(), ModelNaming.MODEL_PROPERTY_MANAGER), methodBlock -> {
                    methodBlock.line(String.format("this.%1$s = %2$s;", ModelNaming.MODEL_PROPERTY_INNER, ModelNaming.MODEL_PROPERTY_INNER));
                    methodBlock.line(String.format("this.%1$s = %2$s;", ModelNaming.MODEL_PROPERTY_MANAGER, ModelNaming.MODEL_PROPERTY_MANAGER));
                });
            }

            // method for properties
            methodTemplates.forEach(m -> m.writeMethodWithoutJavadoc(classBlock));

            // method for inner model
            classBlock.publicMethod(model.getInnerMethodSignature(), methodBlock -> {
                methodBlock.methodReturn(String.format("this.%s", ModelNaming.MODEL_PROPERTY_INNER));
            });

            // method for manager
            classBlock.privateMethod(String.format("%1$s %2$s()", managerType.getFullName(), FluentUtils.getGetterName(ModelNaming.METHOD_MANAGER)), methodBlock -> {
                methodBlock.methodReturn(String.format("this.%s", ModelNaming.MODEL_PROPERTY_MANAGER));
            });

            // methods for fluent interfaces
            // class variables
            if (model.getCategory() != ModelCategory.IMMUTABLE) {
                ResourceImplementation resourceImplementation = model.getResourceImplementation();
                List<ImmutableMethod> fluentMethods = resourceImplementation.getMethods();
                List<LocalVariable> localVariables = resourceImplementation.getLocalVariables();

                localVariables.forEach(p -> classBlock.privateMemberVariable(p.getVariableType().toString(), p.getName()));

                fluentMethods.forEach(m -> {
                    m.getMethodTemplate().writeMethod(classBlock);
                });
            }
        });
    }
}
