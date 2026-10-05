// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.model;

import com.microsoft.typespec.http.client.generator.TypeSpecPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.PomMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import com.microsoft.typespec.http.client.generator.core.template.ProxyTemplate;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.serialization.json.JsonReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@Execution(ExecutionMode.SAME_THREAD)
public final class EmitterOptionsTests {

    @AfterEach
    public void clearSettings() {
        JavaSettings.clear();
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "",
            ",\"dev-options\":{}",
            ",\"dev-options\":{\"generate-protocol-implementation\":false}",
            ",\"dev-options\":{\"generate-protocol-implementation\":null}" })
    public void protocolImplementationIsDisabledByDefault(String devOptions) throws IOException {
        Assertions.assertFalse(generatorSettings(devOptions).isGenerateProtocolImplementation());
    }

    @Test
    public void protocolImplementationCanBeEnabled() throws IOException {
        Assertions.assertTrue(generatorSettings(",\"dev-options\":{\"generate-protocol-implementation\":true}")
            .isGenerateProtocolImplementation());
    }

    @Test
    public void protocolImplementationDoesNotLeakBetweenGeneratorInstances() throws IOException {
        Assertions.assertTrue(generatorSettings(",\"dev-options\":{\"generate-protocol-implementation\":true}")
            .isGenerateProtocolImplementation());
        Assertions.assertFalse(generatorSettings("").isGenerateProtocolImplementation());
    }

    @Test
    public void defaultProxyRemainsAnnotated() throws IOException {
        generatorSettings("");
        String source = renderProxy(false);
        Assertions.assertTrue(source.contains("interface GeneratedService"));
        Assertions.assertTrue(source.contains("@ServiceInterface"));
        Assertions.assertFalse(source.contains("GeneratedCodeUtils"));
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void experimentalProxyUsesConcreteProtocolImplementation(boolean async) throws IOException {
        generatorSettings(",\"dev-options\":{\"generate-protocol-implementation\":true}");
        String source = renderProxy(async);
        Assertions.assertTrue(source.contains("private static final class GeneratedService"));
        Assertions.assertTrue(source.contains("GeneratedCodeUtils.applyRequestOptions"));
        Assertions.assertTrue(source.contains(async ? "validateRequestBodyLengthAsync" : "validateRequestBodyLength("));
        Assertions.assertTrue(source.contains(async ? "this.httpPipeline.send(" : "this.httpPipeline.sendSync("));
        Assertions.assertFalse(source.contains("@ServiceInterface"));
        Assertions.assertFalse(source.contains("RestProxy.create"));
        if (async) {
            Assertions.assertTrue(source.contains("AtomicBoolean"));
            Assertions.assertTrue(source.contains("compareAndSet(false, true)"));
            Assertions.assertTrue(source.contains(".doOnCancel(generatedCloseResponse)"));
        }
    }

    @Test
    public void experimentalProxyRejectsStreamingReturnTypes() throws IOException {
        generatorSettings(",\"dev-options\":{\"generate-protocol-implementation\":true}");
        IllegalStateException error = Assertions.assertThrows(IllegalStateException.class,
            () -> renderProxy(false, GenericType.response(ClassType.INPUT_STREAM)));
        Assertions.assertTrue(error.getMessage().contains("streaming response type"));
        Assertions.assertTrue(error.getMessage().contains("Disable the experimental flag"));
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void experimentalProxyAvoidsParameterNameCollisions(boolean async) throws IOException {
        generatorSettings(",\"dev-options\":{\"generate-protocol-implementation\":true}");
        List<ProxyMethodParameter> parameters
            = new ArrayList<>(List.of(ProxyMethodParameter.REQUEST_OPTIONS_PARAMETER));
        for (String name : List.of("generatedScope", "generatedError", "generatedValidatedRequest",
            "generatedRequest")) {
            parameters.add(new ProxyMethodParameter.Builder().name(name)
                .wireType(ClassType.STRING)
                .clientType(ClassType.STRING)
                .requestParameterLocation(RequestParameterLocation.NONE)
                .build());
        }
        IType returnType = async
            ? GenericType.mono(GenericType.response(ClassType.BINARY_DATA))
            : GenericType.response(ClassType.BINARY_DATA);
        String source = renderProxy(async, returnType, parameters);
        Assertions.assertTrue(source.contains("AutoCloseable generatedScope_ ="));
        Assertions.assertTrue(source.contains("HttpRequest generatedRequest_ ="));
        Assertions.assertTrue(
            source.contains(async ? "catch (Throwable generatedError_)" : "catch (Exception generatedError_)"));
        if (async) {
            Assertions.assertTrue(source.contains(".flatMap(generatedValidatedRequest_ ->"));
            Assertions.assertTrue(source.contains(".doOnError(generatedError_ ->"));
        }
    }

    @Test
    public void experimentalPomRequiresGeneratedCodeHelpers() throws IOException {
        generatorSettings(",\"dev-options\":{\"generate-protocol-implementation\":true}");
        Project project = new Project() {
        };
        Assertions.assertTrue(PomMapper.getInstance()
            .map(project)
            .getDependencyIdentifiers()
            .contains("com.azure:azure-core:1.61.0-beta.1"));

        generatorSettings("");
        Assertions.assertTrue(PomMapper.getInstance()
            .map(project)
            .getDependencyIdentifiers()
            .contains(Project.Dependency.AZURE_CORE.getDependencyIdentifier()));
    }

    @Test
    public void testMaxOverload() throws IOException {
        EmitterOptions options = EmitterOptions.fromJson(JsonReader.fromString("{\"max-overload\":\"model\"}"));
        Assertions.assertEquals("model", options.getMaxOverload());
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            // JSON form
            "{\"rename-model\":{\"TopLevelArmResourceListResult\":\"ResourceListResult\",\"CustomTemplateResourcePropertiesAnonymousEmptyModel\":\"AnonymousEmptyModel\"}}",
            // Compact form
            "{\"rename-model\":\"TopLevelArmResourceListResult:ResourceListResult,CustomTemplateResourcePropertiesAnonymousEmptyModel:AnonymousEmptyModel\"}" })
    public void testRenameModel(String json) throws IOException {
        EmitterOptions options = EmitterOptions.fromJson(JsonReader.fromString(json));
        Assertions.assertEquals(2, options.getRenameModel().split(",").length);
    }

    @ParameterizedTest
    @ValueSource(strings = { "{\"rename-model\":[]}", "{\"rename-model\":1}" })
    public void invalidRenameModel(String json) {
        Assertions.assertThrows(IllegalStateException.class,
            () -> EmitterOptions.fromJson(JsonReader.fromString(json)));
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "{\"remove-inner\":[\"NginxConfigurationResponse\"]}", // array form
            "{\"remove-inner\":\"NginxConfigurationResponse\"}" // string form
        })
    public void testRemoveInner(String json) throws IOException {
        EmitterOptions options = EmitterOptions.fromJson(JsonReader.fromString(json));
        Assertions.assertEquals(1, options.getRemoveInner().split(",").length);
        Assertions.assertEquals("NginxConfigurationResponse", options.getRemoveInner());
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "{\"remove-model\":[\"VirtualMachineExtensionImage\",\"VirtualMachineImage\"]}",
            "{\"remove-model\":\"VirtualMachineExtensionImage,VirtualMachineImage\"}" })
    public void testRemoveModel(String json) throws IOException {
        EmitterOptions options = EmitterOptions.fromJson(JsonReader.fromString(json));
        Assertions.assertEquals(2, options.getRemoveModel().split(",").length);
        Assertions.assertEquals("VirtualMachineExtensionImage,VirtualMachineImage", options.getRemoveModel());
    }

    private static JavaSettings generatorSettings(String devOptions) throws IOException {
        JavaSettings.clear();
        try (JsonReader reader
            = JsonReader.fromString("{\"flavor\":\"azure\",\"namespace\":\"test.generated\"" + devOptions + "}")) {
            new TypeSpecPlugin(EmitterOptions.fromJson(reader), false);
            return JavaSettings.getInstance();
        }
    }

    private static String renderProxy(boolean async) {
        return renderProxy(async,
            async
                ? GenericType.mono(GenericType.response(ClassType.BINARY_DATA))
                : GenericType.response(ClassType.BINARY_DATA));
    }

    private static String renderProxy(boolean async, IType returnType) {
        return renderProxy(async, returnType, List.of(ProxyMethodParameter.REQUEST_OPTIONS_PARAMETER));
    }

    private static String renderProxy(boolean async, IType returnType, List<ProxyMethodParameter> parameters) {
        ProxyMethod method = new ProxyMethod.Builder().name("getWithResponse")
            .baseName("getWithResponse")
            .httpMethod(HttpMethod.GET)
            .baseURL("https://example.com")
            .urlPath("/models")
            .requestContentType("application/json")
            .responseExpectedStatusCodes(List.of(200))
            .parameters(parameters)
            .returnType(returnType)
            .isSync(!async)
            .build();
        Proxy proxy = new Proxy.Builder().name("GeneratedService")
            .clientTypeName("GeneratedClient")
            .baseURL("https://example.com")
            .methods(List.of(method))
            .build();
        JavaFile file = new JavaFile("GeneratedClient.java");
        file.publicFinalClass("GeneratedClient", outer -> ProxyTemplate.getInstance().write(proxy, outer));
        return file.getContents().toString();
    }
}
