// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaModifier;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.IJavaTemplate;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;
import com.azure.core.http.rest.PagedFlux;
import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.PagedResponse;
import com.azure.core.http.rest.PagedResponseBase;
import com.azure.core.util.CoreUtils;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class ResourceManagerUtilsTemplate implements IJavaTemplate<Void, JavaFile> {

    private static final ResourceManagerUtilsTemplate INSTANCE = new ResourceManagerUtilsTemplate();

    public static ResourceManagerUtilsTemplate getInstance() {
        return INSTANCE;
    }

    private static final List<MethodTemplate> METHOD_TEMPLATES = new ArrayList<>();
    static {
        MethodTemplate getValueFromIdByNameMethod = MethodTemplate.builder()
                .imports(Arrays.asList(
                        Arrays.class.getName(),
                        Iterator.class.getName()))
                .visibility(JavaVisibility.PackagePrivate)
                .modifiers(Collections.singletonList(JavaModifier.Static))
                .methodSignature("String getValueFromIdByName(String id, String name)")
                .method(block -> block.line(FluentUtils.loadTextFromResource("ResourceManagerUtils_getValueFromIdByName.txt")))
                .build();
        METHOD_TEMPLATES.add(getValueFromIdByNameMethod);

        MethodTemplate getValueFromIdByParameterNameMethod = MethodTemplate.builder()
                .imports(Arrays.asList(
                        Arrays.class.getName(),
                        Iterator.class.getName(),
                        List.class.getName(),
                        ArrayList.class.getName(),
                        CoreUtils.class.getName(),
                        Collections.class.getName()))
                .visibility(JavaVisibility.PackagePrivate)
                .modifiers(Collections.singletonList(JavaModifier.Static))
                .methodSignature("String getValueFromIdByParameterName(String id, String pathTemplate, String parameterName)")
                .method(block -> block.line(FluentUtils.loadTextFromResource("ResourceManagerUtils_getValueFromIdByParameterName.txt")))
                .build();
        METHOD_TEMPLATES.add(getValueFromIdByParameterNameMethod);
    }

    private static final List<String> IMPORTS_UTILS_PAGED_ITERABLE = Arrays.asList(
            PagedFlux.class.getName(),
            PagedIterable.class.getName(),
            PagedResponse.class.getName(),
            PagedResponseBase.class.getName(),
            Flux.class.getName(),
            Iterator.class.getName(),
            Function.class.getName(),
            Collectors.class.getName(),
            Stream.class.getName()
    );

    public void write(JavaFile javaFile) {
        write(null, javaFile);
    }

    @Override
    public void write(Void ignored, JavaFile javaFile) {
        Set<String> imports = new HashSet<>();
        METHOD_TEMPLATES.forEach(mt -> mt.addImportsTo(imports));
        imports.addAll(IMPORTS_UTILS_PAGED_ITERABLE);
        javaFile.declareImport(imports);

        javaFile.classBlock(JavaVisibility.PackagePrivate, Collections.singletonList(JavaModifier.Final), ModelNaming.CLASS_RESOURCE_MANAGER_UTILS, classBlock -> {
            classBlock.constructor(JavaVisibility.Private, String.format("%s()", ModelNaming.CLASS_RESOURCE_MANAGER_UTILS), (constructorBlock) -> {});
            METHOD_TEMPLATES.forEach(mt -> mt.writeMethod(classBlock));

            // mapPage and PagedIterableImpl class
            javaFile.line();
            String configurableClassText = FluentUtils.loadTextFromResource("ResourceManagerUtils_PagedIterableImpl.txt");
            javaFile.text(configurableClassText);
        });
    }
}
