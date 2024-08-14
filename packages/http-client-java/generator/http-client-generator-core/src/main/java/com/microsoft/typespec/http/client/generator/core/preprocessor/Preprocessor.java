// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.preprocessor;

import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;
import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import com.microsoft.typespec.http.client.generator.core.extension.model.MessageChannel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceValue;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SealedChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.FileUtils;
import com.microsoft.typespec.http.client.generator.core.preprocessor.tranformer.Transformer;
import com.azure.json.JsonProviders;
import com.azure.json.JsonReader;
import com.azure.json.ReadValueCallback;
import org.slf4j.Logger;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;
import org.yaml.snakeyaml.inspector.TrustedTagInspector;
import org.yaml.snakeyaml.introspector.Property;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.Tag;
import org.yaml.snakeyaml.representer.Representer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

public class Preprocessor extends NewPlugin {
    private final NewPlugin wrappedPlugin;
    private final Logger logger;
    protected static Preprocessor instance;

    public Preprocessor(NewPlugin wrappedPlugin, Connection connection, String plugin, String sessionId) {
        super(connection, plugin, sessionId);
        this.wrappedPlugin = wrappedPlugin;
        this.logger = new PluginLogger(this, Preprocessor.class);
        instance = this;
    }

    public static Preprocessor getPluginInstance() {
        return instance;
    }

    public CodeModel processCodeModel() {
        List<String> allFiles = listInputs();
        List<String> files = allFiles.stream().filter(s -> s.contains("no-tags")).collect(Collectors.toList());
        if (files.size() != 1) {
            throw new RuntimeException(
                String.format("Generator received incorrect number of inputs: %s : %s}", files.size(),
                    String.join(", ", files)));
        }
        String file = readFile(files.get(0));

        Path codeModelFolder;
        try {
            codeModelFolder = FileUtils.createTempDirectory("code-model" + UUID.randomUUID());
            logger.info("Created temp directory for code model: {}", codeModelFolder);
        } catch (IOException ex) {
            logger.error("Failed to create temp directory for code model.", ex);
            throw new RuntimeException("Failed to create temp directory for code model.", ex);
        }

        try {
            Files.writeString(codeModelFolder.resolve("code-model.yaml"), file);
        } catch (Exception e) {
            //
        }

        CodeModel codeModel;
        try {
            if (!file.startsWith("{")) {
                // YAML
                codeModel = yamlMapper.loadAs(file, CodeModel.class);
            } else {
                try (JsonReader jsonReader = JsonProviders.createReader(file)) {
                    codeModel = CodeModel.fromJson(jsonReader);
                }
            }
        } catch (Exception e) {
            System.err.println("Got an error " + e.getMessage());
            connection.sendError(1, 500, "Cannot parse input into code model: " + e.getMessage());
            throw new RuntimeException("Cannot parse input into code model.", e);
        }

        performPretransformUpdates(codeModel);
        codeModel = new Transformer().transform(codeModel);
        performPosttransformUpdates(codeModel);

        Representer representer = new Representer(new DumperOptions()) {
            @Override
            protected NodeTuple representJavaBeanProperty(Object javaBean, Property property, Object propertyValue,
                Tag customTag) {
                // if value of property is null, ignore it.
                if (propertyValue == null) {
                    return null;
                } else {
                    return super.representJavaBeanProperty(javaBean, property, propertyValue, customTag);
                }
            }
        };
        LoaderOptions loaderOptions = new LoaderOptions();
        loaderOptions.setCodePointLimit(50 * 1024 * 1024);
        loaderOptions.setMaxAliasesForCollections(Integer.MAX_VALUE);
        loaderOptions.setTagInspector(new TrustedTagInspector());
        Yaml newYaml = new Yaml(new Constructor(loaderOptions), representer, new DumperOptions(), loaderOptions);
        String output = newYaml.dump(codeModel);

        try {
            Files.writeString(codeModelFolder.resolve("code-model-processed-no-tags.yaml"), output);
        } catch (Exception e) {
            logger.error("Failed to pre-process the code model.", e);
            throw new RuntimeException("Failed to pre-process the code model.", e);
        }

        return codeModel;
    }

