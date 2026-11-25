// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Info;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schemas;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientBuilder;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.postprocessor.implementation.CodeFormatterUtil;
import com.microsoft.typespec.http.client.generator.core.template.Templates;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import io.clientcore.core.http.client.HttpClient;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpHeaders;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

public class ClientCoreHttpOperationTests {
    private static final String NAMESPACE = "example.client";
    private static final HttpHeaderName MARKER = HttpHeaderName.fromString("x-marker");

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void invokesFreshClientsWithoutAnnotationProcessing(String flavor, @TempDir Path directory)
        throws Throwable {
        verifyInNewClassLoader("verifyGeneratedClients", new Class<?>[] { String.class, Path.class }, flavor,
            directory);
    }

    private static void verifyInNewClassLoader(String method, Class<?>[] types, Object... args) throws Throwable {
        // The generator initializes shared type constants for one flavor per class loader.
        List<URL> classpath = new ArrayList<>();
        for (String entry : System.getProperty("java.class.path").split(File.pathSeparator)) {
            classpath.add(Path.of(entry).toUri().toURL());
        }
        try (URLClassLoader isolated
            = new URLClassLoader(classpath.toArray(new URL[0]), ClassLoader.getPlatformClassLoader())) {
            Class<?> checks = isolated.loadClass(ClientCoreHttpOperationTests.class.getName());
            try {
                checks.getMethod(method, types).invoke(null, args);
            } catch (InvocationTargetException e) {
                throw e.getCause();
            }
        }
    }

    public static void verifyGeneratedClients(String flavor, Path directory) throws Exception {
        TypeSpecPlugin plugin = plugin(flavor);
        CodeModel codeModel = codeModel();
        Client client = plugin.processClient(codeModel);
        JavaPackage javaPackage = plugin.processTemplates(codeModel, client, JavaSettings.getInstance());
        javaPackage.addPom("pom.xml",
            new Pom().setGroupId(NAMESPACE)
                .setArtifactId("direct-client")
                .setVersion("1.0.0")
                .setServiceName("Direct Client")
                .setServiceDescription("A client for exercising generated HTTP operations.")
                .setRequireCompilerPlugins(true));
        String pom = javaPackage.getXmlFiles().get(javaPackage.getXmlFiles().size() - 1).getContents().toString();
        Assertions.assertTrue(pom.contains("maven-compiler-plugin"), pom);
        Assertions.assertFalse(pom.contains("annotation-processor"), pom);

        AtomicInteger calls = new AtomicInteger();
        HttpClient transport = request -> {
            HttpHeaders headers = new HttpHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
            switch (calls.incrementAndGet()) {
                case 1:
                    Assertions.assertEquals(HttpMethod.PUT, request.getHttpMethod());
                    Assertions.assertEquals("https://example.test/items/a%2Fb?search=a%20b",
                        request.getUri().toString());
                    Assertions.assertEquals("callback", request.getHeaders().getValue(MARKER));
                    return new Response<>(request, 201, headers, BinaryData.fromString("\"accepted\""));

                case 2:
                    Assertions.assertEquals("https://other.example.test/lookup", request.getUri().toString());
                    Assertions.assertNull(request.getHeaders().getValue(MARKER));
                    return new Response<>(request, 200, headers, BinaryData.fromString("\"found\""));

                default:
                    // This is a 2xx, but not the explicitly declared success status for PUT.
                    return new Response<>(request, 200, headers, BinaryData.fromString("{\"message\":\"rejected\"}"));
            }
        };
        RequestContext context = RequestContext.builder().addRequestCallback(request -> {
            Assertions.assertEquals("original", request.getHeaders().getValue(MARKER));
            Assertions.assertEquals("application/json", request.getHeaders().getValue(HttpHeaderName.CONTENT_TYPE));
            Assertions.assertEquals("\"payload\"", request.getBody().toString());
            request.getHeaders().set(MARKER, "callback");
        }).build();

        try (URLClassLoader loader = compile(directory, javaPackage.getJavaFiles())) {
            ClientBuilder builderModel = client.getClientBuilders().get(0);
            Class<?> builderType = loader.loadClass(builderModel.getPackageName() + "." + builderModel.getClassName());
            Object builder = builderType.getConstructor().newInstance();
            builderType.getMethod("httpClient", HttpClient.class).invoke(builder, transport);
            Object root = buildClient(builder, builderModel, false);
            Object group = buildClient(builder, builderModel, true);

            var put = root.getClass()
                .getMethod("putItemWithResponse", String.class, String.class, String.class, String.class,
                    RequestContext.class);
            Response<?> result = (Response<?>) put.invoke(root, "a/b", "payload", "a b", "original", context);
            Assertions.assertEquals(201, result.getStatusCode());
            Assertions.assertEquals("accepted", result.getValue());
            Response<?> lookup = (Response<?>) group.getClass()
                .getMethod("lookupWithResponse", RequestContext.class)
                .invoke(group, RequestContext.none());
            Assertions.assertEquals("found", lookup.getValue());
            InvocationTargetException failure = Assertions.assertThrows(InvocationTargetException.class,
                () -> put.invoke(root, "a/b", "payload", "a b", null, RequestContext.none()));
            HttpResponseException error = Assertions.assertInstanceOf(HttpResponseException.class, failure.getCause());
            Assertions.assertEquals(200, error.getResponse().getStatusCode());
            Assertions.assertEquals(Map.of("message", "rejected"), error.getValue());
            Assertions.assertEquals(3, calls.get());
        }
    }

