package com.microsoft.typespec.http.client.generator.model;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.google.googlejavaformat.java.RemoveUnusedImports;
import com.microsoft.typespec.http.client.generator.TypeSpecPlugin;
import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.model.xmlmodel.XmlFile;
import com.microsoft.typespec.http.client.generator.core.template.ProxyTemplate;
import com.microsoft.typespec.http.client.generator.core.template.azurevnext.AzureVNextPomTemplate;
import com.microsoft.typespec.http.client.generator.core.template.clientcore.ClientCorePomTemplate;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpHeaders;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.http.pipeline.HttpPipelineBuilder;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonWriter;
import io.clientcore.core.serialization.json.models.JsonArray;
import io.clientcore.core.serialization.json.models.JsonObject;
import io.clientcore.core.serialization.xml.XmlReader;
import io.clientcore.core.serialization.xml.XmlSerializable;
import io.clientcore.core.serialization.xml.XmlToken;
import io.clientcore.core.serialization.xml.XmlWriter;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Modifier;
import java.lang.reflect.ParameterizedType;
import java.net.URI;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.ToolProvider;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.stream.XMLStreamException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;

@Execution(ExecutionMode.SAME_THREAD)
public class ProtocolImplementationTests {
    @TempDir
    Path classes;

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void pomDoesNotRequireAnnotationProcessor(String flavor) throws Exception {
        initialize(flavor);
        Pom pom = new Pom().setGroupId("com.example")
            .setArtifactId("example-client")
            .setVersion("1.0.0")
            .setServiceName("Example")
            .setServiceDescription("Example client")
            .setRequireCompilerPlugins(true);
        XmlFile file = new XmlFile("pom.xml");
        if ("azurev2".equals(flavor)) {
            AzureVNextPomTemplate.getInstance().write(pom, file);
        } else {
            ClientCorePomTemplate.getInstance().write(pom, file);
        }
        String output = file.getContents().toString();
        Assertions.assertFalse(output.contains("annotation-processor"), output);
        Assertions.assertFalse(output.contains("annotationProcessor"), output);
        Assertions.assertFalse(output.contains("<proc>only</proc>"), output);
        Document document = DocumentBuilderFactory.newInstance()
            .newDocumentBuilder()
            .parse(new InputSource(new StringReader(output)));
        Assertions.assertEquals(1, document.getElementsByTagName("plugin").getLength());
        Assertions.assertEquals("plugins",
            document.getElementsByTagName("plugin").item(0).getParentNode().getNodeName());
        Assertions.assertEquals("11", document.getElementsByTagName("release").item(0).getTextContent());
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void protocolHelpersContainOnlyReferencedCapabilities(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("id", "id", RequestParameterLocation.PATH, false));
        String output = render(List.of(method("send", ClassType.VOID, HttpMethod.GET, parameters)));
        String helper = helperSources(output).get(0).getContents().toString();
        Assertions.assertEquals(Set.of("mapResponse", "handleUnexpectedResponse"), helperMethods(helper));
        Assertions.assertFalse(helper.contains("import io.clientcore.core.serialization.json.JsonReader;"), helper);
        Assertions.assertFalse(helper.contains("import io.clientcore.core.utils.Base64Uri;"), helper);
        Assertions.assertFalse(helper.contains("import io.clientcore.core.http.pipeline.HttpPipeline;"), helper);
        compile(output);

        List<ProxyMethodParameter> contextual = new ArrayList<>(parameters);
        contextual.add(ProxyMethodParameter.REQUEST_CONTEXT_PARAMETER);
        output = render(List.of(method("raw", ClassType.BINARY_DATA, HttpMethod.GET, contextual)));
        helper = helperSources(output).get(0).getContents().toString();
        Assertions.assertEquals(Set.of("send", "handleUnexpectedResponse"), helperMethods(helper));
        Assertions.assertFalse(helper.contains("import java.util.function.Supplier;"), helper);
        compile(output);

        output = render(List.of(method("send", ClassType.VOID, HttpMethod.GET, List.of()).newBuilder()
            .implementation("return null;")
            .build()));
        Assertions.assertTrue(helperSources(output).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void knownHeaderOnlyProtocolsDoNotEmitRedundantConstants(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("id", "id", RequestParameterLocation.PATH, false),
                parameter("accept", "Accept", RequestParameterLocation.HEADER, false),
                parameter("contentType", "content-type", RequestParameterLocation.HEADER, false));
        JavaPackage library
            = compile(render(List.of(method("raw", ClassType.BINARY_DATA, HttpMethod.GET, parameters))));
        String source = library.getJavaFiles().get(0).getContents().toString();
        Assertions.assertTrue(source.contains("HttpHeaderName.ACCEPT"), source);
        Assertions.assertTrue(source.contains("HttpHeaderName.CONTENT_TYPE"), source);
        Assertions.assertFalse(source.contains("HttpHeaderName.fromString("), source);
        Assertions.assertTrue(
            library.getJavaFiles().stream().noneMatch(file -> file.getFilePath().endsWith("ComExampleConstants.java")));
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void helperSelectionUnionsClientsAndKeepsTransitiveDependencies(String flavor) throws Exception {
        initialize(flavor);
        String first
            = "class First { void call() { ClientCoreProtocolUtils.setMixedBody(null, null, null, null, null); } }";
        String second
            = "class Second { Object callback = (java.util.function.Supplier<Object>) ClientCoreProtocolUtils::readBase64Url; }";
        String helper = helperSources(first, second).get(0).getContents().toString();
        Assertions.assertEquals(Set.of("setMixedBody", "setBody", "readBase64Url"), helperMethods(helper));
        Assertions.assertFalse(helper.contains("JsonSerializer"), helper);
        Assertions.assertFalse(helper.contains("HttpPipeline"), helper);
        Assertions.assertTrue(helper.contains("HttpHeaderName"), helper);
        Assertions.assertTrue(helper.contains("JsonToken"), helper);

        Assertions.assertTrue(
            helperSources("class Empty { String text = \"ClientCoreProtocolUtils.readJson()\"; }").isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void optionalBodiesAndContextCallbacksPreserveOverrides(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("id", "id", RequestParameterLocation.PATH, false),
                parameter("contentType", "Content-Type", RequestParameterLocation.HEADER, false),
                parameter("body", "body", RequestParameterLocation.BODY, false),
                ProxyMethodParameter.REQUEST_CONTEXT_PARAMETER);
        compile(render(List.of(method("send", ClassType.VOID, HttpMethod.POST, parameters))));
        AtomicInteger callbacks = new AtomicInteger();
        AtomicInteger sends = new AtomicInteger();
        AtomicReference<HttpRequest> captured = new AtomicReference<>();
        HttpPipeline pipeline = new HttpPipelineBuilder().httpClient(request -> {
            sends.incrementAndGet();
            captured.set(request);
            return new Response<>(request, 200, new HttpHeaders(), BinaryData.empty());
        }).build();
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> serviceType = loader.loadClass("com.example.GeneratedClient$ExampleService");
            Object service = serviceType.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            RequestContext context
                = RequestContext.builder().putMetadata("test", "metadata").addRequestCallback(request -> {
                    callbacks.incrementAndGet();
                    Assertions.assertEquals("\"payload\"", request.getBody().toString());
                    Assertions.assertEquals("application/vnd.example+json",
                        request.getHeaders().getValue(HttpHeaderName.CONTENT_TYPE));
                    request.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/custom");
                }).build();
            try (Response<?> ignored = invoke(serviceType, service, "send", "https://example.test", "item",
                "application/vnd.example+json", "payload", context)) {
                Assertions.assertEquals(1, callbacks.get());
                Assertions.assertEquals(1, sends.get());
                Assertions.assertEquals("application/custom",
                    captured.get().getHeaders().getValue(HttpHeaderName.CONTENT_TYPE));
                Assertions.assertEquals("metadata", captured.get().getContext().getMetadata("test"));
            }
            try (Response<?> ignored
                = invoke(serviceType, service, "send", "https://example.test", "item", null, null, null)) {
                Assertions.assertNull(captured.get().getHeaders().get(HttpHeaderName.CONTENT_TYPE));
                Assertions
                    .assertTrue(captured.get().getBody() == null || captured.get().getBody().toBytes().length == 0);
            }
            try (Response<?> ignored = invoke(serviceType, service, "send", "https://example.test", "item",
                "application/custom", null, null)) {
                Assertions.assertEquals("application/custom",
                    captured.get().getHeaders().getValue(HttpHeaderName.CONTENT_TYPE));
            }
            RequestContext failing = RequestContext.builder().addRequestCallback(request -> {
                throw new IllegalStateException("callback");
            }).build();
            int sent = sends.get();
            Assertions.assertThrows(IllegalStateException.class,
                () -> invoke(serviceType, service, "send", "https://example.test", "item", null, null, failing));
            Assertions.assertEquals(sent, sends.get());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void serviceImplementationCompilesWithoutAnnotationProcessing(String flavor) throws Exception {
        initialize(flavor);
        String output = render(List.of(method("send", ClassType.STRING, HttpMethod.POST, requestParameters())));
        Assertions.assertFalse(output.contains("Class.forName"), output);
        Assertions.assertFalse(output.contains("@ServiceInterface"), output);
        Assertions.assertFalse(output.contains("@HttpRequestInformation"), output);
        Assertions.assertFalse(output.contains("@BodyParam"), output);
        Assertions.assertFalse(output.contains("XmlSerializer"), output);
        Assertions.assertFalse(output.contains("requestSerializationFormat"), output);
        Assertions.assertFalse(output.contains("responseSerializationFormat"), output);
        Assertions.assertTrue(output.contains("return new ExampleServiceImpl(pipeline);"), output);
        Assertions.assertFalse(output.substring(output.indexOf("public final class")).contains("io.clientcore.core."),
            output);
        Assertions.assertTrue(output.contains("import io.clientcore.core.http.models.HttpRequest;"), output);
        Assertions.assertTrue(output.contains("import io.clientcore.core.utils.GeneratedCodeUtils;"), output);
        Set<String> imports = new HashSet<>();
        proxy(List.of(method("send", ClassType.STRING, HttpMethod.POST, requestParameters()))).addImportsTo(imports,
            true, JavaSettings.getInstance());
        Assertions.assertFalse(
            imports.stream().anyMatch(name -> name.startsWith("io.clientcore.core.http.annotations.")),
            imports.toString());
        Assertions.assertFalse(imports.contains("io.clientcore.core.annotations.ServiceInterface"), imports.toString());
        compile(output);
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void voidResponsesPreserveMetadataAndCloseTheBody(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("id", "id", RequestParameterLocation.PATH, false));
        ProxyMethod primitive = method("primitive", PrimitiveType.VOID, HttpMethod.GET, parameters).newBuilder()
            .responseExpectedStatusCodes(List.of(204))
            .build();
        ProxyMethod boxed
            = primitive.newBuilder().name("boxed").returnType(GenericType.response(ClassType.VOID)).build();
        ProxyMethod unwrapped = primitive.newBuilder().name("unwrapped").returnType(PrimitiveType.VOID).build();
        String output = render(List.of(primitive, boxed, unwrapped));
        Assertions.assertTrue(output.contains("Response<Void> primitive("), output);
        Assertions.assertFalse(output.contains("JSON_SERIALIZER ="), output);
        compile(output);
        AtomicInteger closes = new AtomicInteger();
        AtomicReference<BinaryData> body = new AtomicReference<>(BinaryData.fromString("not a JSON body"));
        HttpPipeline pipeline = responsePipeline(body, 204, closes);
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> serviceType = loader.loadClass("com.example.GeneratedClient$ExampleService");
            Object service = serviceType.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            for (String name : List.of("primitive", "boxed")) {
                try (Response<?> response = invoke(serviceType, service, name, "https://example.test", "item")) {
                    Assertions.assertEquals(204, response.getStatusCode());
                    Assertions.assertEquals("preserved",
                        response.getHeaders().getValue(HttpHeaderName.fromString("x-test")));
                    Assertions.assertEquals("https://example.test/items/item",
                        response.getRequest().getUri().toString());
                    Assertions.assertNull(response.getValue());
                }
                Assertions.assertEquals(1, closes.getAndSet(0));
            }
            Assertions.assertNull(invoke(serviceType, service, "unwrapped", "https://example.test", "item"));
            Assertions.assertEquals(1, closes.get());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void dateTimeCollectionsDeserializeToTypedValues(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("jsonReader", "id", RequestParameterLocation.PATH, false));
        ListType dates = new ListType(ClassType.DATE_TIME);
        ProxyMethod list = method("list", dates, HttpMethod.GET, parameters);
        compile(render(List.of(list,
            list.newBuilder().name("mixed").responseContentTypes(Set.of("application/json", "application/xml")).build(),
            method("nested", new ListType(dates), HttpMethod.GET, parameters),
            method("map", new MapType(dates), HttpMethod.GET, parameters),
            method("scalar", ClassType.DATE_TIME, HttpMethod.GET, parameters))));
        OffsetDateTime first = OffsetDateTime.parse("2024-01-01T00:00:00Z");
        OffsetDateTime second = OffsetDateTime.parse("2024-01-02T03:04:05+05:30");
        List<OffsetDateTime> expected = Arrays.asList(first, null, second);
        String payload = "[\"2024-01-01T00:00:00Z\",null,\"2024-01-02T03:04:05+05:30\"]";
        AtomicReference<BinaryData> body = new AtomicReference<>(BinaryData.fromString(payload));
        AtomicInteger closes = new AtomicInteger();
        HttpPipeline pipeline = responsePipeline(body, 200, closes);
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> serviceType = loader.loadClass("com.example.GeneratedClient$ExampleService");
            Object service = serviceType.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            for (String name : List.of("list", "mixed")) {
                try (Response<?> response = invoke(serviceType, service, name, "https://example.test", "item")) {
                    Assertions.assertEquals(expected, response.getValue());
                    Assertions.assertEquals("preserved",
                        response.getHeaders().getValue(HttpHeaderName.fromString("x-test")));
                }
                Assertions.assertEquals(1, closes.getAndSet(0));
            }
            body.set(BinaryData.fromString("[" + payload + ",null,[]]"));
            try (Response<?> response = invoke(serviceType, service, "nested", "https://example.test", "item")) {
                Assertions.assertEquals(Arrays.asList(expected, null, List.of()), response.getValue());
            }
            Assertions.assertEquals(1, closes.getAndSet(0));
            body.set(BinaryData.fromString("{\"dates\":" + payload + "}"));
            try (Response<?> response = invoke(serviceType, service, "map", "https://example.test", "item")) {
                Assertions.assertEquals(Map.of("dates", expected), response.getValue());
            }
            Assertions.assertEquals(1, closes.getAndSet(0));
            body.set(BinaryData.fromString("\"2024-01-01T00:00:00Z\""));
            try (Response<?> response = invoke(serviceType, service, "scalar", "https://example.test", "item")) {
                Assertions.assertEquals(first, response.getValue());
            }
            Assertions.assertEquals(1, closes.getAndSet(0));
            for (BinaryData empty : Arrays.asList(null, BinaryData.empty(), BinaryData.fromString("null"))) {
                body.set(empty);
                try (Response<?> response = invoke(serviceType, service, "list", "https://example.test", "item")) {
                    Assertions.assertNull(response.getValue());
                }
                Assertions.assertEquals(1, closes.getAndSet(0));
            }
            body.set(BinaryData.fromString("[]"));
            try (Response<?> response = invoke(serviceType, service, "list", "https://example.test", "item")) {
                Assertions.assertEquals(List.of(), response.getValue());
            }
            Assertions.assertEquals(1, closes.getAndSet(0));
            body.set(BinaryData.fromString("[\"not-a-date\"]"));
            Assertions.assertThrows(RuntimeException.class,
                () -> invoke(serviceType, service, "list", "https://example.test", "item"));
            Assertions.assertEquals(1, closes.get());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void encodedDateTimeListsPreserveTheContainerType(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("id", "id", RequestParameterLocation.PATH, false));
        List<IType> wireTypes
            = List.of(ClassType.DATE_TIME_RFC_1123, PrimitiveType.UNIX_TIME_LONG, ClassType.UNIX_TIME_LONG);
        List<ProxyMethod> methods = new ArrayList<>();
        for (int i = 0; i < wireTypes.size(); i++) {
            IType wireType = wireTypes.get(i);
            ProxyMethod dates = method("dates" + i, new ListType(wireType), HttpMethod.GET, parameters).newBuilder()
                .returnValueWireType(wireType)
                .build();
            methods.add(dates);
            methods.add(dates.newBuilder()
                .name("mixedDates" + i)
                .responseContentTypes(Set.of("application/json", "application/xml"))
                .build());
        }
        compile(render(methods));
        AtomicReference<BinaryData> body = new AtomicReference<>();
        AtomicInteger closes = new AtomicInteger();
        HttpPipeline pipeline = responsePipeline(body, 200, closes);
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> serviceType = loader.loadClass("com.example.GeneratedClient$ExampleService");
            Object service = serviceType.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            for (int i = 0; i < wireTypes.size(); i++) {
                body.set(
                    BinaryData.fromString(i == 0 ? "[\"Mon, 01 Jan 2024 00:00:00 GMT\",null]" : "[1704067200,null]"));
                for (String name : List.of("dates", "mixedDates")) {
                    try (
                        Response<?> response = invoke(serviceType, service, name + i, "https://example.test", "item")) {
                        Assertions.assertEquals(Arrays.asList(OffsetDateTime.parse("2024-01-01T00:00:00Z"), null),
                            response.getValue());
                    }
                    Assertions.assertEquals(1, closes.getAndSet(0));
                }
            }
        }
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void encodedBytesDeserializeToTypedValues(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("jsonReader", "id", RequestParameterLocation.PATH, false));
        List<IType> wireTypes = List.of(ArrayType.BYTE_ARRAY, ClassType.BASE_64_URL);
        List<ProxyMethod> methods = new ArrayList<>();
        for (int i = 0; i < wireTypes.size(); i++) {
            IType wireType = wireTypes.get(i);
            ListType bytes = new ListType(wireType);
            methods.add(method("scalar" + i, wireType, HttpMethod.GET, parameters));
            methods.add(method("list" + i, bytes, HttpMethod.GET, parameters));
            methods.add(method("mixed" + i, bytes, HttpMethod.GET, parameters).newBuilder()
                .responseContentTypes(Set.of("application/json", "application/xml"))
                .build());
            methods.add(method("nested" + i, new ListType(new MapType(bytes)), HttpMethod.GET, parameters));
        }
        compile(render(methods));
        byte[] expected = { (byte) 0xFB, (byte) 0xFF };
        AtomicReference<BinaryData> body = new AtomicReference<>();
        AtomicInteger closes = new AtomicInteger();
        HttpPipeline pipeline = responsePipeline(body, 200, closes);
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> serviceType = loader.loadClass("com.example.GeneratedClient$ExampleService");
            Object service = serviceType.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            for (int i = 0; i < wireTypes.size(); i++) {
                String encoded
                    = (i == 0 ? Base64.getEncoder() : Base64.getUrlEncoder().withoutPadding()).encodeToString(expected);
                body.set(BinaryData.fromObject(encoded));
                try (
                    Response<?> response = invoke(serviceType, service, "scalar" + i, "https://example.test", "item")) {
                    Assertions.assertArrayEquals(expected, (byte[]) response.getValue());
                }
                Assertions.assertEquals(1, closes.getAndSet(0));

                String array = "[\"" + encoded + "\",null,\"\"]";
                body.set(BinaryData.fromString(array));
                for (String name : List.of("list", "mixed")) {
                    try (
                        Response<?> response = invoke(serviceType, service, name + i, "https://example.test", "item")) {
                        assertByteValues(expected, response.getValue());
                        Assertions.assertEquals("preserved",
                            response.getHeaders().getValue(HttpHeaderName.fromString("x-test")));
                    }
                    Assertions.assertEquals(1, closes.getAndSet(0));
                }

                body.set(BinaryData.fromString("[{\"values\":" + array + ",\"absent\":null},null,{}]"));
                try (
                    Response<?> response = invoke(serviceType, service, "nested" + i, "https://example.test", "item")) {
                    List<?> values = Assertions.assertInstanceOf(List.class, response.getValue());
                    Map<?, ?> first = Assertions.assertInstanceOf(Map.class, values.get(0));
                    assertByteValues(expected, first.get("values"));
                    Assertions.assertTrue(first.containsKey("absent"));
                    Assertions.assertNull(first.get("absent"));
                    Assertions.assertNull(values.get(1));
                    Assertions.assertEquals(Map.of(), values.get(2));
                }
                Assertions.assertEquals(1, closes.getAndSet(0));

                for (BinaryData empty : Arrays.asList(null, BinaryData.empty(), BinaryData.fromString("null"))) {
                    body.set(empty);
                    for (String name : List.of("scalar", "list", "nested")) {
                        try (Response<?> response
                            = invoke(serviceType, service, name + i, "https://example.test", "item")) {
                            Assertions.assertNull(response.getValue());
                        }
                        Assertions.assertEquals(1, closes.getAndSet(0));
                    }
                }
                String name = "list" + i;
                for (String invalid : List.of("[\"%%%\"]", "[42]", "[true]", "[{}]", "[[]]")) {
                    body.set(BinaryData.fromString(invalid));
                    Assertions.assertThrows(RuntimeException.class,
                        () -> invoke(serviceType, service, name, "https://example.test", "item"), invalid);
                    Assertions.assertEquals(1, closes.getAndSet(0), invalid);
                }
            }
        }
    }

    private static void assertByteValues(byte[] expected, Object value) {
        List<?> values = Assertions.assertInstanceOf(List.class, value);
        Assertions.assertEquals(3, values.size());
        Assertions.assertArrayEquals(expected, (byte[]) values.get(0));
        Assertions.assertNull(values.get(1));
        Assertions.assertArrayEquals(new byte[0], (byte[]) values.get(2));
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void reflectionAndFormattingUseImportedClasses(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters = new ArrayList<>(requestParameters());
        parameters.add(new ProxyMethodParameter.Builder().name("timestamp")
            .wireType(ClassType.DATE_TIME)
            .clientType(ClassType.DATE_TIME)
            .requestParameterName("x-timestamp")
            .requestParameterLocation(RequestParameterLocation.HEADER)
            .build());
        ProxyMethod nested
            = method("nested", new MapType(new ListType(ClassType.INTEGER)), HttpMethod.POST, parameters).newBuilder()
                .unexpectedResponseExceptionTypes(Map.of(
                    new ClassType.Builder().name("UnknownException").packageName("com.example").build(), List.of(400)))
                .build();
        ProxyMethod base64 = method("base64", ArrayType.BYTE_ARRAY, HttpMethod.GET, parameters).newBuilder()
            .returnValueWireType(ClassType.BASE_64_URL)
            .build();
        String output = render(List.of(nested, base64));
        Assertions.assertTrue(output.contains("import java.lang.reflect.ParameterizedType;"), output);
        Assertions.assertTrue(output.contains("import java.time.format.DateTimeFormatter;"), output);
        Assertions.assertTrue(output.contains("import java.util.HashMap;"), output);
        Assertions.assertTrue(output.contains("import io.clientcore.core.utils.Base64Uri;"), output);
        Assertions.assertTrue(output.contains("private static final Map<Integer, ParameterizedType> ERROR_TYPES_0;"),
            output);
        Assertions.assertTrue(output.contains("Collections.unmodifiableMap(errorTypes)"), output);
        Assertions.assertTrue(output.contains(
            "CoreUtils.createParameterizedType(Map.class, String.class, CoreUtils.createParameterizedType(List.class, Integer.class))"),
            output);
        Assertions.assertTrue(output.contains("timestamp.format(DateTimeFormatter.ISO_INSTANT)"), output);
        Assertions.assertTrue(output.contains("ClientCoreProtocolUtils.readBase64Url("), output);
        String implementation = output.substring(output.indexOf("public final class"));
        Assertions.assertFalse(implementation.contains("io.clientcore.core."), output);
        Assertions.assertFalse(implementation.contains("java.util."), output);
        Assertions.assertFalse(implementation.contains("java.lang.reflect."), output);
        Assertions.assertFalse(implementation.contains("java.time.format."), output);
        compile(output);
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void consecutiveStatusCodesAreCompactedWithoutAcceptingGaps(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("id", "id", RequestParameterLocation.PATH, false));
        List<Integer> codes = new ArrayList<>(List.of(407, 404, 405, 200, 404));
        IntStream.rangeClosed(200, 299).forEach(codes::add);
        ProxyMethod method = method("send", ClassType.VOID, HttpMethod.GET, parameters).newBuilder()
            .responseExpectedStatusCodes(codes)
            .build();
        String output = render(List.of(method));
        Assertions.assertTrue(output.contains("responseCode >= 200 && responseCode <= 299"), output);
        Assertions.assertFalse(output.contains("responseCode == 201"), output);
        Assertions.assertTrue(output.contains("responseCode == 404"), output);
        Assertions.assertTrue(output.contains("responseCode == 405"), output);
        Assertions.assertTrue(output.contains("responseCode == 407"), output);
        compile(output);
        AtomicInteger status = new AtomicInteger();
        AtomicInteger closes = new AtomicInteger();
        HttpPipeline pipeline = new HttpPipelineBuilder()
            .httpClient(request -> new Response<>(request, status.get(), new HttpHeaders(), BinaryData.empty()) {
                @Override
                public void close() {
                    closes.incrementAndGet();
                    super.close();
                }
            })
            .build();
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> serviceType = loader.loadClass("com.example.GeneratedClient$ExampleService");
            Object service = serviceType.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            for (int code : new int[] { 200, 250, 299, 404, 405, 407 }) {
                status.set(code);
                try (Response<?> response = invoke(serviceType, service, "send", "https://example.test", "item")) {
                    Assertions.assertEquals(code, response.getStatusCode());
                    Assertions.assertNull(response.getValue());
                }
                Assertions.assertEquals(1, closes.getAndSet(0));
            }
            for (int code : new int[] { 199, 300, 400, 403, 406, 408 }) {
                status.set(code);
                Assertions.assertThrows(HttpResponseException.class,
                    () -> invoke(serviceType, service, "send", "https://example.test", "item"));
                Assertions.assertEquals(1, closes.getAndSet(0));
            }
        }
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void protocolMetadataIsSharedImmutableAndStatic(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("id", "id", RequestParameterLocation.PATH, false));
        ProxyMethod first
            = method("first", new MapType(new ListType(ClassType.INTEGER)), HttpMethod.GET, parameters).newBuilder()
                .unexpectedResponseExceptionTypes(
                    Map.of(ClassType.HTTP_RESPONSE_EXCEPTION, List.of(400, 401, 402, 403, 404)))
                .build();
        ProxyMethod second = first.newBuilder()
            .name("second")
            .unexpectedResponseExceptionTypes(
                Map.of(ClassType.HTTP_RESPONSE_EXCEPTION, List.of(404, 403, 402, 401, 400)))
            .build();
        String output = render(List.of(first, second));
        Assertions.assertEquals(1, output.split("Collections.unmodifiableMap", -1).length - 1, output);
        Assertions.assertTrue(output.contains("private static final JsonSerializer JSON_SERIALIZER"), output);
        Assertions.assertTrue(output.contains("IntStream.rangeClosed(400, 404)"), output);
        Assertions.assertFalse(output.contains("new Response<>"), output);
        Assertions.assertFalse(output.contains("finally"), output);
        JavaPackage library = compile(output);
        String rewritten = library.getJavaFiles().get(0).getContents().toString();
        Assertions.assertFalse(rewritten.contains("CoreUtils.createParameterizedType("), rewritten);
        Assertions.assertTrue(
            rewritten.contains("ComExampleConstants.RESPONSE_OF_MAP_OF_STRING_AND_LIST_OF_INTEGER_TYPE"), rewritten);
        Assertions.assertTrue(library.getJavaFiles()
            .stream()
            .anyMatch(file -> file.getFilePath()
                .replace('\\', '/')
                .endsWith("com/example/implementation/ComExampleConstants.java")));
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> implementation = loader.loadClass("com.example.GeneratedClient$ExampleServiceImpl");
            Assertions.assertEquals(0,
                Arrays.stream(implementation.getDeclaredFields())
                    .filter(
                        field -> field.getType() == ParameterizedType.class && Modifier.isStatic(field.getModifiers()))
                    .count());
            Class<?> constants = loader.loadClass("com.example.implementation.ComExampleConstants");
            Assertions.assertEquals(4,
                Arrays.stream(constants.getDeclaredFields())
                    .filter(
                        field -> field.getType() == ParameterizedType.class && Modifier.isStatic(field.getModifiers()))
                    .count());
            var errors = implementation.getDeclaredField("ERROR_TYPES_0");
            errors.setAccessible(true);
            Map<?, ?> errorTypes = (Map<?, ?>) errors.get(null);
            Assertions.assertEquals(Set.of(400, 401, 402, 403, 404), errorTypes.keySet());
            Assertions.assertThrows(UnsupportedOperationException.class, errorTypes::clear);
            Assertions.assertEquals(1,
                Arrays.stream(implementation.getDeclaredFields())
                    .filter(field -> Map.class.isAssignableFrom(field.getType()))
                    .count());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void generatedServiceHandlesRequestsAndResponses(String flavor) throws Exception {
        initialize(flavor);
        ClientModels.getInstance()
            .addModel(new ClientModel.Builder().name("JsonObject")
                .packageName("io.clientcore.core.serialization.json.models")
                .properties(List.of())
                .build());
        ClientModels.getInstance()
            .addModel(new ClientModel.Builder().name("JsonArray")
                .packageName("io.clientcore.core.serialization.json.models")
                .properties(List.of())
                .build());
        ClassType statusException
            = new ClassType.Builder().name("JsonObjectException").packageName("com.example").build();
        ClassType defaultException
            = new ClassType.Builder().name("JsonArrayException").packageName("com.example").build();
        List<ProxyMethodParameter> basicParameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("responseCode", "id", RequestParameterLocation.PATH, false),
                ProxyMethodParameter.REQUEST_CONTEXT_PARAMETER);
        List<ProxyMethodParameter> queryParameters = new ArrayList<>(basicParameters);
        queryParameters.add(new ProxyMethodParameter.Builder().name("filters")
            .wireType(new ListType(ClassType.STRING))
            .clientType(new ListType(ClassType.STRING))
            .requestParameterName("filter")
            .requestParameterLocation(RequestParameterLocation.QUERY)
            .explode(true)
            .build());
        queryParameters.add(parameter("encoded", "encoded", RequestParameterLocation.QUERY, true));
        List<ProxyMethodParameter> bodyParameters = new ArrayList<>(basicParameters);
        bodyParameters.add(new ProxyMethodParameter.Builder().name("body")
            .wireType(ClassType.BINARY_DATA)
            .clientType(ClassType.BINARY_DATA)
            .requestParameterName("body")
            .requestParameterLocation(RequestParameterLocation.BODY)
            .build());
        List<ProxyMethod> methods = List.of(
            method("send", ClassType.STRING, HttpMethod.POST, requestParameters()).newBuilder()
                .unexpectedResponseExceptionTypes(Map.of(statusException, List.of(404)))
                .unexpectedResponseExceptionType(defaultException)
                .build(),
            method("nested", new MapType(new ListType(ClassType.INTEGER)), HttpMethod.GET, basicParameters),
            method("raw", ClassType.BINARY_DATA, HttpMethod.GET, basicParameters),
            method("bytes", ArrayType.BYTE_ARRAY, HttpMethod.GET, basicParameters).newBuilder()
                .responseContentTypes(Set.of("application/octet-stream"))
                .build(),
            method("stream", ClassType.INPUT_STREAM, HttpMethod.GET, basicParameters),
            method("empty", ClassType.VOID, HttpMethod.POST, basicParameters),
            method("exists", ClassType.BOOLEAN, HttpMethod.HEAD, basicParameters).newBuilder()
                .responseExpectedStatusCodes(List.of(200, 404))
                .build(),
            method("query", ClassType.VOID, HttpMethod.GET, queryParameters),
            method("body", ClassType.VOID, HttpMethod.POST, bodyParameters));
        String output = render(methods);
        Assertions.assertTrue(output.contains("import io.clientcore.core.serialization.json.models.JsonObject;"),
            output);
        Assertions.assertTrue(output.contains("import io.clientcore.core.serialization.json.models.JsonArray;"),
            output);
        Assertions.assertTrue(output.contains("CoreUtils.createParameterizedType(JsonObject.class)"), output);
        Assertions.assertTrue(output.contains("CoreUtils.createParameterizedType(JsonArray.class)"), output);
        compile(output);
        AtomicReference<HttpRequest> capturedRequest = new AtomicReference<>();
        AtomicReference<BinaryData> responseBody = new AtomicReference<>(BinaryData.fromString("\"decoded\""));
        AtomicReference<String> contentType = new AtomicReference<>("application/json");
        AtomicInteger statusCode = new AtomicInteger(200);
        AtomicInteger closes = new AtomicInteger();
        HttpPipeline pipeline = new HttpPipelineBuilder().httpClient(request -> {
            capturedRequest.set(request);
            return new Response<>(request, statusCode.get(),
                new HttpHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType.get()), responseBody.get()) {
                @Override
                public void close() {
                    closes.incrementAndGet();
                    super.close();
                }
            };
        }).build();
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> serviceType = loader.loadClass("com.example.GeneratedClient$ExampleService");
            Object service = serviceType.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            RequestContext context
                = RequestContext.builder().putMetadata("test", "metadata").addRequestCallback(request -> {
                    Assertions.assertEquals("\"payload\"", request.getBody().toString());
                    Assertions.assertEquals("original",
                        request.getHeaders().getValue(HttpHeaderName.fromString("x-test")));
                    request.getHeaders().set(HttpHeaderName.fromString("x-test"), "override");
                }).addQueryParam("callback", "a b").build();
            Response<?> response = invoke(serviceType, service, "send", "https://example.test", "a/b", "x y",
                "original", "payload", context);
            Assertions.assertEquals("decoded", response.getValue());
            Assertions.assertEquals(1, closes.getAndSet(0));
            Assertions.assertEquals("https://example.test/items/a%2Fb?filter=x%20y&callback=a%20b",
                capturedRequest.get().getUri().toString());
            Assertions.assertEquals("override",
                capturedRequest.get().getHeaders().getValue(HttpHeaderName.fromString("x-test")));
            Assertions.assertEquals("metadata", capturedRequest.get().getContext().getMetadata("test"));
            Assertions.assertEquals("9", capturedRequest.get().getHeaders().getValue(HttpHeaderName.CONTENT_LENGTH));

            responseBody.set(BinaryData.fromString("{\"values\":[1,2]}"));
            response = invoke(serviceType, service, "nested", "https://example.test", "item", null);
            Assertions.assertEquals(Map.of("values", List.of(1, 2)), response.getValue());
            Assertions.assertEquals(1, closes.getAndSet(0));

            responseBody.set(BinaryData.fromString("raw"));
            response = invoke(serviceType, service, "raw", "https://example.test", "item", null);
            Assertions.assertEquals(0, closes.get());
            Assertions.assertSame(responseBody.get(), response.getValue());
            response.close();
            Assertions.assertEquals(1, closes.getAndSet(0));

            responseBody.set(BinaryData.fromString("bytes"));
            response = invoke(serviceType, service, "bytes", "https://example.test", "item", null);
            Assertions.assertArrayEquals("bytes".getBytes(StandardCharsets.UTF_8), (byte[]) response.getValue());
            Assertions.assertEquals(1, closes.getAndSet(0));

            responseBody
                .set(BinaryData.fromStream(new ByteArrayInputStream("stream".getBytes(StandardCharsets.UTF_8))));
            response = invoke(serviceType, service, "stream", "https://example.test", "item", null);
            Assertions.assertEquals(0, closes.get());
            Assertions.assertEquals("stream",
                new String(((InputStream) response.getValue()).readAllBytes(), StandardCharsets.UTF_8));
            response.close();

            responseBody.set(BinaryData.fromString(""));
            response = invoke(serviceType, service, "empty", "https://example.test", "item", null);
            Assertions.assertNull(response.getValue());
            Assertions.assertEquals(1, closes.getAndSet(0));
            statusCode.set(404);
            response = invoke(serviceType, service, "exists", "https://example.test", "item", null);
            Assertions.assertEquals(false, response.getValue());
            Assertions.assertEquals(1, closes.getAndSet(0));
            statusCode.set(200);
            response = invoke(serviceType, service, "exists", "https://example.test", "item", null);
            Assertions.assertEquals(true, response.getValue());
            Assertions.assertEquals(1, closes.getAndSet(0));

            invoke(serviceType, service, "query", "https://example.test", "item", null, List.of("a b", "c/d"), "a%2Fb");
            Assertions.assertEquals("https://example.test/items/item?filter=a%20b&filter=c/d&encoded=a%2Fb",
                capturedRequest.get().getUri().toString());
            Assertions.assertEquals(1, closes.getAndSet(0));

            BinaryData unknownLength = BinaryData.fromStream(new ByteArrayInputStream(new byte[] { 1, 2, 3 }));
            Assertions.assertNull(unknownLength.getLength());
            invoke(serviceType, service, "body", "https://example.test", "item", null, unknownLength);
            Assertions.assertSame(unknownLength, capturedRequest.get().getBody());
            Assertions.assertEquals(1, closes.getAndSet(0));

            statusCode.set(404);
            responseBody.set(BinaryData.fromString("{\"message\":\"missing\"}"));
            HttpResponseException exception = Assertions.assertThrows(HttpResponseException.class,
                () -> invoke(serviceType, service, "send", "https://example.test", "item", null, null, null, null));
            Assertions.assertEquals(404, exception.getResponse().getStatusCode());
            JsonObject error = Assertions.assertInstanceOf(JsonObject.class, exception.getValue());
            Assertions.assertEquals("{\"message\":\"missing\"}", error.toJsonString());
            Assertions.assertEquals(1, closes.getAndSet(0));
            statusCode.set(500);
            responseBody.set(BinaryData.fromString("[\"failure\"]"));
            exception = Assertions.assertThrows(HttpResponseException.class,
                () -> invoke(serviceType, service, "send", "https://example.test", "item", null, null, null, null));
            JsonArray defaultError = Assertions.assertInstanceOf(JsonArray.class, exception.getValue());
            Assertions.assertEquals("[\"failure\"]", defaultError.toJsonString());
            Assertions.assertEquals(1, closes.getAndSet(0));
            contentType.set("application/xml");
            responseBody.set(BinaryData.fromString("<error>undeclared</error>"));
            exception = Assertions.assertThrows(HttpResponseException.class,
                () -> invoke(serviceType, service, "send", "https://example.test", "item", null, null, null, null));
            Assertions.assertEquals(500, exception.getResponse().getStatusCode());
            Assertions.assertNull(exception.getCause());
            Assertions.assertEquals(1, closes.getAndSet(0));

            statusCode.set(200);
            responseBody.set(BinaryData.fromString("\"fallback\""));
            contentType.set("application/octet-stream");
            response = invoke(serviceType, service, "send", "https://example.test", "item", null, null, null, null);
            Assertions.assertEquals("fallback", response.getValue());
            Assertions.assertEquals(1, closes.getAndSet(0));
            contentType.set("application/json");
            responseBody.set(BinaryData.fromString("invalid"));
            Assertions.assertThrows(RuntimeException.class,
                () -> invoke(serviceType, service, "send", "https://example.test", "item", null, null, null, null));
            Assertions.assertEquals(1, closes.get());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void rawXmlBodyIsPreserved(String flavor) throws Exception {
        initialize(flavor);
        ProxyMethod method = method("send", ClassType.VOID, HttpMethod.POST, requestParameters()).newBuilder()
            .requestContentType("application/xml")
            .build();
        compile(render(List.of(method)));
        String body = "<document><value>raw</value></document>";
        AtomicReference<HttpRequest> captured = new AtomicReference<>();
        HttpPipeline pipeline = new HttpPipelineBuilder().httpClient(request -> {
            captured.set(request);
            return new Response<>(request, 200, new HttpHeaders(), BinaryData.empty());
        }).build();
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> serviceType = loader.loadClass("com.example.GeneratedClient$ExampleService");
            Object service = serviceType.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            invoke(serviceType, service, "send", "https://example.test", "item", null, null, body, null);
            Assertions.assertEquals(body, captured.get().getBody().toString());
            Assertions.assertEquals("application/xml",
                captured.get().getHeaders().getValue(HttpHeaderName.CONTENT_TYPE));
        }
    }

    @Test
    public void azureCoreV1RetainsAnnotatedProxy() throws Exception {
        initialize("azure");
        String output = render(List.of(method("get", ClassType.STRING, HttpMethod.GET, List.of())));
        Assertions.assertTrue(output.contains("@Host(\"{endpoint}\")"), output);
        Assertions.assertTrue(output.contains("@ServiceInterface"), output);
        Assertions.assertTrue(output.contains("@Get"), output);
        Assertions.assertFalse(output.contains("ExampleServiceImpl"), output);
        Assertions.assertFalse(output.contains("import io.clientcore.core.utils.GeneratedCodeUtils;"), output);
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void noBodyOrQueryOmitsSerializerFieldsAndUriBuilder(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("id", "id", RequestParameterLocation.PATH, false),
                ProxyMethodParameter.REQUEST_CONTEXT_PARAMETER);
        String output = render(List.of(method("send", ClassType.VOID, HttpMethod.GET, parameters)));
        Assertions.assertFalse(output.contains("XmlSerializer"), output);
        Assertions.assertFalse(output.contains("JSON_SERIALIZER ="), output);
        Assertions.assertFalse(output.contains("UriBuilder"), output);
        Assertions.assertTrue(output.contains("JsonSerializer.getInstance()"), output);
        compile(output);
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void xmlAndMixedResponsesKeepOnlyRequiredBranches(String flavor) throws Exception {
        initialize(flavor);
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("id", "id", RequestParameterLocation.PATH, false));
        ProxyMethod xml = method("xml", ClassType.STRING, HttpMethod.GET, parameters).newBuilder()
            .responseContentTypes(Set.of("application/xml"))
            .build();
        String xmlOutput = render(List.of(xml));
        Assertions.assertTrue(xmlOutput.contains("XmlSerializer XML_SERIALIZER"), xmlOutput);
        Assertions.assertFalse(xmlOutput.contains("JsonSerializer JSON_SERIALIZER"), xmlOutput);
        Assertions.assertFalse(xmlOutput.contains("responseSerializationFormat"), xmlOutput);
        compile(xmlOutput);
        ProxyMethod mixed = xml.newBuilder()
            .name("mixed")
            .responseContentTypes(Set.of("application/json", "application/xml"))
            .build();
        String mixedOutput = render(List.of(mixed));
        Assertions.assertTrue(mixedOutput.contains("JsonSerializer JSON_SERIALIZER"), mixedOutput);
        Assertions.assertTrue(mixedOutput.contains("XmlSerializer XML_SERIALIZER"), mixedOutput);
        Assertions.assertTrue(mixedOutput.contains("ClientCoreProtocolUtils.readMixed("), mixedOutput);
        Assertions.assertFalse(mixedOutput.contains("responseSerializationFormat"), mixedOutput);
        compile(mixedOutput);
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void defaultOnlyServiceOmitsUnusedFields(String flavor) throws Exception {
        initialize(flavor);
        ProxyMethod method = method("send", ClassType.VOID, HttpMethod.GET, List.of()).newBuilder()
            .implementation("return null;")
            .build();
        String output = render(List.of(method));
        Assertions.assertFalse(output.contains("Serializer"), output);
        Assertions.assertFalse(output.contains("ClientLogger"), output);
        Assertions.assertFalse(output.contains("HttpPipeline httpPipeline"), output);
        compile(output);
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void xmlErrorOnlySerializerIsLazyAndStillDecodes(String flavor) throws Exception {
        initialize(flavor);
        ClientModels.getInstance()
            .addModel(new ClientModel.Builder().name("XmlError")
                .packageName(ProtocolImplementationTests.class.getName())
                .serializationFormats(Set.of("xml"))
                .properties(List.of())
                .build());
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("id", "id", RequestParameterLocation.PATH, false));
        ProxyMethod method = method("send", ClassType.VOID, HttpMethod.GET, parameters).newBuilder()
            .responseContentTypes(Set.of("application/json"))
            .unexpectedResponseExceptionType(
                new ClassType.Builder().name("XmlErrorException").packageName("com.example").build())
            .build();
        String output = render(List.of(method));
        Assertions.assertFalse(output.contains("XmlSerializer XML_SERIALIZER"), output);
        Assertions.assertFalse(output.contains("JsonSerializer JSON_SERIALIZER"), output);
        Assertions.assertTrue(output.contains("XmlSerializer.getInstance()"), output);
        compile(output);
        AtomicInteger closes = new AtomicInteger();
        HttpPipeline pipeline = new HttpPipelineBuilder().httpClient(request -> new Response<>(request, 400,
            new HttpHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/xml"),
            BinaryData.fromString("<XmlError><message>denied</message></XmlError>")) {
            @Override
            public void close() {
                closes.incrementAndGet();
                super.close();
            }
        }).build();
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> serviceType = loader.loadClass("com.example.GeneratedClient$ExampleService");
            Object service = serviceType.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            HttpResponseException exception = Assertions.assertThrows(HttpResponseException.class,
                () -> invoke(serviceType, service, "send", "https://example.test", "item"));
            Assertions.assertEquals("denied",
                Assertions.assertInstanceOf(XmlError.class, exception.getValue()).message);
            Assertions.assertEquals(1, closes.get());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = { "generic", "azurev2" })
    public void mixedRequestHelpersPreserveExplicitFormatAndLazyNullBodies(String flavor) throws Exception {
        initialize(flavor);
        ClientModels.getInstance()
            .addModel(new ClientModel.Builder().name("XmlError")
                .packageName(ProtocolImplementationTests.class.getName())
                .serializationFormats(Set.of("json", "xml"))
                .properties(List.of())
                .build());
        ClassType bodyType
            = new ClassType.Builder().name("XmlError").packageName(ProtocolImplementationTests.class.getName()).build();
        List<ProxyMethodParameter> parameters
            = List.of(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true),
                parameter("id", "id", RequestParameterLocation.PATH, false),
                parameter("contentType", "Content-Type", RequestParameterLocation.HEADER, false),
                new ProxyMethodParameter.Builder().name("body")
                    .wireType(bodyType)
                    .clientType(bodyType)
                    .requestParameterName("body")
                    .requestParameterLocation(RequestParameterLocation.BODY)
                    .build());
        String output = render(List.of(method("send", ClassType.VOID, HttpMethod.POST, parameters).newBuilder()
            .requestContentType("application/xml")
            .build()));
        Assertions.assertTrue(output.contains("ClientCoreProtocolUtils.setMixedBody("), output);
        String helper = helperSources(output).get(0).getContents().toString();
        Assertions.assertTrue(helperMethods(helper).containsAll(Set.of("setMixedBody", "setBody")), helper);
        compile(output);
        AtomicReference<HttpRequest> captured = new AtomicReference<>();
        HttpPipeline pipeline = new HttpPipelineBuilder().httpClient(request -> {
            captured.set(request);
            return new Response<>(request, 200, new HttpHeaders(), BinaryData.empty());
        }).build();
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> serviceType = loader.loadClass("com.example.GeneratedClient$ExampleService");
            Object service = serviceType.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            for (String contentType : List.of("application/json", "application/vnd.example+json; charset=utf-8",
                "application/custom")) {
                try (Response<?> ignored = invoke(serviceType, service, "send", "https://example.test", "item",
                    contentType, new XmlError("serialized"))) {
                    Assertions.assertEquals(contentType,
                        captured.get().getHeaders().getValue(HttpHeaderName.CONTENT_TYPE));
                    Assertions.assertEquals("{\"message\":\"serialized\"}", captured.get().getBody().toString());
                }
            }
            try (Response<?> ignored = invoke(serviceType, service, "send", "https://example.test", "item", null,
                new XmlError("serialized"))) {
                Assertions.assertEquals("application/xml",
                    captured.get().getHeaders().getValue(HttpHeaderName.CONTENT_TYPE));
                Assertions.assertTrue(captured.get().getBody().toString().contains("<message>serialized</message>"));
            }
            try (Response<?> ignored
                = invoke(serviceType, service, "send", "https://example.test", "item", null, null)) {
                Assertions.assertNull(captured.get().getHeaders().get(HttpHeaderName.CONTENT_TYPE));
            }
        }
    }

