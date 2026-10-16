// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.json.JsonProviders;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;
import com.azure.xml.XmlReader;
import com.azure.xml.XmlSerializable;
import com.azure.xml.XmlToken;
import com.azure.xml.XmlWriter;
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
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SerializationFormats;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.XmlSerializationFormat;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
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
    @CsvSource({
        "1,false,false,false,false",
        "1,true,false,false,false",
        "2,false,false,false,false",
        "2,true,false,false,false",
        "1,false,true,false,false",
        "1,true,true,false,false",
        "2,false,true,false,false",
        "2,true,true,false,false",
        "1,false,true,true,false",
        "1,true,true,true,false",
        "1,false,true,false,true",
        "1,true,true,false,true",
        "1,false,true,true,true",
        "1,true,true,true,true" })
    public void untaggedIntermediatesDoNotSelectDiscriminatorValues(int depth, boolean shareJsonCode,
        boolean crossPackage, boolean taggedParent, boolean xml) throws Exception {
        configureJsonSharing(shareJsonCode);
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
        if (taggedParent) {
            parent = object("Feline", parent);
            parent.setDiscriminatorValue("feline");
            parent.getLanguage().getJava().setNamespace("com.azure.feline");
        }
        ObjectSchema cat = object("Cat", parent);
        if (crossPackage) {
            cat.getLanguage().getJava().setNamespace("com.azure.cat");
        }
        cat.setDiscriminatorValue("cat");
        cat.getProperties().add(property("kind", constant("cat")));
        cat.getProperties().add(property("sound", new StringSchema()));
        if (xml) {
            configureXml(root);
        }

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
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { compilationDirectory.toUri().toURL() }, getClass().getClassLoader())) {
            Object deserialized = assertRoundTrip(loader, mappedRoot, mappedCat,
                Map.of("kind", "cat", "name", "Milo", "coat", "tabby", "sound", "meow"));
            Assertions.assertEquals("tabby", deserialized.getClass().getMethod("getCoat").invoke(deserialized));
            Assertions.assertEquals("meow", deserialized.getClass().getMethod("getSound").invoke(deserialized));
            if (taggedParent) {
                assertRoundTrip(loader, mappedRoot, ClientModels.getInstance().getModel("Feline"),
                    Map.of("kind", "feline", "name", "Milo", "coat", "tabby"));
            }
        }
    }

    @ParameterizedTest
    @CsvSource({
        "0,0,false,false,false",
        "0,0,true,false,false",
        "1,0,false,false,false",
        "1,0,true,false,false",
        "2,0,false,false,false",
        "2,0,true,false,false",
        "0,1,false,false,false",
        "0,1,true,false,false",
        "0,2,false,false,false",
        "0,2,true,false,false",
        "1,1,false,false,false",
        "1,1,true,false,false",
        "1,2,false,false,false",
        "1,2,true,false,false",
        "2,1,false,false,false",
        "2,1,true,false,false",
        "2,2,false,false,false",
        "2,2,true,false,false",
        "0,0,false,true,false",
        "0,0,true,true,false",
        "1,0,false,true,false",
        "1,0,true,true,false",
        "0,1,false,true,false",
        "0,1,true,true,false",
        "1,1,false,true,false",
        "1,1,true,true,false",
        "1,0,false,false,true",
        "1,0,true,false,true",
        "1,1,false,false,true",
        "1,1,true,false,true",
        "1,0,false,true,true",
        "1,0,true,true,true",
        "1,1,false,true,true",
        "1,1,true,true,true" })
    public void nestedDiscriminatorsCrossUntaggedIntermediates(int before, int after, boolean shareJsonCode,
        boolean xml, boolean crossPackage) throws Exception {
        configureJsonSharing(shareJsonCode);
        Map<String, String> expected = new LinkedHashMap<>(
            Map.of("kind", "message", "role", "assistant", "name", "root", "body", "hello", "answer", "42"));
        ObjectSchema root = object("Base", null);
        discriminator(root, "kind");
        root.getProperties().add(property("name", new StringSchema()));
        ObjectSchema parent = root;
        for (int i = 0; i < before; i++) {
            parent = object("Before" + i, parent);
            parent.getProperties().add(property("before" + i, new StringSchema()));
            expected.put("before" + i, "before" + i);
        }
        ObjectSchema message = object("Message", parent);
        message.setDiscriminatorValue("message");
        discriminator(message, "role");
        Property kind = property("kind", constant("message"));
        kind.setRequired(true);
        message.getProperties().add(kind);
        message.getProperties().add(property("body", new StringSchema()));
        parent = message;
        for (int i = 0; i < after; i++) {
            parent = object("After" + i, parent);
            parent.getProperties().add(property("after" + i, new StringSchema()));
            expected.put("after" + i, "after" + i);
        }
        ObjectSchema assistant = object("Assistant", parent);
        if (crossPackage) {
            message.getLanguage().getJava().setNamespace("com.azure.message");
            assistant.getLanguage().getJava().setNamespace("com.azure.assistant");
        }
        assistant.setDiscriminatorValue("assistant");
        Property role = property("role", constant("assistant"));
        role.setRequired(true);
        assistant.getProperties().add(role);
        assistant.getProperties().add(property("answer", new StringSchema()));
        if (xml) {
            configureXml(root);
        }

        ClientModel mappedRoot = ModelMapper.getInstance().map(root);
        ClientModel mapped = ClientModels.getInstance().getModel("Assistant");
        compileModels(mappedRoot);
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { compilationDirectory.toUri().toURL() }, getClass().getClassLoader())) {
            Object deserialized = assertRoundTrip(loader, mappedRoot, mapped, expected);
            Assertions.assertEquals("message", deserialized.getClass().getMethod("getKind").invoke(deserialized));
            Assertions.assertEquals("assistant", deserialized.getClass().getMethod("getRole").invoke(deserialized));
            expected.remove("answer");
            for (int i = 0; i < after; i++) {
                expected.remove("after" + i);
            }
            expected.put("role", "unknown");
            assertRoundTrip(loader, mappedRoot, ClientModels.getInstance().getModel("Message"), expected);
            Map<String, String> beforeProperties = new LinkedHashMap<>(Map.of("kind", "unknown", "name", "root"));
            for (int i = 0; i < before; i++) {
                beforeProperties.put("before" + i, "before" + i);
                ClientModel intermediate = ClientModels.getInstance().getModel("Before" + i);
                Object value = assertRoundTrip(loader, intermediate, intermediate, beforeProperties);
                Assertions.assertEquals("unknown", value.getClass().getMethod("getKind").invoke(value));
                Map<String, String> knownProperties = new LinkedHashMap<>(beforeProperties);
                knownProperties.put("kind", "message");
                assertRoundTrip(loader, intermediate, intermediate, knownProperties);
            }
            Map<String, String> afterProperties = new LinkedHashMap<>(expected);
            for (int i = 0; i < after; i++) {
                afterProperties.put("after" + i, "after" + i);
                ClientModel intermediate = ClientModels.getInstance().getModel("After" + i);
                Object value = assertRoundTrip(loader, intermediate, intermediate, afterProperties);
                Assertions.assertEquals("unknown", value.getClass().getMethod("getRole").invoke(value));
                Map<String, String> knownProperties = new LinkedHashMap<>(afterProperties);
                knownProperties.put("role", "assistant");
                assertRoundTrip(loader, intermediate, intermediate, knownProperties);
            }
            assertRoundTrip(loader, mappedRoot, mappedRoot, Map.of("kind", "assistant", "name", "root"));
        }
        Assertions.assertEquals("role", mapped.getPolymorphicDiscriminatorName());
        Assertions.assertEquals(1, mapped.getParentPolymorphicDiscriminators().size());
        Assertions.assertEquals("kind", mapped.getParentPolymorphicDiscriminators().get(0).getSerializedName());
        Assertions.assertEquals("\"message\"", mapped.getParentPolymorphicDiscriminators().get(0).getDefaultValue());
    }

    private static void configureJsonSharing(boolean shareJsonCode) {
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
    }

    private static void configureXml(ObjectSchema model) {
        model.setSerializationFormats(Set.of("xml"));
        if (model.getDiscriminator() != null) {
            XmlSerializationFormat xml = new XmlSerializationFormat();
            xml.setAttribute(true);
            SerializationFormats serialization = new SerializationFormats();
            serialization.setXml(xml);
            model.getDiscriminator().getProperty().setSerialization(serialization);
        }
        for (Schema child : model.getChildren().getImmediate()) {
            configureXml((ObjectSchema) child);
        }
    }

    private static Object assertRoundTrip(URLClassLoader loader, ClientModel root, ClientModel expectedModel,
        Map<String, String> expected) throws Exception {
        if (root.isUsedInXml()) {
            return assertXmlRoundTrip(loader, root, expectedModel, expected);
        }
        ByteArrayOutputStream input = new ByteArrayOutputStream();
        try (JsonWriter writer = JsonProviders.createWriter(input)) {
            writer.writeMap(expected, JsonWriter::writeString);
        }
        Object deserialized;
        try (JsonReader reader = JsonProviders.createReader(input.toString(StandardCharsets.UTF_8))) {
            deserialized
                = loader.loadClass(root.getFullName()).getMethod("fromJson", JsonReader.class).invoke(null, reader);
        }
        Assertions.assertEquals(expectedModel.getFullName(), deserialized.getClass().getName());
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (JsonWriter writer = JsonProviders.createWriter(output)) {
            writer.writeJson((JsonSerializable<?>) deserialized);
        }
        String serialized = output.toString(StandardCharsets.UTF_8);
        for (String key : expected.keySet()) {
            String field = "\"" + key + "\":";
            Assertions.assertEquals(serialized.indexOf(field), serialized.lastIndexOf(field), serialized);
        }
        try (JsonReader reader = JsonProviders.createReader(serialized)) {
            Assertions.assertEquals(expected, reader.readMap(JsonReader::getString));
        }
        return deserialized;
    }

    private static Object assertXmlRoundTrip(URLClassLoader loader, ClientModel root, ClientModel expectedModel,
        Map<String, String> expected) throws Exception {
        ByteArrayOutputStream input = new ByteArrayOutputStream();
        try (XmlWriter writer = XmlWriter.toStream(input)) {
            writer.writeStartElement(root.getXmlName());
            for (String discriminator : List.of("kind", "role")) {
                if (expected.containsKey(discriminator)) {
                    writer.writeStringAttribute(discriminator, expected.get(discriminator));
                }
            }
            for (Map.Entry<String, String> field : expected.entrySet()) {
                if (!"kind".equals(field.getKey()) && !"role".equals(field.getKey())) {
                    writer.writeStringElement(field.getKey(), field.getValue());
                }
            }
            writer.writeEndElement();
        }
        Object deserialized;
        try (XmlReader reader = XmlReader.fromBytes(input.toByteArray())) {
            deserialized
                = loader.loadClass(root.getFullName()).getMethod("fromXml", XmlReader.class).invoke(null, reader);
        }
        Assertions.assertEquals(expectedModel.getFullName(), deserialized.getClass().getName());
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (XmlWriter writer = XmlWriter.toStream(output)) {
            writer.writeXml((XmlSerializable<?>) deserialized, root.getXmlName());
        }
        try (XmlReader reader = XmlReader.fromBytes(output.toByteArray())) {
            Map<String, String> actual = reader.readObject(root.getXmlName(), objectReader -> {
                Map<String, String> fields = new LinkedHashMap<>();
                for (String discriminator : List.of("kind", "role")) {
                    String value = objectReader.getStringAttribute(null, discriminator);
                    if (value != null) {
                        fields.put(discriminator, value);
                    }
                }
                while (objectReader.nextElement() != XmlToken.END_ELEMENT) {
                    String name = objectReader.getElementName().getLocalPart();
                    Assertions.assertNull(fields.put(name, objectReader.getStringElement()), name);
                }
                return fields;
            });
            Assertions.assertEquals(expected, actual);
        }
        return deserialized;
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
