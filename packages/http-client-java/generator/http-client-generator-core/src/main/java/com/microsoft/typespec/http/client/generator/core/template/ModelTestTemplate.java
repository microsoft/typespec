// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleHelperFeature;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleNode;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.example.ModelExampleWriter;
import com.microsoft.typespec.http.client.generator.core.util.ModelExampleUtil;
import com.microsoft.typespec.http.client.generator.core.util.ModelTestCaseUtil;
import com.azure.json.JsonProviders;
import com.azure.json.JsonWriter;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class ModelTestTemplate implements IJavaTemplate<ClientModel, JavaFile> {

    private static final ModelTestTemplate INSTANCE = new ModelTestTemplate();

    private ModelTestTemplate() {
    }

    public static ModelTestTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(ClientModel model, JavaFile javaFile) {

        final boolean immutableOutputModel = JavaSettings.getInstance().isOutputModelImmutable()
                && model.getImplementationDetails() != null && !model.getImplementationDetails().isInput();

        Set<String> imports = new HashSet<>();
        model.addImportsTo(imports, JavaSettings.getInstance());
        ClassType.BINARY_DATA.addImportsTo(imports, false);

        String jsonStr;
        ExampleNode exampleNode;
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JsonWriter jsonWriter = JsonProviders.createWriter(outputStream)) {
            Map<String, Object> jsonObject = ModelTestCaseUtil.jsonFromModel(model);
            jsonWriter.writeMap(jsonObject, JsonWriter::writeUntyped).flush();
            jsonStr = outputStream.toString(StandardCharsets.UTF_8);

            exampleNode = ModelExampleUtil.parseNode(model.getType(), jsonObject);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to serialize Map to JSON string", e);
        }

        ModelExampleWriter writer = new ModelExampleWriter(exampleNode, "model");
        imports.addAll(writer.getImports());

        javaFile.declareImport(imports);

        javaFile.publicFinalClass(model.getName() + "Tests", classBlock -> {
            // testDeserialize
            classBlock.annotation("org.junit.jupiter.api.Test");
            classBlock.publicMethod("void testDeserialize() throws Exception", methodBlock -> {
                methodBlock.line(String.format("%1$s model = BinaryData.fromString(%2$s).toObject(%1$s.class);",
                        model.getName(), ClassType.STRING.defaultValueExpression(jsonStr)));
                writer.writeAssertion(methodBlock);
            });

            if (!immutableOutputModel) {
                // testSerialize
                classBlock.annotation("org.junit.jupiter.api.Test");
                String methodSignature = "void testSerialize() throws Exception";
                classBlock.publicMethod(methodSignature, methodBlock -> {
                    methodBlock.line(String.format("%1$s model = %2$s;",
                            model.getName(), writer.getModelInitializationCode()));
                    methodBlock.line(String.format("model = BinaryData.fromObject(model).toObject(%1$s.class);",
                            model.getName()));
                    writer.writeAssertion(methodBlock);
                });

                if (writer.getHelperFeatures().contains(ExampleHelperFeature.MapOfMethod)) {
                    ModelExampleWriter.writeMapOfMethod(classBlock);
                }
            }
        });
    }
}