    public static final class XmlError implements XmlSerializable<XmlError>, JsonSerializable<XmlError> {
        private final String message;

        private XmlError(String message) {
            this.message = message;
        }

        @Override
        public JsonWriter toJson(JsonWriter writer) throws IOException {
            return writer.writeStartObject().writeStringField("message", message).writeEndObject();
        }

        @Override
        public XmlWriter toXml(XmlWriter writer, String rootElementName) throws XMLStreamException {
            return writer.writeStartElement(rootElementName == null ? "XmlError" : rootElementName)
                .writeStringElement("message", message)
                .writeEndElement();
        }

        public static XmlError fromXml(XmlReader reader) throws XMLStreamException {
            return fromXml(reader, null);
        }

        public static XmlError fromXml(XmlReader reader, String rootElementName) throws XMLStreamException {
            return reader.readObject(rootElementName == null ? "XmlError" : rootElementName, nested -> {
                String message = null;
                while (nested.nextElement() != XmlToken.END_ELEMENT) {
                    if ("message".equals(nested.getElementName().getLocalPart())) {
                        message = nested.getStringElement();
                    } else {
                        nested.skipElement();
                    }
                }
                return new XmlError(message);
            });
        }
    }

    private static void initialize(String flavor) throws Exception {
        JavaSettings.clear();
        new TypeSpecPlugin(EmitterOptions
            .fromJson(JsonReader.fromString("{\"namespace\":\"com.example\",\"flavor\":\"" + flavor + "\"}")), false);
    }

