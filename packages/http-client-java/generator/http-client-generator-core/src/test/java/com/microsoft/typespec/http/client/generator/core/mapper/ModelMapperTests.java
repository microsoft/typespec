// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.json.JsonProviders;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;
import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantValue;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Discriminator;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Relations;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SchemaContext;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.StreamSerializationModelTemplate;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@Isolated
public class ModelMapperTests {
    @TempDir
    Path compilationDirectory;

    @BeforeEach
    @AfterEach
    public void resetModelsAndSettings() {
        ClientModels.getInstance().clear();
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @ParameterizedTest
    @CsvSource({ "1,false", "1,true", "2,false", "2,true" })
    public void untaggedIntermediatesDoNotSelectDiscriminatorValues(int depth, boolean shareJsonCode) throws Exception {
        new MockUnitJavagen() {
            @Override
            @SuppressWarnings("unchecked")
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                return "share-jsonserializable-code".equals(key)
                    ? (T) Boolean.valueOf(shareJsonCode)
                    : super.getValue(key, converter);
            }
        };
        JavaSettings.clear();
        ObjectSchema root = object("PetBase", null);
        discriminator(root, "kind");
        root.getProperties().add(property("name", new StringSchema()));
        ObjectSchema parent = root;
        for (int i = 0; i < depth; i++) {
            parent = object("Mammal" + i, parent);
            if (i == 0) {
                parent.getProperties().add(property("coat", new StringSchema()));
            }
        }
        ObjectSchema cat = object("Cat", parent);
        cat.setDiscriminatorValue("cat");
        cat.getProperties().add(property("kind", constant("cat")));
        cat.getProperties().add(property("sound", new StringSchema()));

        ClientModel mappedRoot = ModelMapper.getInstance().map(root);
        ClientModel mappedCat = ClientModels.getInstance().getModel("Cat");
        Assertions.assertEquals("\"cat\"", mappedCat.getPolymorphicDiscriminator().getDefaultValue());
        Assertions.assertTrue(mappedCat.getParentPolymorphicDiscriminators().isEmpty());
        ClientModel intermediate = mappedRoot.getDerivedModels().get(0);
        Assertions.assertNull(intermediate.getPolymorphicDiscriminatorName());
        Assertions.assertTrue(intermediate.getParentPolymorphicDiscriminators().isEmpty());

        String rootSource = compileModels(mappedRoot);
        Assertions.assertTrue(rootSource.contains("\"cat\".equals(discriminatorValue)"), rootSource);
        Assertions.assertFalse(rootSource.contains("\"Mammal0\".equals(discriminatorValue)"), rootSource);
        String json = "{\"kind\":\"cat\",\"name\":\"Milo\",\"coat\":\"tabby\",\"sound\":\"meow\"}";
        try (
            URLClassLoader loader
                = new URLClassLoader(new URL[] { compilationDirectory.toUri().toURL() }, getClass().getClassLoader());
            JsonReader reader = JsonProviders.createReader(json)) {
            Class<?> rootClass = loader.loadClass(mappedRoot.getFullName());
            Object deserialized = rootClass.getMethod("fromJson", JsonReader.class).invoke(null, reader);
            Assertions.assertEquals(mappedCat.getFullName(), deserialized.getClass().getName());
            Assertions.assertEquals("tabby", deserialized.getClass().getMethod("getCoat").invoke(deserialized));
            Assertions.assertEquals("meow", deserialized.getClass().getMethod("getSound").invoke(deserialized));
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            try (JsonWriter writer = JsonProviders.createWriter(output)) {
                writer.writeJson((JsonSerializable<?>) deserialized);
            }
            String serialized = output.toString(StandardCharsets.UTF_8);
            Assertions.assertEquals(serialized.indexOf("\"kind\""), serialized.lastIndexOf("\"kind\""));
            try (JsonReader roundTrip = JsonProviders.createReader(serialized)) {
                Assertions.assertEquals(Map.of("kind", "cat", "name", "Milo", "coat", "tabby", "sound", "meow"),
                    roundTrip.readMap(JsonReader::getString));
            }
        }
    }

