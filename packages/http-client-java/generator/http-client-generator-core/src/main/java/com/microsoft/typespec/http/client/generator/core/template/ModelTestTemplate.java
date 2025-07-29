// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.azure.json.JsonProviders;
import com.azure.json.JsonWriter;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleHelperFeature;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleNode;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.example.ModelExampleWriter;
import com.microsoft.typespec.http.client.generator.core.util.ConstantStringTooLongException;
import com.microsoft.typespec.http.client.generator.core.util.ModelExampleUtil;
import com.microsoft.typespec.http.client.generator.core.util.ModelTestCaseUtil;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class ModelTestTemplate implements IJavaTemplate<ModelTestTemplate.ModelUnitTestInfo, JavaFile> {

    private static final ModelTestTemplate INSTANCE = new ModelTestTemplate();

    private ModelTestTemplate() {
    }

    public static ModelTestTemplate getInstance() {
        return INSTANCE;
    }

    public static final class ModelUnitTestInfo {
        private final String className;
        private final ClientModel model;

        public ModelUnitTestInfo(String className, ClientModel model) {
            this.className = className;
            this.model = model;
        }
    }

    /**
     * Write the JSON serialization / de-serialization unit test for the model.
     *
     * @param testInfo the info, which include the client model to test.
     * @param javaFile the java file.
     * @throws com.microsoft.typespec.http.client.generator.core.util.PossibleCredentialException
     * thrown when there is possible mock value to a secret property.
     * Even when the value is mocked, it could be flagged by CI as issue. Therefore, the case is skipped.
     * @throws com.microsoft.typespec.http.client.generator.core.util.ConstantStringTooLongException
     * thrown when the String representation of the JSON is too long (>= 2^16).
     * Constant string of that size would cause compiler "constant string too long" error.
     */
    @Override
    public void write(ModelUnitTestInfo testInfo, JavaFile javaFile) {

        String className = testInfo.className;
        ClientModel model = testInfo.model;

        final boolean immutableOutputModel = JavaSettings.getInstance().isOutputModelImmutable()
            && model.getImplementationDetails() != null
            && !model.getImplementationDetails().isInput();

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

        String jsonStringExpression = ClassType.STRING.defaultValueExpression(jsonStr);
        if (jsonStringExpression.length() >= 65536) {
            // Java compiler would give "constant string too long" error on the generated file.
            // The length of a string constant in a class file is limited to 2^16 bytes in UTF-8 encoding.
            // There is also a related "code too large" error, for limit on Java method size in bytecode.
            throw new ConstantStringTooLongException();
        }

        javaFile.publicFinalClass(className, classBlock -> {
            // testDeserialize
            classBlock.annotation("org.junit.jupiter.api.Test");
            classBlock.publicMethod("void testDeserialize() throws Exception", methodBlock -> {
                methodBlock.line(String.format("%1$s model = BinaryData.fromString(%2$s).toObject(%1$s.class);",
                    model.getName(), jsonStringExpression));
                writer.writeAssertion(methodBlock);
            });

            if (!immutableOutputModel) {
                // testSerialize
                classBlock.annotation("org.junit.jupiter.api.Test");
                String methodSignature = "void testSerialize() throws Exception";
                classBlock.publicMethod(methodSignature, methodBlock -> {
                    methodBlock.line(
                        String.format("%1$s model = %2$s;", model.getName(), writer.getModelInitializationCode()));
                    methodBlock.line(
                        String.format("model = BinaryData.fromObject(model).toObject(%1$s.class);", model.getName()));
                    writer.writeAssertion(methodBlock);
                });

                if (writer.getHelperFeatures().contains(ExampleHelperFeature.MapOfMethod)) {
                    ModelExampleWriter.writeMapOfMethod(classBlock);
                }
            }
        });
    }
}