    private static List<ProxyMethodParameter> requestParameters() {
        List<ProxyMethodParameter> parameters = new ArrayList<>();
        parameters.add(parameter("endpoint", "endpoint", RequestParameterLocation.URI, true));
        parameters.add(parameter("responseCode", "id", RequestParameterLocation.PATH, false));
        parameters.add(parameter("uriBuilder", "filter", RequestParameterLocation.QUERY, false));
        parameters.add(parameter("httpRequest", "x-test", RequestParameterLocation.HEADER, false));
        parameters.add(parameter("networkResponse", "body", RequestParameterLocation.BODY, false));
        parameters.add(ProxyMethodParameter.REQUEST_CONTEXT_PARAMETER);
        return parameters;
    }

    private static ProxyMethod method(String name, IType bodyType, HttpMethod httpMethod,
        List<ProxyMethodParameter> parameters) {
        return new ProxyMethod.Builder().name(name)
            .returnType(GenericType.response(bodyType))
            .responseBodyType(bodyType)
            .httpMethod(httpMethod)
            .baseURL("{endpoint}")
            .urlPath("/items/{id}")
            .requestContentType("application/json")
            .responseExpectedStatusCodes(List.of(200))
            .parameters(parameters)
            .allParameters(parameters)
            .isSync(true)
            .build();
    }

