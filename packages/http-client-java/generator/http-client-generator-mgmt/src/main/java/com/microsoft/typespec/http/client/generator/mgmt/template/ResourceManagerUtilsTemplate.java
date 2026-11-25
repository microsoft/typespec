// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaModifier;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.ClientUtilitiesTemplate;
import com.microsoft.typespec.http.client.generator.core.template.IJavaTemplate;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class ResourceManagerUtilsTemplate
    implements IJavaTemplate<Set<ResourceManagerUtilsTemplate.UtilityMethod>, JavaFile> {

    public enum UtilityMethod {
        GET_VALUE_FROM_ID("getValueFromIdByParameterName"),
        GET_REQUIRED_VALUE_FROM_ID("getRequiredValueFromIdByParameterName"),
        MAP_PAGE("mapPage");

        private final String methodName;

        UtilityMethod(String methodName) {
            this.methodName = methodName;
        }

        public String getMethodName() {
            return methodName;
        }
    }

    private static final ResourceManagerUtilsTemplate INSTANCE = new ResourceManagerUtilsTemplate();

    public static ResourceManagerUtilsTemplate getInstance() {
        return INSTANCE;
    }

    private static final MethodTemplate GET_VALUE_FROM_ID = MethodTemplate.builder()
        .imports(List.of(Arrays.class.getName()))
        .visibility(JavaVisibility.PackagePrivate)
        .modifiers(List.of(JavaModifier.Static))
        .methodSignature("String getValueFromIdByParameterName(String id, String pathTemplate, String parameterName)")
        .method(block -> block
            .line(FluentUtils.loadTextFromResource("ResourceManagerUtils_getValueFromIdByParameterName.txt")))
        .build();

    private static final MethodTemplate GET_REQUIRED_VALUE_FROM_ID = MethodTemplate.builder()
        .imports(List.of(ClassType.CLIENT_LOGGER.getFullName()))
        .visibility(JavaVisibility.PackagePrivate)
        .modifiers(List.of(JavaModifier.Static))
        .methodSignature("String getRequiredValueFromIdByParameterName(String id, String pathTemplate, "
            + "String parameterName, String segmentName, ClientLogger logger)")
        .method(block -> {
            block.line("String value = getValueFromIdByParameterName(id, pathTemplate, parameterName);");
            block.ifBlock("value == null",
                invalid -> invalid.line("throw logger.logExceptionAsError(new IllegalArgumentException(String.format("
                    + "\"The resource ID '%s' is not valid. Missing path segment '%s'.\", id, segmentName)));"));
            block.methodReturn("value");
        })
        .build();

    private static final List<String> IMPORTS_UTILS_PAGED_ITERABLE = List.of(ClassType.PAGED_FLUX.getFullName(),
        ClassType.FLUX.getFullName(), ClassType.PAGED_ITERABLE.getFullName(), ClassType.PAGED_RESPONSE.getFullName(),
        ClassType.PAGED_RESPONSE_BASE.getFullName(), Iterator.class.getName(), Function.class.getName(),
        Collectors.class.getName(), Stream.class.getName());

    @Override
    public void write(Set<UtilityMethod> usedMethods, JavaFile javaFile) {
        write(usedMethods, Set.of(), javaFile);
    }

    public void write(Set<UtilityMethod> usedMethods, Set<ClientUtilitiesTemplate.UtilityMethod> commonMethods,
        JavaFile javaFile) {
        List<MethodTemplate> methods = new ArrayList<>();
        // The validating helper calls the nullable parser even when no client calls it directly.
        if (usedMethods.contains(UtilityMethod.GET_VALUE_FROM_ID)
            || usedMethods.contains(UtilityMethod.GET_REQUIRED_VALUE_FROM_ID)) {
            methods.add(GET_VALUE_FROM_ID);
        }
        if (usedMethods.contains(UtilityMethod.GET_REQUIRED_VALUE_FROM_ID)) {
            methods.add(GET_REQUIRED_VALUE_FROM_ID);
        }
        Set<String> imports = new LinkedHashSet<>();
        methods.forEach(mt -> mt.addImportsTo(imports));
        if (usedMethods.contains(UtilityMethod.MAP_PAGE)) {
            imports.addAll(IMPORTS_UTILS_PAGED_ITERABLE);
        }
        javaFile.declareImport(imports);
        ClientUtilitiesTemplate.addImports(commonMethods, javaFile);

        javaFile.classBlock(
            commonMethods.contains(ClientUtilitiesTemplate.UtilityMethod.READ_OBJECT)
                ? JavaVisibility.Public
                : JavaVisibility.PackagePrivate,
            List.of(JavaModifier.Final), ModelNaming.CLASS_RESOURCE_MANAGER_UTILS, classBlock -> {
                classBlock.constructor(JavaVisibility.Private, ModelNaming.CLASS_RESOURCE_MANAGER_UTILS + "()",
                    constructorBlock -> {
                    });
                methods.forEach(mt -> mt.writeMethod(classBlock));
                ClientUtilitiesTemplate.writeMethods(commonMethods, classBlock);

                if (usedMethods.contains(UtilityMethod.MAP_PAGE)) {
                    javaFile.line();
                    javaFile.text(FluentUtils.loadTextFromResource("ResourceManagerUtils_PagedIterableImpl.txt"));
                }
            });
    }
}