    @ParameterizedTest
    @CsvSource({
        "azure, false, @Put",
        "generic, true, @HttpRequestInformation",
        "azurev2, true, @HttpRequestInformation" })
    public void retainsAnnotationsForRuntimeProxies(String flavor, boolean restProxy, String annotation)
        throws Throwable {
        verifyInNewClassLoader("verifyAnnotatedProxy", new Class<?>[] { String.class, boolean.class, String.class },
            flavor, restProxy, annotation);
    }

    public static void verifyAnnotatedProxy(String flavor, boolean restProxy, String annotation) {
        JavaSettingsTestBase
            .configureJavaSettings(Map.of("flavor", flavor, "use-rest-proxy", Boolean.toString(restProxy)));
        Assertions.assertFalse(JavaSettings.getInstance().generateClientCoreHttpOperations());
        // The same switch controls service declarations and import collection, not public SDK metadata.
        Proxy proxy = new Proxy.Builder().name("Api")
            .clientTypeName("Example")
            .baseURL("https://example.test")
            .methods(List.of(new ProxyMethod.Builder().name("put")
                .urlPath("/items")
                .httpMethod(HttpMethod.PUT)
                .requestContentType("application/json")
                .returnType(PrimitiveType.VOID)
                .responseExpectedStatusCodes(List.of(201))
                .parameters(List.of())
                .allParameters(List.of())
                .build()))
            .build();
        JavaFile file = new JavaFile("Example.java");
        file.publicFinalClass("Example", block -> Templates.getProxyTemplate().write(proxy, block));
        String source = file.getContents().toString();
        Assertions.assertTrue(source.contains("@ServiceInterface"), source);
        Assertions.assertTrue(source.contains(annotation), source);
        Assertions.assertFalse(source.contains("implements Api"), source);
        if (restProxy) {
            Assertions.assertTrue(source.contains("RestProxy.create(Api.class, pipeline)"), source);
        }
    }

    private static TypeSpecPlugin plugin(String flavor) throws Exception {
        try (JsonReader reader = JsonReader.fromString("{\"namespace\":\"" + NAMESPACE + "\",\"flavor\":\"" + flavor
            + "\",\"stream-style-serialization\":true,\"service-versions\":[\"2025-01-01\"]}")) {
            return new TypeSpecPlugin(EmitterOptions.fromJson(reader), false);
        }
    }

    private static Object buildClient(Object builder, ClientBuilder model, boolean methodGroup) throws Exception {
        AsyncSyncClient syncClient = model.getSyncClients()
            .stream()
            .filter(client -> (client.getMethodGroupClient() != null) == methodGroup)
            .findFirst()
            .orElseThrow();
        return builder.getClass().getMethod(model.getBuilderMethodNameForSyncClient(syncClient)).invoke(builder);
    }

