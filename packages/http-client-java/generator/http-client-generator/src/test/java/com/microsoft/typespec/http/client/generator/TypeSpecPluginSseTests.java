// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModuleInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class TypeSpecPluginSseTests extends JavaSettingsTestBase {
    @Test
    public void exportsEventPackagesOnceAlongsideOrdinaryModelPackages() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        ModuleInfo moduleInfo = new ModuleInfo("com.azure.mock");
        moduleInfo.getExportModules().add(new ModuleInfo.ExportModule("com.azure.shared.models"));
        Client client = new Client.Builder().moduleInfo(moduleInfo)
            .models(List.of())
            .sseStreams(List.of(method("FirstEvents", "com.azure.events").getSseMetadata(),
                method("SecondEvents", "com.azure.events").getSseMetadata(),
                method("SharedEvents", "com.azure.shared").getSseMetadata()))
            .serviceClients(List.of(new ServiceClient.Builder().className("TestClientImpl")
                .methodGroupClients(List.of())
                .clientMethods(List.of(method("FirstEvents", "com.azure.events"),
                    method("SecondEvents", "com.azure.events"), method("SharedEvents", "com.azure.shared")))
                .build()))
            .build();
        JavaPackage javaPackage = new JavaPackage(plugin);

        plugin.writeHelperClasses(client, new CodeModel(), javaPackage, JavaSettings.getInstance());
        javaPackage.addModuleInfo(moduleInfo);

        Assertions.assertEquals(List.of("com.azure.shared.models", "com.azure.events.models"),
            moduleInfo.getExportModules()
                .stream()
                .map(ModuleInfo.ExportModule::getModuleName)
                .collect(Collectors.toList()));
        String moduleSource
            = javaPackage.getJavaFiles().get(javaPackage.getJavaFiles().size() - 1).getContents().toString();
        Assertions.assertTrue(moduleSource.contains("exports com.azure.events.models;"));
    }

    @Test
    public void unusedCatalogEntriesDoNotEmitRuntimeOrModels() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        CodeModel model = new CodeModel();
        model.setSseStreams(Map.of("Test.Events", method("UnusedEvents", "com.azure.mock").getSseMetadata()));
        JavaPackage javaPackage = new JavaPackage(plugin);
        plugin.writeHelperClasses(new Client.Builder().models(List.of()).build(), model, javaPackage,
            JavaSettings.getInstance());
        Assertions.assertTrue(javaPackage.getJavaFiles().isEmpty());
    }

    private static ClientMethod method(String streamName, String namespace) {
        StringSchema payload = new StringSchema();
        payload.setType(Schema.AllSchemaTypes.STRING);
        SseEventMetadata event = new SseEventMetadata();
        event.setName("message");
        event.setPayload(payload);
        SseMetadata metadata = new SseMetadata();
        metadata.setStreamName(streamName);
        metadata.setModelNamespace(namespace);
        metadata.setEvents(List.of(event));
        return new ClientMethod.Builder().name("read").parameters(List.of()).sseMetadata(metadata).build();
    }
}
