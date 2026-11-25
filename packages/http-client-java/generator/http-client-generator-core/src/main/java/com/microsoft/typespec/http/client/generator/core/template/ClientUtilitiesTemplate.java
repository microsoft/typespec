// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import java.io.IOException;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * Shared implementation utilities, emitted only when referenced by generated code.
 */
public final class ClientUtilitiesTemplate {
    public enum UtilityMethod {
        READ_OBJECT("readObject"),
        WITH_CONTEXT("withContext"),
        VALIDATE_NOT_NULL("validateNotNull"),
        CREATE_PAGED_RESPONSE("createPagedResponse");

        private final String methodName;

        UtilityMethod(String methodName) {
            this.methodName = methodName;
        }
    }

    private ClientUtilitiesTemplate() {
    }

    public static String getClassName() {
        return JavaSettings.getInstance().isFluent() ? "ResourceManagerUtils" : "ClientUtils";
    }

    public static String getFullClassName() {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackage(settings.getImplementationSubpackage()) + "." + getClassName();
    }

    public static Set<UtilityMethod> getUsedMethods(List<JavaFile> files) {
        Set<UtilityMethod> used = EnumSet.noneOf(UtilityMethod.class);
        for (JavaFile file : files) {
            String source = file.getContents().toString();
            for (UtilityMethod method : UtilityMethod.values()) {
                if (source.contains(getClassName() + "." + method.methodName + "(")) {
                    used.add(method);
                }
            }
        }
        return used;
    }

    public static void addImports(Set<UtilityMethod> methods, JavaFile file) {
        Set<String> imports = new LinkedHashSet<>();
        if (methods.contains(UtilityMethod.READ_OBJECT)) {
            imports.add(ClassType.JSON_READER.getFullName());
            imports.add(ClassType.JSON_TOKEN.getFullName());
            imports.add(IOException.class.getName());
            imports.add(Supplier.class.getName());
        }
        if (methods.contains(UtilityMethod.WITH_CONTEXT)) {
            imports.add(ClassType.CONTEXT.getFullName());
            imports.add(ClassType.MONO.getFullName());
            imports.add(ClassType.FLUX_UTIL.getFullName());
            imports.add(Supplier.class.getName());
            imports.add(Function.class.getName());
        }
        if (methods.contains(UtilityMethod.CREATE_PAGED_RESPONSE)) {
            imports.add(ClassType.RESPONSE.getFullName());
            imports.add(ClassType.PAGED_RESPONSE.getFullName());
            imports.add(ClassType.PAGED_RESPONSE_BASE.getFullName());
            imports.add(List.class.getName());
        }
        file.declareImport(imports);
    }

    public static void write(Set<UtilityMethod> methods, JavaFile file) {
        addImports(methods, file);
        file.javadocComment(comment -> comment.description("Shared implementation utilities."));
        file.publicFinalClass(getClassName(), classBlock -> {
            classBlock.constructor(JavaVisibility.Private, getClassName() + "()", block -> {
            });
            writeMethods(methods, classBlock);
        });
    }

    public static void writeMethods(Set<UtilityMethod> methods, JavaClass classBlock) {
        if (methods.contains(UtilityMethod.READ_OBJECT)) {
            classBlock.publicStaticMethod(
                "<T> T readObject(JsonReader jsonReader, Supplier<T> factory, ReadObjectCallback<T> callback) throws IOException",
                block -> {
                    block.line("return jsonReader.readObject(reader -> {");
                    block.indent(() -> {
                        block.line("T model = factory.get();");
                        block.block("while (reader.nextToken() != JsonToken.END_OBJECT)", loop -> {
                            loop.line("String fieldName = reader.getFieldName();");
                            loop.line("reader.nextToken();");
                            loop.line("callback.read(model, fieldName, reader);");
                        });
                        block.methodReturn("model");
                    });
                    block.line("});");
                });
            classBlock.interfaceBlock(JavaVisibility.Public, "ReadObjectCallback<T>", callback -> callback
                .publicMethod("void read(T model, String fieldName, JsonReader reader) throws IOException"));
        }
        if (methods.contains(UtilityMethod.WITH_CONTEXT)) {
            classBlock.publicStaticMethod(
                "<T> Mono<T> withContext(Function<Context, Mono<T>> serviceCall, Supplier<Context> clientContext)",
                block -> block.methodReturn("FluxUtil.withContext(serviceCall)"
                    + ".contextWrite(context -> context.putAll(FluxUtil.toReactorContext(clientContext.get()).readOnly()))"));
        }
        if (methods.contains(UtilityMethod.VALIDATE_NOT_NULL)) {
            classBlock.publicStaticMethod("IllegalArgumentException validateNotNull(Object value, String name)",
                block -> block.methodReturn("value == null ? new IllegalArgumentException("
                    + "\"Parameter \" + name + \" is required and cannot be null.\") : null"));
        }
        if (methods.contains(UtilityMethod.CREATE_PAGED_RESPONSE)) {
            classBlock.publicStaticMethod(
                "<T, H> PagedResponse<T> createPagedResponse(Response<?> response, List<T> values, String nextLink, H deserializedHeaders)",
                block -> block.methodReturn("new PagedResponseBase<>(response.getRequest(), response.getStatusCode(), "
                    + "response.getHeaders(), values, nextLink, deserializedHeaders)"));
        }
    }
}
