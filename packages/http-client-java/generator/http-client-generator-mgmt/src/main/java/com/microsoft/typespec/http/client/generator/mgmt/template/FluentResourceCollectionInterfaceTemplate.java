// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentDefineMethod;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.ClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.template.IJavaTemplate;

import java.util.HashSet;
import java.util.Set;

public class FluentResourceCollectionInterfaceTemplate implements IJavaTemplate<FluentResourceCollection, JavaFile> {

    private static final FluentResourceCollectionInterfaceTemplate INSTANCE = new FluentResourceCollectionInterfaceTemplate();

    public static FluentResourceCollectionInterfaceTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(FluentResourceCollection collection, JavaFile javaFile) {
        Set<String> imports = new HashSet<>();
        collection.addImportsTo(imports, false);
        collection.getResourceCreates().forEach(rc -> rc.getDefineMethod().addImportsTo(imports, false));
        javaFile.declareImport(imports);

        javaFile.javadocComment(comment -> {
            comment.description(collection.getDescription());
        });

        javaFile.publicInterface(collection.getInterfaceType().getName(), interfaceBlock -> {
            // methods
            collection.getMethodsForTemplate().forEach(method -> {
                ClientMethodTemplate.generateJavadoc(method.getInnerClientMethod(), interfaceBlock, method.getInnerProxyMethod(), true);

                interfaceBlock.publicMethod(method.getMethodSignature());
            });

            collection.getAdditionalMethods().forEach(method -> method.writeMethodInterface(interfaceBlock));

//            // method for inner client
//            interfaceBlock.javadocComment(comment -> {
//                comment.description(String.format("Gets the inner %s client", collection.getInnerClientType().getFullName()));
//                comment.methodReturns("the inner client");
//            });
//            interfaceBlock.publicMethod(collection.getInnerMethodSignature());

            // method for define resource
            int resourceCount = collection.getResourceCreates().size();
            collection.getResourceCreates()
                    .forEach(rc -> {
                        FluentDefineMethod defineMethod = rc.getDefineMethod();
                        if (resourceCount == 1) {
                            defineMethod.setName("define");
                        }

                        interfaceBlock.javadocComment(defineMethod::writeJavadoc);
                        interfaceBlock.publicMethod(defineMethod.getInterfaceMethodSignature());
                    });
        });
    }
}