    private CodeModel performPosttransformUpdates(CodeModel codeModel) {
        if (JavaSettings.getInstance().isOptionalConstantAsEnum()) {
            return convertOptionalConstantsToEnum(codeModel);
        }
        return codeModel;
    }

    private CodeModel performPretransformUpdates(CodeModel codeModel) {
        if (JavaSettings.getInstance().isOptionalConstantAsEnum()) {
            return convertOptionalConstantsToEnum(codeModel);
        }
        return codeModel;
    }

    public static CodeModel convertOptionalConstantsToEnum(CodeModel codeModel) {
        Function<ConstantSchema, Boolean> schemaIsConstantWithChoice = schema -> schema.getValueType() instanceof ChoiceSchema;

        Set<ConstantSchema> constantSchemas = new HashSet<>(codeModel.getSchemas().getConstants());
        if (!constantSchemas.isEmpty()) {
            Map<ConstantSchema, SealedChoiceSchema> convertedChoiceSchemas = new HashMap<>();

            codeModel.getOperationGroups().stream().flatMap(og -> og.getOperations().stream()).forEach(o -> {
                o.getParameters().stream().filter(p -> !p.isRequired() && p.getSchema() instanceof ConstantSchema)
                    .forEach(p -> {
                        ConstantSchema constantSchema = (ConstantSchema) p.getSchema();
                        if (schemaIsConstantWithChoice.apply(constantSchema)) {
                            p.setSchema(constantSchema.getValueType());
                        } else {
                            SealedChoiceSchema sealedChoiceSchema = convertedChoiceSchemas.computeIfAbsent(constantSchema,
                                Preprocessor::convertToChoiceSchema);
                            p.setSchema(sealedChoiceSchema);
                        }

                        o.getSignatureParameters().add(p);
                    });

                o.getRequests().forEach(r -> {
                    r.getParameters().stream().filter(p -> !p.isRequired() && p.getSchema() instanceof ConstantSchema)
                        .forEach(p -> {
                            ConstantSchema constantSchema = (ConstantSchema) p.getSchema();
                            if (schemaIsConstantWithChoice.apply(constantSchema)) {
                                p.setSchema(constantSchema.getValueType());
                            } else {
                                SealedChoiceSchema sealedChoiceSchema = convertedChoiceSchemas.computeIfAbsent(
                                    constantSchema, Preprocessor::convertToChoiceSchema);
                                p.setSchema(sealedChoiceSchema);
                            }

                            r.getSignatureParameters().add(p);
                        });
                });
            });

            codeModel.getSchemas().getObjects().stream().flatMap(s -> s.getProperties().stream())
                .filter(p -> !p.isRequired() && p.getSchema() instanceof ConstantSchema)
                .forEach(p -> {
                    ConstantSchema constantSchema = (ConstantSchema) p.getSchema();
                    if (schemaIsConstantWithChoice.apply(constantSchema)) {
                        p.setSchema(constantSchema.getValueType());
                    } else {
                        SealedChoiceSchema sealedChoiceSchema = convertedChoiceSchemas.computeIfAbsent(constantSchema,
                            Preprocessor::convertToChoiceSchema);
                        p.setSchema(sealedChoiceSchema);
                    }
                });

            if (JavaSettings.getInstance().getClientFlattenAnnotationTarget()
                == JavaSettings.ClientFlattenAnnotationTarget.NONE) {
                codeModel.getSchemas().getObjects().stream().flatMap(s -> s.getProperties().stream())
                    .filter(p -> !p.isRequired() && p.getExtensions() != null && p.getExtensions().isXmsClientFlatten())
                    .filter(p -> p.getSchema() instanceof ObjectSchema).forEach(
                        p -> ((ObjectSchema) p.getSchema()).getProperties().stream()
                            .filter(p1 -> p1.getSchema() instanceof ConstantSchema).forEach(p1 -> {
                                ConstantSchema constantSchema = (ConstantSchema) p1.getSchema();
                                SealedChoiceSchema sealedChoiceSchema = convertedChoiceSchemas.computeIfAbsent(
                                    constantSchema, Preprocessor::convertToChoiceSchema);
                                p1.setSchema(sealedChoiceSchema);
                            }));
            }

            codeModel.getSchemas().getSealedChoices().addAll(convertedChoiceSchemas.values());
        }
        return codeModel;
    }