    private static URLClassLoader compile(Path directory, List<JavaFile> files) throws Exception {
        Path classes = Files.createDirectory(directory.resolve("classes"));
        List<String> arguments = new ArrayList<>(List.of("--release", "11", "-proc:none", "-classpath",
            System.getProperty("java.class.path"), "-d", classes.toString()));
        for (JavaFile file : files) {
            Path path = directory.resolve(file.getFilePath());
            // Compile on the classpath to share the fake transport with the test.
            if (path.getFileName().toString().equals("module-info.java")) {
                continue;
            }
            Files.createDirectories(path.getParent());
            String source = file.getContents().toString();
            Assertions.assertFalse(source.contains("io.clientcore.core.http.annotations."), source);
            Assertions.assertFalse(source.contains("@ServiceInterface"), source);
            Assertions.assertFalse(source.contains("Class.forName("), source);
            Files.writeString(path, CodeFormatterUtil.formatCode(Map.of(file.getFilePath(), source)).get(0),
                StandardCharsets.UTF_8);
            arguments.add(path.toString());
        }
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Assertions.assertEquals(0,
            ToolProvider.getSystemJavaCompiler().run(null, output, output, arguments.toArray(new String[0])),
            output.toString(StandardCharsets.UTF_8));
        return new URLClassLoader(new URL[] { classes.toUri().toURL() },
            ClientCoreHttpOperationTests.class.getClassLoader());
    }

    private static CodeModel codeModel() {
        CodeModel model = new CodeModel();
        model.setLanguage(languages("DirectClient", "DirectClient"));
        Info info = new Info();
        info.setTitle("Direct Client");
        info.setDescription("A client for exercising generated HTTP operations.");
        model.setInfo(info);
        model.setSchemas(new Schemas());
        Operation put = operation("putItem", "PUT", "/items/{itemId}", "201",
            List.of(parameter("itemId", "itemId", RequestParameterLocation.PATH, true),
                parameter("search", "search", RequestParameterLocation.QUERY, false),
                parameter("marker", "x-marker", RequestParameterLocation.HEADER, false),
                parameter("payload", "payload", RequestParameterLocation.BODY, true)));
        Operation lookup = operation("lookup", "GET", "https://other.example.test/lookup", "200", List.of());
        model.setOperationGroups(List.of(group(model, "", put), group(model, "items", lookup)));
        return model;
    }

    private static OperationGroup group(CodeModel model, String name, Operation operation) {
        OperationGroup group = new OperationGroup();
        group.set$key(name);
        group.setLanguage(languages(name, name));
        group.setCodeModel(model);
        group.setOperations(new ArrayList<>(List.of(operation)));
        operation.setOperationGroup(group);
        return group;
    }

    private static Operation operation(String name, String method, String path, String status,
        List<Parameter> parameters) {
        Operation operation = new Operation();
        operation.setLanguage(languages(name, name));
        operation.setOperationId(name);
        operation.setDescription(name + ".");
        Request request = new Request();
        request.setLanguage(operation.getLanguage());
        request.setParameters(new ArrayList<>(parameters));
        request.setSignatureParameters(new ArrayList<>(parameters));
        Protocol requestHttp = new Protocol();
        requestHttp.setMethod(method);
        requestHttp.setUri("https://example.test");
        requestHttp.setPath(path);
        requestHttp.setMediaTypes(List.of("application/json"));
        request.setProtocol(http(requestHttp));
        operation.setRequests(new ArrayList<>(List.of(request)));

        var response = new com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response();
        response.setSchema(stringSchema());
        Protocol responseHttp = new Protocol();
        responseHttp.setStatusCodes(List.of(status));
        responseHttp.setMediaTypes(List.of("application/json"));
        response.setProtocol(http(responseHttp));
        operation.setResponses(List.of(response));
        return operation;
    }

    private static Parameter parameter(String name, String wireName, RequestParameterLocation location,
        boolean required) {
        Parameter parameter = new Parameter();
        parameter.setLanguage(languages(name, wireName));
        parameter.setDescription(name + ".");
        parameter.setRequired(required);
        parameter.setImplementation(Parameter.ImplementationLocation.METHOD);
        parameter.setSchema(stringSchema());
        Protocol http = new Protocol();
        http.setIn(location);
        parameter.setProtocol(http(http));
        return parameter;
    }

    private static Protocols http(Protocol http) {
        Protocols protocols = new Protocols();
        protocols.setHttp(http);
        return protocols;
    }

    private static StringSchema stringSchema() {
        StringSchema string = new StringSchema();
        string.setType(Schema.AllSchemaTypes.STRING);
        return string;
    }

    private static Languages languages(String name, String wireName) {
        Language language = new Language();
        language.setName(name);
        language.setNamespace(NAMESPACE);
        language.setSerializedName(wireName);
        language.setDescription(name + ".");
        language.setCrossLanguageDefinitionId(NAMESPACE + "." + name);
        Languages languages = new Languages();
        languages.setDefault(language);
        languages.setJava(language);
        return languages;
    }
}
