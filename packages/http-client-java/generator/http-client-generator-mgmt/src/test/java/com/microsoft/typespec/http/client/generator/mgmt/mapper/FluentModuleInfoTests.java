// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schemas;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModuleInfo;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated("Fluent mapping uses shared client state")
public class FluentModuleInfoTests {
    @Test
    public void omitsEmptyModelPackages() {
        assertModelPackages(List.of(), List.of(), List.of(), List.of());
    }

    @Test
    public void requestModelDoesNotRequireInnerModels() {
        String modelsPackage = JavaSettings.getInstance().getPackage("models");
        assertModelPackages(List.of(model(modelsPackage, "Request")), List.of(), List.of(modelsPackage),
            List.of(modelsPackage));
    }

    @Test
    public void exportsAndOpensEnumOnlyPackage() {
        String modelsPackage = JavaSettings.getInstance().getPackage("models");
        EnumType enumType = new EnumType.Builder().packageName(modelsPackage).name("Status").build();
        assertModelPackages(List.of(), List.of(enumType), List.of(modelsPackage), List.of(modelsPackage));
    }

    @Test
    public void preservesPopulatedModelPackages() {
        JavaSettings settings = JavaSettings.getInstance();
        String innerPackage = settings.getPackage("fluent.models");
        String modelsPackage = settings.getPackage("models");
        String implementationPackage = settings.getPackage("implementation.models");
        assertModelPackages(
            List.of(model(innerPackage, "ResourceInner"), model(modelsPackage, "Request"),
                model(implementationPackage, "Page")),
            List.of(), List.of(innerPackage, modelsPackage),
            List.of(innerPackage, modelsPackage, implementationPackage));
    }

    @Test
    public void opensImplementationModelsWithoutExportingThem() {
        String implementationPackage = JavaSettings.getInstance().getPackage("implementation.models");
        assertModelPackages(List.of(model(implementationPackage, "Page")), List.of(), List.of(),
            List.of(implementationPackage));
    }

    private static ClientModel model(String packageName, String name) {
        return new ClientModel.Builder().packageName(packageName).name(name).build();
    }

    private static void assertModelPackages(List<ClientModel> models, List<EnumType> enums,
        List<String> expectedExports, List<String> expectedOpens) {
        Client client = new Client.Builder().models(models)
            .enums(enums)
            .exceptions(List.of())
            .responseModels(List.of())
            .xmlSequenceWrappers(List.of())
            .build();
        CodeModel codeModel = new CodeModel();
        Language language = new Language();
        language.setName("MockManagementClient");
        Languages languages = new Languages();
        languages.setJava(language);
        codeModel.setLanguage(languages);
        codeModel.setSchemas(new Schemas());
        codeModel.setOperationGroups(List.of());

        ModuleInfo moduleInfo
            = new FluentMapper(new FluentJavaSettings(FluentGen.getPluginInstance())).basicMap(codeModel, client)
                .getModuleInfo();

        JavaSettings settings = JavaSettings.getInstance();
        List<String> exports
            = new ArrayList<>(List.of(settings.getPackage(), settings.getPackage(settings.getFluentSubpackage())));
        exports.addAll(expectedExports);
        assertEquals(exports,
            moduleInfo.getExportModules()
                .stream()
                .map(ModuleInfo.ExportModule::getModuleName)
                .collect(Collectors.toList()));
        assertEquals(expectedOpens,
            moduleInfo.getOpenModules()
                .stream()
                .map(ModuleInfo.OpenModule::getModuleName)
                .collect(Collectors.toList()));
    }
}
