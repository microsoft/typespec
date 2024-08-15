// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentCollectionMethodExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentMethodExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentResourceCreateExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentResourceUpdateExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.ParameterExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleHelperFeature;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.example.ModelExampleWriter;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class FluentExampleTemplate {

    private static final FluentExampleTemplate INSTANCE = new FluentExampleTemplate();

    public static FluentExampleTemplate getInstance() {
        return INSTANCE;
    }

    public final void write(com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentExample example, JavaFile javaFile) {
        String className = example.getClassName();

        List<ExampleMethod> exampleMethods = getExampleMethods(example);

        Set<String> imports = exampleMethods.stream().flatMap(em -> em.getImports().stream()).collect(Collectors.toSet());
        javaFile.declareImport(imports);

        Set<ExampleHelperFeature> helperFeatures = exampleMethods.stream().flatMap(em -> em.getHelperFeatures().stream()).collect(Collectors.toSet());

        javaFile.javadocComment(commentBlock -> {
            commentBlock.description(String.format("Samples for %1$s %2$s", example.getGroupName(), example.getMethodName()));
        });
        javaFile.publicFinalClass(className, classBlock -> {
            for (ExampleMethod exampleMethod : exampleMethods) {
                if (!CoreUtils.isNullOrEmpty(exampleMethod.getExample().getOriginalFileName())) {
                    classBlock.blockComment(getExampleTag(exampleMethod.getExample()));
                }

                classBlock.javadocComment(commentBlock -> {
                    commentBlock.description(String.format("Sample code: %1$s", exampleMethod.getExample().getName()));
                    commentBlock.param(exampleMethod.getExample().getEntryName(),
                            exampleMethod.getExample().getEntryDescription());
                });
                String methodSignature = exampleMethod.getMethodSignature();
                if (exampleMethod.getHelperFeatures().contains(ExampleHelperFeature.ThrowsIOException)) {
                    methodSignature += " throws IOException";
                }
                classBlock.publicStaticMethod(methodSignature, methodBlock -> {
                    methodBlock.line(exampleMethod.getMethodContent());
                });
            }

            if (helperFeatures.contains(ExampleHelperFeature.MapOfMethod)) {
                ModelExampleWriter.writeMapOfMethod(classBlock);
            }
        });
    }

    private List<ExampleMethod> getExampleMethods(com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentExample example) {
        List<ExampleMethod> exampleMethods = new ArrayList<>();
        exampleMethods.addAll(
                example.getResourceCreateExamples().stream()
                        .map(this::generateExampleMethod)
                        .collect(Collectors.toList()));
        exampleMethods.addAll(
                example.getResourceUpdateExamples().stream()
                        .map(this::generateExampleMethod)
                        .collect(Collectors.toList()));
        exampleMethods.addAll(
                example.getCollectionMethodExamples().stream()
                        .map(this::generateExampleMethod)
                        .collect(Collectors.toList()));
        exampleMethods.addAll(
                example.getClientMethodExamples().stream()
                        .map(this::generateExampleMethod)
                        .collect(Collectors.toList()));
        return exampleMethods;
    }

    private String getExampleTag(FluentExample example) {
        return "x-ms-original-file: " + example.getOriginalFileName();
    }

    public ExampleMethod generateExampleMethod(FluentMethodExample methodExample) {
        String methodName = CodeNamer.toCamelCase(CodeNamer.removeInvalidCharacters(methodExample.getName()));
        String managerName = methodExample.getEntryName();

        ExampleNodeVisitor visitor = new ExampleNodeVisitor();
        String parameterInvocations = methodExample.getParameters().stream()
                .map(p -> visitor.accept(p.getExampleNode()))
                .collect(Collectors.joining(", "));

        String snippet = String.format("%1$s.%2$s.%3$s(%4$s);",
                managerName,
                methodExample.getMethodReference(),
                methodExample.getMethodName(),
                parameterInvocations);

        ExampleMethod exampleMethod = new ExampleMethod()
                .setExample(methodExample)
                .setImports(visitor.getImports())
                .setMethodSignature(String.format("void %1$s(%2$s %3$s)", methodName, methodExample.getEntryType().getFullName(), managerName))
                .setMethodContent(snippet)
                .setHelperFeatures(visitor.getHelperFeatures());
        return exampleMethod;
    }

    public ExampleMethod generateExampleMethod(FluentResourceCreateExample resourceCreateExample) {
        String methodName = CodeNamer.toCamelCase(CodeNamer.removeInvalidCharacters(resourceCreateExample.getName()));
        String managerName = resourceCreateExample.getEntryName();

        ExampleNodeVisitor visitor = new ExampleNodeVisitor();
        StringBuilder sb = new StringBuilder(managerName)
                .append(".").append(CodeNamer.toCamelCase(resourceCreateExample.getResourceCollection().getInterfaceType().getName())).append("()");
        for (ParameterExample parameter : resourceCreateExample.getParameters()) {
            String parameterInvocations = parameter.getExampleNodes().stream()
                    .map(visitor::accept)
                    .collect(Collectors.joining(", "));
            if (parameter.getExampleNodes().size() == 1 && parameterInvocations.equals("null")) {
                // more likely this is an invalid example, as these properties/parameters is required and cannot be null

                IType clientType = parameter.getExampleNodes().iterator().next().getClientType();
                if (clientType instanceof PrimitiveType) {
                    // for primitive type, use language default value
                    parameterInvocations = String.format("%1$s", clientType.defaultValueExpression());
                } else {
                    // avoid ambiguous type on "null"
                    parameterInvocations = String.format("(%1$s) %2$s", clientType, parameterInvocations);
                }
            }
            sb.append(".").append(parameter.getFluentMethod().getName())
                    .append("(").append(parameterInvocations).append(")");
        }
        sb.append(".create();");

        ExampleMethod exampleMethod = new ExampleMethod()
                .setExample(resourceCreateExample)
                .setImports(visitor.getImports())
                .setMethodSignature(String.format("void %1$s(%2$s %3$s)", methodName, FluentStatic.getFluentManager().getType().getFullName(), managerName))
                .setMethodContent(sb.toString())
                .setHelperFeatures(visitor.getHelperFeatures());
        return exampleMethod;
    }

    public ExampleMethod generateExampleMethod(FluentResourceUpdateExample resourceUpdateExample) {
        String methodName = CodeNamer.toCamelCase(CodeNamer.removeInvalidCharacters(resourceUpdateExample.getName()));
        String managerName = resourceUpdateExample.getEntryName();

        ExampleNodeVisitor visitor = new ExampleNodeVisitor();

        FluentCollectionMethodExample resourceGetExample = resourceUpdateExample.getResourceGetExample();
        String parameterInvocations = resourceGetExample.getParameters().stream()
                .map(p -> visitor.accept(p.getExampleNode()))
                .collect(Collectors.joining(", "));

        String resourceGetSnippet = String.format("%1$s %2$s = %3$s.%4$s().%5$s(%6$s).getValue();\n",
                resourceUpdateExample.getResourceUpdate().getResourceModel().getInterfaceType().getName(),
                "resource",
                managerName,
                CodeNamer.toCamelCase(resourceGetExample.getResourceCollection().getInterfaceType().getName()),
                resourceGetExample.getCollectionMethod().getMethodName(),
                parameterInvocations);

        StringBuilder sb = new StringBuilder(resourceGetSnippet);
        sb.append("resource").append(".update()");
        for (ParameterExample parameter : resourceUpdateExample.getParameters()) {
            parameterInvocations = parameter.getExampleNodes().stream()
                    .map(visitor::accept)
                    .collect(Collectors.joining(", "));
            sb.append(".").append(parameter.getFluentMethod().getName())
                    .append("(").append(parameterInvocations).append(")");
        }
        sb.append(".apply();");

        resourceUpdateExample.getResourceUpdate().getResourceModel().getInterfaceType().addImportsTo(visitor.getImports(), false);

        ExampleMethod exampleMethod = new ExampleMethod()
                .setExample(resourceUpdateExample)
                .setImports(visitor.getImports())
                .setMethodSignature(String.format("void %1$s(%2$s %3$s)", methodName, FluentStatic.getFluentManager().getType().getFullName(), managerName))
                .setMethodContent(sb.toString())
                .setHelperFeatures(visitor.getHelperFeatures());
        return exampleMethod;
    }

    private static class ExampleNodeVisitor extends ModelExampleWriter.ExampleNodeModelInitializationVisitor {

        @Override
        protected String codeDeserializeJsonString(String jsonStr) {
            imports.add(com.azure.core.management.serializer.SerializerFactory.class.getName());
            imports.add(com.azure.core.util.serializer.SerializerEncoding.class.getName());
            imports.add(java.io.IOException.class.getName());

            return String.format("SerializerFactory.createDefaultManagementSerializerAdapter().deserialize(%s, Object.class, SerializerEncoding.JSON)",
                    ClassType.STRING.defaultValueExpression(jsonStr));
        }
    }

    public static class ExampleMethod {
        private FluentExample example;
        private Set<String> imports;
        private String methodSignature;
        private String methodContent;
        private Set<ExampleHelperFeature> helperFeatures;

        public FluentExample getExample() {
            return example;
        }

        public ExampleMethod setExample(FluentExample example) {
            this.example = example;
            return this;
        }

        public Set<String> getImports() {
            return imports;
        }

        public ExampleMethod setImports(Set<String> imports) {
            this.imports = imports;
            return this;
        }

        private String getMethodSignature() {
            return methodSignature;
        }

        private ExampleMethod setMethodSignature(String methodSignature) {
            this.methodSignature = methodSignature;
            return this;
        }

        String getMethodContent() {
            return methodContent;
        }

        private ExampleMethod setMethodContent(String methodContent) {
            this.methodContent = methodContent;
            return this;
        }

        public Set<ExampleHelperFeature> getHelperFeatures() {
            return helperFeatures;
        }

        public ExampleMethod setHelperFeatures(Set<ExampleHelperFeature> helperFeatures) {
            this.helperFeatures = helperFeatures;
            return this;
        }
    }
}