    private static String render(List<ProxyMethod> methods) {
        Proxy proxy = proxy(methods);
        JavaFile file = new JavaFile("GeneratedClient.java");
        file.declarePackage("com.example");
        Set<String> imports = new HashSet<>();
        proxy.addImportsTo(imports, true, JavaSettings.getInstance());
        ProxyTemplate.getInstance().addImportsTo(proxy, imports);
        file.declareImport(imports);
        file.publicFinalClass("GeneratedClient", owner -> ProxyTemplate.getInstance().write(proxy, owner));
        return file.getContents().toString();
    }

    private static HttpPipeline responsePipeline(AtomicReference<BinaryData> body, int statusCode,
        AtomicInteger closes) {
        return new HttpPipelineBuilder().httpClient(request -> new Response<>(request, statusCode,
            new HttpHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json")
                .set(HttpHeaderName.fromString("x-test"), "preserved"),
            body.get()) {
            @Override
            public void close() {
                closes.incrementAndGet();
                super.close();
            }
        }).build();
    }

    private static Proxy proxy(List<ProxyMethod> methods) {
        return new Proxy.Builder().name("ExampleService")
            .clientTypeName("ExampleClient")
            .baseURL("{endpoint}")
            .methods(methods)
            .build();
    }

    private JavaPackage compile(String output) throws Exception {
        JavaPackage library = new JavaPackage(Javagen.getPluginInstance());
        JavaFile client = new JavaFile("com/example/GeneratedClient.java");
        client.line(output);
        library.getJavaFiles().add(client);
        library.addClientCoreProtocolUtils();
        library.addClientCoreConstants();
        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
        List<JavaFileObject> sources = new ArrayList<>();
        StringBuilder compiledOutput = new StringBuilder();
        for (JavaFile file : library.getJavaFiles()) {
            String contents = RemoveUnusedImports.removeUnusedImports(file.getContents().toString());
            compiledOutput.append(contents);
            sources.add(javaSource(file.getFilePath(), contents));
        }
        String classpath = System.getProperty("surefire.test.class.path", System.getProperty("java.class.path"));
        try (var manager = ToolProvider.getSystemJavaCompiler().getStandardFileManager(diagnostics, null, null)) {
            boolean compiled = ToolProvider.getSystemJavaCompiler()
                .getTask(null, manager, diagnostics,
                    List.of("--release", "11", "-proc:none", "-classpath", classpath, "-d", classes.toString()), null,
                    sources)
                .call();
            Assertions.assertTrue(compiled, () -> diagnostics.getDiagnostics() + "\n" + compiledOutput);
        }
        return library;
    }

