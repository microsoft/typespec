// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.LongRunningMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.LongRunningOperationIdMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Metadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

public class TypeSpecPluginLroTests extends JavaSettingsTestBase {
    @TempDir
    Path compilationDirectory;

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void operationIdHelpersCompileWithEitherPollingStrategy(boolean operationLocationStrategy) throws Exception {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));

        LongRunningOperationIdMetadata operationId = new LongRunningOperationIdMetadata();
        operationId.setPathTemplate("/operations/{id}");
        operationId.setPathParameterSerializedName("id");
        operationId.setPollingHeaderName("operation-location");
        LongRunningMetadata metadata = new LongRunningMetadata();
        metadata.setOperationId(operationId);
        Language java = new Language();
        java.setName(operationLocationStrategy ? "OperationLocationPollingStrategy" : "DefaultPollingStrategy");
        Languages languages = new Languages();
        languages.setJava(java);
        Metadata strategy = new Metadata();
        strategy.setLanguage(languages);
        metadata.setPollingStrategy(strategy);
        Operation operation = new Operation();
        operation.setLroMetadata(metadata);
        OperationGroup group = new OperationGroup();
        group.setOperations(List.of(operation));
        com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client codeModelClient
            = new com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client();
        codeModelClient.setOperationGroups(List.of(group));
        CodeModel codeModel = new CodeModel();
        codeModel.setClients(List.of(codeModelClient));

        JavaPackage output = new JavaPackage(plugin);
        plugin.writeHelperClasses(new Client.Builder().models(List.of()).build(), codeModel, output,
            JavaSettings.getInstance());

        List<String> arguments = new ArrayList<>(
            List.of("-classpath", System.getProperty("java.class.path"), "-d", compilationDirectory.toString()));
        for (JavaFile file : output.getJavaFiles()) {
            Path path = compilationDirectory.resolve(file.getFilePath());
            Files.createDirectories(path.getParent());
            Files.writeString(path, file.getContents().toString());
            arguments.add(path.toString());
        }
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        Assertions.assertEquals(0,
            ToolProvider.getSystemJavaCompiler().run(null, diagnostics, diagnostics, arguments.toArray(new String[0])),
            diagnostics.toString(StandardCharsets.UTF_8));
        Assertions.assertEquals(1,
            output.getJavaFiles().stream().filter(file -> file.getFilePath().endsWith("/PollingUtils.java")).count());
    }
}