    private static SealedChoiceSchema convertToChoiceSchema(ConstantSchema constantSchema) {
        SealedChoiceSchema sealedChoiceSchema = new SealedChoiceSchema();
        sealedChoiceSchema.setType(Schema.AllSchemaTypes.SEALED_CHOICE);
        sealedChoiceSchema.setChoiceType(constantSchema.getValueType());
        sealedChoiceSchema.setDefaultValue(constantSchema.getDefaultValue());
        sealedChoiceSchema.setLanguage(constantSchema.getLanguage());
        sealedChoiceSchema.setSummary(constantSchema.getSummary());
        sealedChoiceSchema.setUsage(constantSchema.getUsage());

        ChoiceValue choice = new ChoiceValue();
        choice.setValue(constantSchema.getValue().getValue().toString());
        choice.setLanguage(constantSchema.getValue().getLanguage());
        sealedChoiceSchema.setChoices(Collections.singletonList(choice));
        return sealedChoiceSchema;
    }

    @Override
    public String readFile(String fileName) {
        return wrappedPlugin.readFile(fileName);
    }

    @Override
    public <T> T getValue(String key, ReadValueCallback<String, T> converter) {
        return wrappedPlugin.getValue(key, converter);
    }

//    @Override
//    public <K, V> Map<K, V> getMapValue(Class<K> keyType, Class<V> valueType, String key) {
//        return wrappedPlugin.getMapValue(keyType, valueType, key);
//    }
//
//    @Override
//    public <T> List<T> getListValue(Class<T> valueType, String key) {
//        return wrappedPlugin.getListValue(valueType, key);
//    }

    @Override
    public String getStringValue(String key) {
        return wrappedPlugin.getStringValue(key);
    }

    @Override
    public String getStringValue(String key, String defaultValue) {
        return wrappedPlugin.getStringValue(key, defaultValue);
    }

    @Override
    public Boolean getBooleanValue(String key) {
        return wrappedPlugin.getBooleanValue(key);
    }

    @Override
    public boolean getBooleanValue(String key, boolean defaultValue) {
        return wrappedPlugin.getBooleanValue(key, defaultValue);
    }

    @Override
    public List<String> listInputs() {
        return wrappedPlugin.listInputs();
    }

    @Override
    public List<String> listInputs(String artifactType) {
        return wrappedPlugin.listInputs(artifactType);
    }

    @Override
    public void message(Message message) {
        wrappedPlugin.message(message);
    }

    @Override
    public void message(MessageChannel channel, String text, Throwable error, List<String> keys) {
        wrappedPlugin.message(channel, text, error, keys);
    }

    @Override
    public void writeFile(String fileName, String content, List<Object> sourceMap) {
        wrappedPlugin.writeFile(fileName, content, sourceMap);
    }

    @Override
    public void writeFile(String fileName, String content, List<Object> sourceMap, String artifactType) {
        wrappedPlugin.writeFile(fileName, content, sourceMap, artifactType);
    }

    @Override
    public void protectFiles(String path) {
        wrappedPlugin.protectFiles(path);
    }

    @Override
    public String getConfigurationFile(String fileName) {
        return wrappedPlugin.getConfigurationFile(fileName);
    }

    @Override
    public void updateConfigurationFile(String filename, String content) {
        wrappedPlugin.updateConfigurationFile(filename, content);
    }

    @Override
    public boolean process() {
        throw new UnsupportedOperationException("Use processCodeModel instead.");
    }

    @Override
    public boolean processInternal() {
        throw new UnsupportedOperationException("Use processCodeModel instead.");
    }

    private void clear() {
        JavaSettings.clear();
    }
}