    @Test
    public void nestedDiscriminatorRetainsFixedOuterSelection() {
        ObjectSchema root = object("Base", null);
        discriminator(root, "kind");
        ObjectSchema message = object("Message", root);
        message.setDiscriminatorValue("message");
        discriminator(message, "role");
        ObjectSchema assistant = object("Assistant", message);
        assistant.setDiscriminatorValue("assistant");

        ModelMapper.getInstance().map(root);
        ClientModel mapped = ClientModels.getInstance().getModel("Assistant");
        Assertions.assertEquals("role", mapped.getPolymorphicDiscriminatorName());
        Assertions.assertEquals(1, mapped.getParentPolymorphicDiscriminators().size());
        Assertions.assertEquals("kind", mapped.getParentPolymorphicDiscriminators().get(0).getSerializedName());
        Assertions.assertEquals("\"message\"", mapped.getParentPolymorphicDiscriminators().get(0).getDefaultValue());
    }

    private String compileModels(ClientModel root) throws Exception {
        List<String> arguments = new ArrayList<>(
            List.of("-classpath", System.getProperty("java.class.path"), "-d", compilationDirectory.toString()));
        String rootSource = null;
        for (ClientModel model : ClientModels.getInstance().getModels()) {
            JavaFile file = new JavaFile(model.getName() + ".java");
            file.declarePackage(model.getPackage());
            StreamSerializationModelTemplate.getInstance().write(model, file);
            String source = file.getContents().toString();
            if (model == root) {
                rootSource = source;
            }
            Path path = compilationDirectory.resolve(model.getName() + ".java");
            Files.writeString(path, source);
            arguments.add(path.toString());
        }
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        Assertions.assertEquals(0,
            ToolProvider.getSystemJavaCompiler().run(null, diagnostics, diagnostics, arguments.toArray(new String[0])),
            diagnostics.toString(StandardCharsets.UTF_8));
        return rootSource;
    }

    private static ObjectSchema object(String name, ObjectSchema parent) {
        ObjectSchema schema = new ObjectSchema();
        schema.setType(Schema.AllSchemaTypes.OBJECT);
        schema.setLanguage(language(name));
        schema.setUsage(Set.of(SchemaContext.INPUT, SchemaContext.OUTPUT, SchemaContext.PUBLIC));
        schema.setChildren(new Relations());
        schema.getChildren().setImmediate(new ArrayList<>());
        schema.getChildren().setAll(new ArrayList<>());
        schema.setParents(new Relations());
        schema.getParents().setImmediate(new ArrayList<>());
        schema.getParents().setAll(new ArrayList<>());
        if (parent != null) {
            schema.getParents().getImmediate().add(parent);
            schema.getParents().getAll().add(parent);
            schema.getParents().getAll().addAll(parent.getParents().getAll());
            parent.getChildren().getImmediate().add(schema);
            parent.getChildren().getAll().add(schema);
            for (Schema ancestor : parent.getParents().getAll()) {
                ((ObjectSchema) ancestor).getChildren().getAll().add(schema);
            }
        }
        return schema;
    }

    private static void discriminator(ObjectSchema schema, String name) {
        Property property = property(name, new StringSchema());
        property.setIsDiscriminator(true);
        Discriminator discriminator = new Discriminator();
        discriminator.setProperty(property);
        schema.setDiscriminator(discriminator);
    }

    private static Property property(String name, Schema schema) {
        if (schema instanceof StringSchema) {
            schema.setType(Schema.AllSchemaTypes.STRING);
        }
        Property property = new Property();
        property.setLanguage(language(name));
        property.setSerializedName(name);
        property.setSchema(schema);
        return property;
    }

    private static ConstantSchema constant(String value) {
        ConstantSchema schema = new ConstantSchema();
        schema.setType(Schema.AllSchemaTypes.CONSTANT);
        StringSchema string = new StringSchema();
        string.setType(Schema.AllSchemaTypes.STRING);
        schema.setValueType(string);
        ConstantValue constant = new ConstantValue();
        constant.setValue(value);
        schema.setValue(constant);
        return schema;
    }

    private static Languages language(String name) {
        Languages languages = new Languages();
        Language language = new Language();
        language.setName(name);
        languages.setDefault(language);
        languages.setJava(language);
        return languages;
    }
}
