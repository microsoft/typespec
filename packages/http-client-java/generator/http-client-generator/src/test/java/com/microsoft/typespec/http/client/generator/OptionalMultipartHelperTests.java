// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.KnownMediaType;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import io.clientcore.core.serialization.json.JsonReader;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@Isolated
@Execution(ExecutionMode.SAME_THREAD)
class OptionalMultipartHelperTests {
    @AfterEach
    void clearSettings() {
        JavaSettings.clear();
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    void pluginSelectsMultipartMethodsFromGeneratedCalls(String flavor) throws Exception {
        List<JavaFile> helpers = helpers(flavor, "class Caller { Object body = new MultipartFormDataHelper(null)"
            + ".serializeTextField(\"name\", \"value\").end().getRequestBody(); }");
        Assertions.assertEquals(1, helpers.size());
        Assertions.assertEquals(Set.of("serializeTextField", "end", "getRequestBody", "appendBytes", "escapeName"),
            methods(helpers.get(0)));
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    void unusedMultipartModelsDoNotEmitAnUnusedHelper(String flavor) throws Exception {
        Assertions.assertTrue(helpers(flavor, "class Caller {}").isEmpty());
    }

    @Test
    void azureV1KeepsTheExistingMultipartCatalog() throws Exception {
        List<JavaFile> helpers = helpers("azure", "class Caller {}");
        Assertions.assertEquals(1, helpers.size());
        Assertions.assertEquals(Set.of("serializeTextField", "serializeJsonField", "serializeFileField",
            "serializeFileFields", "end", "getRequestBody", "appendBytes", "escapeName", "writeFileField"),
            methods(helpers.get(0)));
    }

    private static List<JavaFile> helpers(String flavor, String source) throws Exception {
        JavaSettings.clear();
        TypeSpecPlugin plugin;
        try (JsonReader reader
            = JsonReader.fromString("{\"namespace\":\"com.example\",\"flavor\":\"" + flavor + "\"}")) {
            plugin = new TypeSpecPlugin(EmitterOptions.fromJson(reader), false);
        }
        JavaPackage output = new JavaPackage(plugin);
        JavaFile caller = new JavaFile("Caller.java");
        caller.line(source);
        output.getJavaFiles().add(caller);
        ClientModel multipart = new ClientModel.Builder().name("MultipartRequest")
            .packageName("com.example")
            .properties(List.of())
            .serializationFormats(Set.of(KnownMediaType.MULTIPART.value()))
            .implementationDetails(
                new ImplementationDetails.Builder().usages(Set.of(ImplementationDetails.Usage.PUBLIC)).build())
            .build();
        Client client = new Client.Builder().models(List.of(multipart)).build();
        plugin.writeHelperClasses(client, new CodeModel(), output, JavaSettings.getInstance());
        return output.getJavaFiles().subList(1, output.getJavaFiles().size());
    }

    private static Set<String> methods(JavaFile file) {
        return StaticJavaParser.parse(file.getContents().toString())
            .findAll(MethodDeclaration.class)
            .stream()
            .map(MethodDeclaration::getNameAsString)
            .collect(Collectors.toSet());
    }
}
