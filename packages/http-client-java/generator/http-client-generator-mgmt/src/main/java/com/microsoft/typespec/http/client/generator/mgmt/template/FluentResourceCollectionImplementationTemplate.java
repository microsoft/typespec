// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentDefineMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.IJavaTemplate;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class FluentResourceCollectionImplementationTemplate implements IJavaTemplate<FluentResourceCollection, JavaFile> {

    private static final FluentResourceCollectionImplementationTemplate INSTANCE = new FluentResourceCollectionImplementationTemplate();

    public static FluentResourceCollectionImplementationTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(FluentResourceCollection collection, JavaFile javaFile) {
        ClassType managerType = FluentStatic.getFluentManager().getType();

        Set<String> imports = new HashSet<>();
        // ClientLogger
        ClassType.CLIENT_LOGGER.addImportsTo(imports, false);
        /* use full name for FooManager, to avoid naming conflict
        // manager
        imports.add(managerType.getFullName());
         */
        // resource collection
        collection.addImportsTo(imports, true);
        if (collection.getResourceCreates() != null) {
            collection.getResourceCreates().forEach(rc -> rc.getDefineMethod().addImportsTo(imports, true));
        }
        javaFile.declareImport(imports);

        List<MethodTemplate> methodTemplates = new ArrayList<>();
        collection.getMethodsForTemplate().forEach(p -> methodTemplates.add(p.getImplementationMethodTemplate()));
        methodTemplates.addAll(collection.getAdditionalMethods());

        javaFile.publicFinalClass(String.format("%1$s implements %2$s", collection.getImplementationType().getName(), collection.getInterfaceType().getName()), classBlock -> {
            // logger
            classBlock.privateStaticFinalVariable(String.format("%1$s LOGGER = new ClientLogger(%2$s.class)",
                    ClassType.CLIENT_LOGGER, collection.getImplementationType().getName()));

            // variable for inner model
            classBlock.privateFinalMemberVariable(collection.getInnerClientType().getName(), ModelNaming.COLLECTION_PROPERTY_INNER);

            // variable for manager
            classBlock.privateFinalMemberVariable(managerType.getFullName(), ModelNaming.COLLECTION_PROPERTY_MANAGER);

            // constructor
            classBlock.publicConstructor(String.format("%1$s(%2$s %3$s, %4$s %5$s)", collection.getImplementationType().getName(), collection.getInnerClientType().getName(), ModelNaming.COLLECTION_PROPERTY_INNER, managerType.getFullName(), ModelNaming.MODEL_PROPERTY_MANAGER), methodBlock -> {
                methodBlock.line(String.format("this.%1$s = %2$s;", ModelNaming.COLLECTION_PROPERTY_INNER, ModelNaming.COLLECTION_PROPERTY_INNER));
                methodBlock.line(String.format("this.%1$s = %2$s;", ModelNaming.COLLECTION_PROPERTY_MANAGER, ModelNaming.COLLECTION_PROPERTY_MANAGER));
            });

            // method for properties
            methodTemplates.forEach(m -> m.writeMethodWithoutJavadoc(classBlock));

            // method for inner model
            classBlock.privateMethod(collection.getInnerMethodSignature(), methodBlock -> {
                methodBlock.methodReturn(String.format("this.%s", ModelNaming.COLLECTION_PROPERTY_INNER));
            });

            // method for manager
            classBlock.privateMethod(String.format("%1$s %2$s()", managerType.getFullName(), FluentUtils.getGetterName(ModelNaming.METHOD_MANAGER)), methodBlock -> {
                methodBlock.methodReturn(String.format("this.%s", ModelNaming.MODEL_PROPERTY_MANAGER));
            });

            // method for define resource
            int resourceCount = collection.getResourceCreates().size();
            collection.getResourceCreates()
                    .forEach(rc -> {
                        FluentMethod defineMethod = rc.getDefineMethod();
                        if (resourceCount == 1) {
                            ((FluentDefineMethod) defineMethod).setName("define");
                        }

                        defineMethod.getMethodTemplate().writeMethod(classBlock);
                    });
        });
    }
}
