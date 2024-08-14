// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceVersion;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

public class ServiceVersionTemplate implements IJavaTemplate<ServiceVersion, JavaFile> {
    private static final ServiceVersionTemplate INSTANCE = new ServiceVersionTemplate();
    private static final Pattern VERSION_TO_ENUM = Pattern.compile("[-.]");

    public static ServiceVersionTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(ServiceVersion serviceVersion, JavaFile javaFile) {
        // imports
        Set<String> imports = new HashSet<>();
        imports.add("com.azure.core.util.ServiceVersion");
        javaFile.declareImport(imports);

        javaFile.javadocComment(comment -> {
            comment.description("Service version of " + serviceVersion.getServiceName());
        });

        String className = serviceVersion.getClassName();
        List<String> serviceVersions = serviceVersion.getServiceVersions();

        javaFile.publicEnum(className + " implements ServiceVersion", classBlock -> {
            serviceVersions.forEach(v -> {
                classBlock.value(getVersionIdentifier(v), v);
            });

            classBlock.privateFinalMemberVariable("String", "version");

            classBlock.constructor(
                    className + "(String version)",
                    javaBlock -> javaBlock.line("this.version = version;")
            );

            classBlock.javadocComment(JavaJavadocComment::inheritDoc);
            classBlock.annotation("Override");
            classBlock.publicMethod(
                    "String getVersion()",
                    javaBlock -> javaBlock.line("return this.version;")
            );

            classBlock.javadocComment(comment -> {
                comment.description("Gets the latest service version supported by this client library");
                comment.methodReturns(String.format("The latest {@link %s}", className));
            });
            classBlock.publicStaticMethod(
                    className + " getLatest()",
                    javaBlock -> javaBlock.methodReturn(
                            getVersionIdentifier(serviceVersions.get(serviceVersions.size() - 1)))
            );
        });
    }

    private String getVersionIdentifier(String version) {
        String versionInEnum = VERSION_TO_ENUM.matcher(version).replaceAll("_").toUpperCase();
        if (!versionInEnum.startsWith("V")) {
            versionInEnum = "V" + versionInEnum;
        }
        return versionInEnum;
    }
}
