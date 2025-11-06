// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import com.microsoft.typespec.http.client.generator.core.customization.ClassCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.Customization;
import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.PackageCustomization;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import org.slf4j.Logger;

public class KeyVaultCustomization extends Customization {
    @Override
    public void customize(LibraryCustomization customization, Logger logger) {
        PackageCustomization modelsPackage = customization.getPackage("tsptest.armcustomization.fluent.models");

        customizeBaseResource(modelsPackage.getClass("VaultInner"));
    }

    private void customizeBaseResource(ClassCustomization customization) {
        customization.customizeAst(ast -> {
            ast.getClassByName(customization.getClassName()).ifPresent(clazz -> {
                String resourceClassName = "com.azure.core.management.Resource";
                ast.addImport(resourceClassName);
                clazz.getExtendedTypes().clear();
                clazz.addExtendedType(new ClassOrInterfaceType(null, "Resource"));
            });
        });
    }
}
