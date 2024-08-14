// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.template.prototype;

import com.azure.autorest.model.javamodel.JavaBlock;
import com.azure.autorest.model.javamodel.JavaClass;
import com.azure.autorest.model.javamodel.JavaInterface;
import com.azure.autorest.model.javamodel.JavaJavadocComment;
import com.azure.autorest.model.javamodel.JavaModifier;
import com.azure.autorest.model.javamodel.JavaVisibility;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.function.Consumer;

public class MethodTemplate {

    private final Set<String> imports;

    private final JavaVisibility visibility;
    private final List<JavaModifier> modifiers;
    private final String methodSignature;

    private final Consumer<JavaJavadocComment> comment;
    private final Consumer<JavaBlock> method;

    private MethodTemplate(Set<String> imports,
                           JavaVisibility visibility, List<JavaModifier> modifiers, String methodSignature,
                           Consumer<JavaJavadocComment> comment, Consumer<JavaBlock> method) {
        this.imports = imports;
        this.visibility = visibility;
        this.modifiers = modifiers;
        this.methodSignature = methodSignature;
        this.comment = comment;
        this.method = method;
    }

    public final void addImportsTo(Set<String> imports) {
        imports.addAll(this.imports);
    }

    public final void writeMethod(JavaClass javaClass) {
        if (comment != null) {
            javaClass.javadocComment(comment);
        }
        writeMethodWithoutJavadoc(javaClass);
    }

    public final void writeMethodWithoutJavadoc(JavaClass javaClass) {
        javaClass.method(visibility, modifiers, methodSignature, method);
    }

    public final void writeMethodInterface(JavaInterface javaInterface) {
        if (visibility == JavaVisibility.Public) {
            if (comment != null) {
                javaInterface.javadocComment(comment);
            }
            javaInterface.publicMethod(methodSignature);
        }
    }

    public final void writeMethodContent(JavaBlock block) {
        method.accept(block);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private final Set<String> imports = new HashSet<>();
        private JavaVisibility visibility = JavaVisibility.Public;
        private final List<JavaModifier> modifiers = new ArrayList<>();
        private String methodSignature;
        private Consumer<JavaJavadocComment> comment = null;
        private Consumer<JavaBlock> method = m -> {};

        private Builder() {
        }

        public Builder imports(Collection<String> imports) {
            this.imports.addAll(imports);
            return this;
        }

        public Builder visibility(JavaVisibility visibility) {
            this.visibility = visibility;
            return this;
        }

        public Builder modifiers(Collection<JavaModifier> modifiers) {
            this.modifiers.addAll(modifiers);
            return this;
        }

        public Builder methodSignature(String methodSignature) {
            this.methodSignature = methodSignature;
            return this;
        }

        public Builder comment(Consumer<JavaJavadocComment> comment) {
            this.comment = comment;
            return this;
        }

        public Builder method(Consumer<JavaBlock> method) {
            this.method = method;
            return this;
        }

        public MethodTemplate build() {
            Objects.requireNonNull(methodSignature);
            return new MethodTemplate(imports, visibility, modifiers, methodSignature, comment, method);
        }
    }
}