    private static List<JavaFile> helperSources(String... clients) {
        JavaPackage helpers = new JavaPackage(Javagen.getPluginInstance());
        for (int i = 0; i < clients.length; i++) {
            JavaFile source = new JavaFile("Client" + i + ".java");
            source.line(clients[i]);
            helpers.getJavaFiles().add(source);
        }
        helpers.addClientCoreProtocolUtils();
        return helpers.getJavaFiles().subList(clients.length, helpers.getJavaFiles().size());
    }

    private static Set<String> helperMethods(String helper) {
        return StaticJavaParser.parse(helper)
            .findAll(MethodDeclaration.class)
            .stream()
            .map(MethodDeclaration::getNameAsString)
            .collect(Collectors.toSet());
    }

    private static JavaFileObject javaSource(String path, String contents) {
        return new SimpleJavaFileObject(URI.create("string:///" + path.replace('\\', '/')),
            JavaFileObject.Kind.SOURCE) {
            @Override
            public CharSequence getCharContent(boolean ignoreEncodingErrors) {
                return contents;
            }
        };
    }

    private static Response<?> invoke(Class<?> serviceType, Object service, String methodName, Object... arguments)
        throws ReflectiveOperationException {
        try {
            return (Response<?>) Arrays.stream(serviceType.getMethods())
                .filter(method -> methodName.equals(method.getName()))
                .findFirst()
                .orElseThrow()
                .invoke(service, arguments);
        } catch (InvocationTargetException exception) {
            if (exception.getCause() instanceof RuntimeException) {
                throw (RuntimeException) exception.getCause();
            }
            throw exception;
        }
    }

    private static ProxyMethodParameter parameter(String name, String wireName, RequestParameterLocation location,
        boolean encoded) {
        return new ProxyMethodParameter.Builder().name(name)
            .wireType(ClassType.STRING)
            .clientType(ClassType.STRING)
            .requestParameterName(wireName)
            .requestParameterLocation(location)
            .alreadyEncoded(encoded)
            .build();
    }
}
