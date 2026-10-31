// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt;

import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SchemaContext;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.preprocessor.Preprocessor;
import com.microsoft.typespec.http.client.generator.core.preprocessor.tranformer.Transformer;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.mgmt.namer.FluentNamerFactory;
import com.microsoft.typespec.http.client.generator.mgmt.transformer.FluentTransformer;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;

public class FluentNamer extends Preprocessor {

    private final Logger logger;
    private static FluentNamer instance;

    public FluentNamer(NewPlugin plugin, Connection connection, String pluginName, String sessionId) {
        super(plugin, connection, pluginName, sessionId);
        this.logger = new PluginLogger(this, FluentNamer.class);
        FluentNamer.instance = this;
    }

    public static FluentNamer getPluginInstance() {
        return instance;
    }

    public CodeModel processCodeModel() {
        this.clear();

        try {
            Path codeModelFolder = createCodeModelDirectory();
            CodeModel codeModel = getCodeModelAndWriteToTargetFolder(codeModelFolder);
            // Do necessary transformation
            codeModel = transform(codeModel);
            if (codeModelFolder != null) {
                dumpCodeModel(codeModel, codeModelFolder.resolve("code-model-fluentnamer-no-tags.yaml"));
            }

            return codeModel;
        } catch (Exception e) {
            logger.error("Failed to successfully run fluentnamer plugin.", e);
            throw new RuntimeException("Failed to successfully run fluentnamer plugin.", e);
        }
    }

    protected CodeModel getCodeModelAndWriteToTargetFolder(Path codeModelFolder) throws IOException {
        List<String> files = listInputs().stream().filter(s -> s.contains("no-tags")).collect(Collectors.toList());
        if (files.size() != 1) {
            throw new RuntimeException(String.format("Generator received incorrect number of inputs: %s : %s}",
                files.size(), String.join(", ", files)));
        }
        // Read input file
        String file = readFile(files.get(0));
        // Write the input code model file to a local code model file to help debugging
        if (codeModelFolder != null) {
            Files.writeString(codeModelFolder.resolve("code-model.yaml"), file);
        }
        // Deserialize the input code model string to CodeModel object
        return loadCodeModel(file);
    }

    private CodeModel loadCodeModel(String file) throws IOException {
        return yamlMapper.loadAs(file, CodeModel.class);
    }

    public CodeModel transform(CodeModel codeModel) {
        logger.info("Load fluent settings");
        FluentJavaSettings fluentJavaSettings = new FluentJavaSettings(this);
        CodeNamer.setFactory(new FluentNamerFactory(fluentJavaSettings));

        // Step 2: Transform
        logger.info("Transform code model");
        removeSseSchemas(codeModel);
        FluentTransformer transformer = new FluentTransformer(fluentJavaSettings);
        codeModel = transformer.preTransform(codeModel);

        codeModel = new Transformer().transform(codeModel);

        codeModel = transformer.postTransform(codeModel);

        return codeModel;
    }

    static void removeSseSchemas(CodeModel codeModel) {
        codeModel.getSchemas()
            .getObjects()
            .removeIf(schema -> schema.getUsage() != null && schema.getUsage().contains(SchemaContext.SSE));
    }

    private void clear() {
        JavaSettings.clear();
    }
}
