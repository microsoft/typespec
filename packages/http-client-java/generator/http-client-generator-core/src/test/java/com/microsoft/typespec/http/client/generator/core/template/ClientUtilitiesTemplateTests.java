// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpMethod;
import com.azure.core.http.HttpRequest;
import com.azure.core.http.rest.PagedResponse;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.SimpleResponse;
import com.azure.core.util.Context;
import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformations;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.ByteArrayOutputStream;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Isolated;
import reactor.core.publisher.Mono;

@Isolated
public class ClientUtilitiesTemplateTests {
    @TempDir
    Path directory;

    @AfterEach
    public void restoreSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @Test
    public void emitsOnlyReferencedUtilities() {
        new MockUnitJavagen();
        JavaSettings.clear();
        JavaFile file = new JavaFile("ClientUtils.java");
        ClientUtilitiesTemplate.write(Set.of(ClientUtilitiesTemplate.UtilityMethod.READ_OBJECT), file);
        String source = file.getContents().toString();
        Assertions.assertTrue(source.contains("jsonReader.readObject(reader ->"), source);
        Assertions.assertTrue(source.contains("T model = factory.get();"), source);
        Assertions.assertTrue(source.contains("reader.nextToken() != JsonToken.END_OBJECT"), source);
        Assertions.assertTrue(source.contains("callback.read(model, fieldName, reader);"), source);
        Assertions.assertTrue(source.contains("throws IOException"), source);
        Assertions.assertFalse(source.contains("withContext"), source);
        Assertions.assertFalse(source.contains("PagedResponse"), source);
    }

    @Test
    public void hoistsAndDeduplicatesStringsWithCollidingNames() {
        new MockUnitJavagen();
        JavaSettings.clear();
        List<ProxyMethodParameter> parameters
            = List.of(constant("accept", "application/json"), constant("contentType", "application/json"),
                constant("other", "application-json"), constant("blank", " "), constant("empty", ""));
        ClientMethod method = new ClientMethod.Builder().name("read")
            .type(ClientMethodType.SimpleSyncRestResponse)
            .description("Reads.")
            .parameters(List.of())
            .requiredNullableParameterExpressions(List.of())
            .validateExpressions(Map.of())
            .returnValue(new ReturnValue("The response.", ClassType.STRING))
            .proxyMethod(new ProxyMethod.Builder().name("read")
                .parameters(parameters)
                .allParameters(parameters)
                .returnType(ClassType.STRING)
                .responseContentTypes(Set.of("application/json"))
                .build())
            .build();
        JavaFile file = new JavaFile("Client.java");
        file.publicFinalClass("Client", block -> TemplateUtil.writeClientMethodsAndHelpers(block, List.of(method)));
        String source = file.getContents().toString();
        Assertions.assertTrue(source.contains("String APPLICATION_JSON = \"application/json\""), source);
        Assertions.assertTrue(source.contains("String APPLICATION_JSON_2 = \"application-json\""), source);
        Assertions.assertEquals(
            List.of("APPLICATION_JSON", "APPLICATION_JSON", "APPLICATION_JSON_2", "STRING_CONSTANT", "EMPTY_STRING"),
            method.getProxyMethodArguments(JavaSettings.getInstance()));
        JavaFileContents locals = new JavaFileContents();
        ClientMethodTemplate.addOptionalAndConstantVariables(new JavaBlock(locals), method, JavaSettings.getInstance());
        Assertions.assertTrue(locals.toString().isBlank(), locals.toString());
    }

    private static ProxyMethodParameter constant(String name, String value) {
        return new ProxyMethodParameter.Builder().name(name)
            .parameterReference(name)
            .wireType(ClassType.STRING)
            .clientType(ClassType.STRING)
            .constant(true)
            .required(true)
            .defaultValue(value)
            .build();
    }

    @Test
    public void clientPropertyValidatorsAreSimpleAndPreserveOperationSpecificChecks() throws Exception {
        configureClientValidation(true, false);
        String endpoint = "this.getEndpoint()";
        String subscription = "this.getSubscriptionId()";
        Map<String, String> nestedValidation = Map.of(endpoint, "recordEndpointValidation()");
        List<ClientMethod> methods
            = List.of(clientValidationMethod("both", List.of(endpoint, subscription, "input"), nestedValidation, false),
                clientValidationMethod("only", List.of(endpoint, "input"), Map.of(), false),
                clientValidationMethod("interleaved", List.of(endpoint, "input", subscription), nestedValidation,
                    false),
                clientValidationMethod("reversed", List.of(subscription, endpoint, "input"), nestedValidation, false),
                clientValidationMethod("sync", List.of(endpoint, subscription, "input"), nestedValidation, true));

        JavaFileContents contents = new JavaFileContents();
        TemplateUtil.writeClientMethodsAndHelpers(new JavaClass(contents), methods);
        String generated = contents.toString();
        Assertions.assertTrue(generated.contains("private IllegalArgumentException validateClientProperties()"),
            generated);
        Assertions.assertTrue(generated.contains("if (error != null)"), generated);
        Assertions.assertFalse(generated.contains("switch (property)"), generated);
        Assertions.assertFalse(generated.contains("String... properties"), generated);

        JavaFile utilities = new JavaFile("ClientUtils.java");
        utilities.declarePackage("test");
        ClientUtilitiesTemplate.write(Set.of(ClientUtilitiesTemplate.UtilityMethod.VALIDATE_NOT_NULL), utilities);
        Path utilityFile = directory.resolve("ClientUtils.java");
        Files.writeString(utilityFile, utilities.getContents().toString());
        Path fixtureFile = directory.resolve("ValidationFixture.java");
        String fixture = "package test;\n"
            + "import com.azure.core.annotation.*;\nimport com.azure.core.util.Context;\n"
            + "import reactor.core.publisher.Mono;\n" + "public class ValidationFixture {\n"
            + "public String endpoint, subscriptionId;\n" + "public int endpointValidations;\n"
            + "public boolean rejectEndpoint;\n" + "private final Service service = new Service();\n"
            + "public String getEndpoint() { return endpoint; }\n"
            + "public String getSubscriptionId() { return subscriptionId; }\n"
            + "private void recordEndpointValidation() { endpointValidations++; "
            + "if (rejectEndpoint) throw new IllegalStateException(\"nested\"); }\n" + generated + "\n"
            + "private static class Service {\n" + "Mono<String> both(Object... args) { return Mono.just(\"ok\"); }\n"
            + "Mono<String> only(Object... args) { return Mono.just(\"ok\"); }\n"
            + "Mono<String> interleaved(Object... args) { return Mono.just(\"ok\"); }\n"
            + "Mono<String> reversed(Object... args) { return Mono.just(\"ok\"); }\n"
            + "String syncSync(Object... args) { return \"ok\"; }\n" + "}\n}\n";
        Files.writeString(fixtureFile, fixture);
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        int result = javax.tools.ToolProvider.getSystemJavaCompiler()
            .run(null, diagnostics, diagnostics, "--release", "11", "-classpath",
                System.getProperty("surefire.test.class.path", System.getProperty("java.class.path")), "-d",
                directory.toString(), utilityFile.toString(), fixtureFile.toString());
        Assertions.assertEquals(0, result, () -> diagnostics.toString(StandardCharsets.UTF_8) + "\n" + fixture);
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { directory.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> type = loader.loadClass("test.ValidationFixture");
            Object client = type.getConstructor().newInstance();
            Method both = type.getMethod("both", String.class, Context.class);
            Method only = type.getMethod("only", String.class, Context.class);
            Method interleaved = type.getMethod("interleaved", String.class, Context.class);
            Method reversed = type.getMethod("reversed", String.class, Context.class);
            Method sync = type.getMethod("sync", String.class, Context.class);

            Mono<?> invalid = (Mono<?>) both.invoke(client, "input", Context.NONE);
            IllegalArgumentException failure = Assertions.assertThrows(IllegalArgumentException.class, invalid::block);
            Assertions.assertEquals("Parameter " + endpoint + " is required and cannot be null.", failure.getMessage());
            Assertions.assertEquals(0, type.getField("endpointValidations").getInt(client));

            type.getField("endpoint").set(client, "endpoint");
            invalid = (Mono<?>) both.invoke(client, "input", Context.NONE);
            failure = Assertions.assertThrows(IllegalArgumentException.class, invalid::block);
            Assertions.assertEquals("Parameter " + subscription + " is required and cannot be null.",
                failure.getMessage());
            Assertions.assertEquals(1, type.getField("endpointValidations").getInt(client));
            Assertions.assertEquals("ok", ((Mono<?>) only.invoke(client, "input", Context.NONE)).block());
            Assertions.assertEquals(1, type.getField("endpointValidations").getInt(client));

            invalid = (Mono<?>) interleaved.invoke(client, null, Context.NONE);
            failure = Assertions.assertThrows(IllegalArgumentException.class, invalid::block);
            Assertions.assertEquals("Parameter input is required and cannot be null.", failure.getMessage());
            type.getField("endpoint").set(client, null);
            invalid = (Mono<?>) reversed.invoke(client, "input", Context.NONE);
            failure = Assertions.assertThrows(IllegalArgumentException.class, invalid::block);
            Assertions.assertEquals("Parameter " + subscription + " is required and cannot be null.",
                failure.getMessage());

            java.lang.reflect.InvocationTargetException syncFailure = Assertions.assertThrows(
                java.lang.reflect.InvocationTargetException.class, () -> sync.invoke(client, "input", Context.NONE));
            Assertions.assertInstanceOf(IllegalArgumentException.class, syncFailure.getCause());
            Assertions.assertEquals("Parameter " + endpoint + " is required and cannot be null.",
                syncFailure.getCause().getMessage());
            type.getField("endpoint").set(client, "endpoint");
            type.getField("rejectEndpoint").setBoolean(client, true);
            java.lang.reflect.InvocationTargetException nestedFailure = Assertions.assertThrows(
                java.lang.reflect.InvocationTargetException.class, () -> both.invoke(client, "input", Context.NONE));
            Assertions.assertInstanceOf(IllegalStateException.class, nestedFailure.getCause());
            Assertions.assertEquals("nested", nestedFailure.getCause().getMessage());
        }
    }

    @Test
    public void clientPropertyValidatorAvoidsNameCollisionsAndRespectsConfiguration() {
        configureClientValidation(true, true);
        ClientMethod method
            = clientValidationMethod("validateClientProperties", List.of("this.getEndpoint()"), Map.of(), true);
        JavaFileContents enabled = new JavaFileContents();
        TemplateUtil.writeClientMethodsAndHelpers(new JavaClass(enabled), List.of(method));
        String source = enabled.toString();
        Assertions.assertTrue(source.contains("private IllegalArgumentException validateClientProperties2()"), source);
        Assertions.assertTrue(source.contains("throw LOGGER.atError().log(validationError);"), source);

        configureClientValidation(false, true);
        JavaFileContents disabled = new JavaFileContents();
        TemplateUtil.writeClientMethodsAndHelpers(new JavaClass(disabled), List.of(method));
        source = disabled.toString();
        Assertions.assertFalse(source.contains("private IllegalArgumentException validateClientProperties"), source);
        Assertions.assertFalse(source.contains("validationError = validateClientProperties"), source);
    }

    @Test
    public void clientImplementationsStaticallyImportOnlyReferencedUtilities() {
        configureClientValidation(true, false);
        for (boolean serviceClient : List.of(false, true)) {
            ClientMethod method
                = clientValidationMethod("read", List.of("this.getEndpoint()", "input"), Map.of(), true);
            JavaFile file = writeClientImplementation(List.of(method), serviceClient);
            String source = file.getContents().toString();
            Assertions.assertTrue(
                source.contains("import static " + ClientUtilitiesTemplate.getFullClassName() + ".validateNotNull;"),
                source);
            Assertions.assertTrue(source.contains("validateNotNull(input, \"input\")"), source);
            Assertions.assertFalse(source.contains("ClientUtils.validateNotNull("), source);
            Assertions.assertFalse(source.contains(
                "import static " + ClientUtilitiesTemplate.getFullClassName() + ".createPagedResponse;"), source);
            Assertions.assertEquals(Set.of(ClientUtilitiesTemplate.UtilityMethod.VALIDATE_NOT_NULL),
                ClientUtilitiesTemplate.getUsedMethods(List.of(file)));
        }

        configureClientValidation(false, false);
        JavaFile file = writeClientImplementation(
            List.of(clientValidationMethod("read", List.of("input"), Map.of(), true)), false);
        Assertions.assertFalse(file.getContents().toString().contains("import static "), file.getContents().toString());
        Assertions.assertTrue(ClientUtilitiesTemplate.getUsedMethods(List.of(file)).isEmpty());
    }

    @Test
    public void clientImplementationQualifiesUtilitiesWhenMethodNamesConflict() {
        configureClientValidation(true, false);
        List<ClientMethod> methods
            = List.of(clientValidationMethod("validateNotNull", List.of("input"), Map.of(), true),
                clientValidationMethod("read", List.of("input"), Map.of(), true));
        JavaFile file = writeClientImplementation(methods, false);
        String source = file.getContents().toString();
        Assertions.assertFalse(
            source.contains("import static " + ClientUtilitiesTemplate.getFullClassName() + ".validateNotNull;"),
            source);
        Assertions.assertTrue(source.contains("ClientUtils.validateNotNull(input, \"input\")"), source);
        Assertions.assertEquals(Set.of(ClientUtilitiesTemplate.UtilityMethod.VALIDATE_NOT_NULL),
            ClientUtilitiesTemplate.getUsedMethods(List.of(file)));
    }

    @Test
    public void staticImportsAndConflictingClientMethodsCompileAndValidate() throws Exception {
        configureClientValidation(true, false);
        String utilityType = ClientUtilitiesTemplate.getFullClassName();
        JavaFile utilities = new JavaFile("ClientUtils.java");
        utilities.declarePackage(utilityType.substring(0, utilityType.lastIndexOf('.')));
        ClientUtilitiesTemplate.write(Set.of(ClientUtilitiesTemplate.UtilityMethod.VALIDATE_NOT_NULL), utilities);
        Path utilityFile = directory.resolve("ClientUtils.java");
        Files.writeString(utilityFile, utilities.getContents().toString());

        for (boolean conflict : List.of(false, true)) {
            String name = conflict ? "validateNotNull" : "read";
            String className = conflict ? "ConflictingClient" : "StaticImportClient";
            ClientMethod method = clientValidationMethod(name, List.of("input"), Map.of(), true);
            JavaFile file = new JavaFile(className + ".java");
            file.declarePackage("test");
            file.line();
            file.declareImport("com.azure.core.annotation.ServiceMethod", "com.azure.core.annotation.ReturnType",
                "com.azure.core.util.Context", utilityType);
            file.publicFinalClass(className, block -> {
                block.privateFinalMemberVariable("Service", "service", "new Service()");
                block.publicMethod("String getEndpoint()", getter -> getter.methodReturn("\"endpoint\""));
                block.publicMethod("String getSubscriptionId()", getter -> getter.methodReturn("\"subscription\""));
                TemplateUtil.writeClientMethodsAndHelpers(block, List.of(method));
                block.staticFinalClass(JavaVisibility.Private, "Service",
                    service -> service.packagePrivateMethod("String " + name + "Sync(Object... args)",
                        body -> body.methodReturn("\"ok\"")));
            });
            String source = file.getContents().toString();
            Assertions.assertEquals(!conflict, source.contains("import static " + utilityType + ".validateNotNull;"),
                source);
            Path clientFile = directory.resolve(className + ".java");
            Files.writeString(clientFile, source);
            ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
            int result = javax.tools.ToolProvider.getSystemJavaCompiler()
                .run(null, diagnostics, diagnostics, "--release", "11", "-classpath",
                    System.getProperty("surefire.test.class.path", System.getProperty("java.class.path")), "-d",
                    directory.toString(), utilityFile.toString(), clientFile.toString());
            Assertions.assertEquals(0, result, () -> diagnostics.toString(StandardCharsets.UTF_8) + "\n" + source);

            try (URLClassLoader loader
                = new URLClassLoader(new URL[] { directory.toUri().toURL() }, getClass().getClassLoader())) {
                Class<?> type = loader.loadClass("test." + className);
                Object client = type.getConstructor().newInstance();
                Method operation = type.getMethod(name, String.class, Context.class);
                java.lang.reflect.InvocationTargetException failure
                    = Assertions.assertThrows(java.lang.reflect.InvocationTargetException.class,
                        () -> operation.invoke(client, null, Context.NONE));
                Assertions.assertInstanceOf(IllegalArgumentException.class, failure.getCause());
                Assertions.assertEquals("Parameter input is required and cannot be null.",
                    failure.getCause().getMessage());
                Assertions.assertEquals("ok", operation.invoke(client, "value", Context.NONE));
            }
        }
    }

    private static JavaFile writeClientImplementation(List<ClientMethod> methods, boolean serviceClient) {
        JavaSettings settings = JavaSettings.getInstance();
        String packageName = settings.getPackage(settings.getImplementationSubpackage());
        JavaFile file = new JavaFile("ClientImpl.java");
        file.declarePackage(packageName);
        file.line();
        if (serviceClient) {
            ServiceClient client = new ServiceClient.Builder().packageName(packageName)
                .className("ClientImpl")
                .interfaceName("Client")
                .builderDisabled(true)
                .methodGroupClients(List.of())
                .properties(List.of())
                .constructors(List.of())
                .clientAccessorMethods(List.of())
                .clientMethods(methods)
                .build();
            ServiceClientTemplate.getInstance().write(client, file);
        } else {
            MethodGroupClient client = new MethodGroupClient.Builder().packageName(packageName)
                .className("ClientImpl")
                .interfaceName("Client")
                .serviceClientName("ServiceClientImpl")
                .implementedInterfaces(List.of())
                .supportedInterfaces(List.of())
                .properties(List.of())
                .clientMethods(methods)
                .build();
            MethodGroupTemplate.getInstance().write(client, file);
        }
        return file;
    }

    private static void configureClientValidation(boolean enabled, boolean logger) {
        new MockUnitJavagen() {
            @Override
            @SuppressWarnings("unchecked")
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                if ("client-side-validations".equals(key)) {
                    return (T) Boolean.valueOf(enabled);
                }
                if ("enable-sync-stack".equals(key)) {
                    return (T) Boolean.TRUE;
                }
                if ("client-logger".equals(key)) {
                    return (T) Boolean.valueOf(logger);
                }
                return super.getValue(key, converter);
            }
        };
        JavaSettings.clear();
    }

    private static ClientMethod clientValidationMethod(String name, List<String> required,
        Map<String, String> validations, boolean sync) {
        List<ProxyMethodParameter> proxyParameters = List.of(clientProperty("endpoint", "this.getEndpoint()"),
            clientProperty("subscriptionId", "this.getSubscriptionId()"),
            new ProxyMethodParameter.Builder().name("input")
                .parameterReference("input")
                .wireType(ClassType.STRING)
                .clientType(ClassType.STRING)
                .required(true)
                .build(),
            ProxyMethodParameter.CONTEXT_PARAMETER);
        ClientMethodParameter input = new ClientMethodParameter.Builder().name("input")
            .description("Input.")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .required(true)
            .build();
        return new ClientMethod.Builder().name(name)
            .description("Validates client properties.")
            .type(sync ? ClientMethodType.SimpleSyncRestResponse : ClientMethodType.SimpleAsyncRestResponse)
            .parameters(List.of(input, ClientMethodParameter.CONTEXT_PARAMETER))
            .parameterTransformations(new ParameterTransformations(List.of()))
            .requiredNullableParameterExpressions(required)
            .validateExpressions(validations)
            .returnValue(new ReturnValue("The response.", sync ? ClassType.STRING : GenericType.mono(ClassType.STRING)))
            .proxyMethod(new ProxyMethod.Builder().name(name)
                .httpMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .parameters(proxyParameters)
                .allParameters(proxyParameters)
                .responseContentTypes(Set.of())
                .returnType(GenericType.mono(ClassType.STRING))
                .build())
            .build();
    }

    private static ProxyMethodParameter clientProperty(String name, String reference) {
        return new ProxyMethodParameter.Builder().name(name)
            .parameterReference(reference)
            .wireType(ClassType.STRING)
            .clientType(ClassType.STRING)
            .required(true)
            .fromClient(true)
            .build();
    }

    @Test
    public void generatedUtilitiesPreserveJsonContextValidationAndPagingSemantics() throws Exception {
        String syncValidation = validationBody(true, true);
        String asyncValidation = validationBody(false, true);
        Assertions.assertTrue(validationBody(true, false).isBlank());
        new MockUnitJavagen();
        JavaSettings.clear();
        JavaFile utilities = new JavaFile("ClientUtils.java");
        utilities.declarePackage("test");
        ClientUtilitiesTemplate.write(EnumSet.allOf(ClientUtilitiesTemplate.UtilityMethod.class), utilities);
        Path utilityFile = directory.resolve("ClientUtils.java");
        Files.writeString(utilityFile, utilities.getContents().toString());
        Path checks = directory.resolve("UtilityChecks.java");
        Files.writeString(checks,
            "package test;\n" + "import com.azure.core.util.Context;\nimport com.azure.json.*;\nimport java.util.*;\n"
                + "import java.util.function.Supplier;\nimport reactor.core.publisher.Mono;\n"
                + "public class UtilityChecks {\n"
                + "public static Map<String, Object> read(String json) throws Exception {\n"
                + "try (JsonReader reader = JsonProviders.createReader(json)) {\n"
                + "return ClientUtils.readObject(reader, LinkedHashMap<String, Object>::new, (model, name, r) -> {\n"
                + "if (name.equals(\"value\")) { model.put(name, r.readUntyped()); } else { r.skipChildren(); }\n"
                + "}); }}\n" + "public static Mono<String> context(Supplier<Context> client) {\n"
                + "return ClientUtils.withContext(context -> Mono.deferContextual(reactor -> Mono.just(\n"
                + "context.getData(\"duplicate\").get() + \":\" + reactor.get(\"duplicate\") + \":\"\n"
                + "+ reactor.get(\"subscriberOnly\"))).map(value -> value + \":mapped\"), client);\n" + "}\n"
                + "public static int validations;\n" + "public static void recordValidation() { validations++; }\n"
                + "public static String sync(String first, String second, String validationError) {\n" + syncValidation
                + "\nreturn \"ok\";\n}\n"
                + "public static Mono<String> async(String first, String second, String validationError) {\n"
                + asyncValidation + "\nreturn Mono.just(\"ok\");\n}\n}\n");
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        int result = javax.tools.ToolProvider.getSystemJavaCompiler()
            .run(null, diagnostics, diagnostics, "--release", "11", "-classpath",
                System.getProperty("surefire.test.class.path", System.getProperty("java.class.path")), "-d",
                directory.toString(), utilityFile.toString(), checks.toString());
        Assertions.assertEquals(0, result, diagnostics.toString(StandardCharsets.UTF_8));
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { directory.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> helper = loader.loadClass("test.ClientUtils");
            Class<?> wrapper = loader.loadClass("test.UtilityChecks");
            Method read = wrapper.getMethod("read", String.class);
            Assertions.assertNull(read.invoke(null, "null"));
            Assertions.assertEquals(Map.of(), read.invoke(null, "{}"));
            Assertions.assertEquals(Map.of("value", "last"),
                read.invoke(null, "{\"value\":null,\"unknown\":{\"nested\":[1,2]},\"value\":\"last\"}"));
            Assertions.assertTrue(((Map<?, ?>) read.invoke(null, "{\"value\":null}")).containsKey("value"));

            AtomicReference<Context> client = new AtomicReference<>(new Context("duplicate", "initial"));
            Mono<?> operation
                = (Mono<?>) wrapper.getMethod("context", Supplier.class).invoke(null, (Supplier<Context>) client::get);
            client.set(new Context("duplicate", "client"));
            reactor.util.context.Context subscriber
                = reactor.util.context.Context.of("duplicate", "subscriber", "subscriberOnly", "visible");
            Assertions.assertEquals("client:client:visible:mapped", operation.contextWrite(subscriber).block());
            client.set(new Context("duplicate", "changed"));
            Assertions.assertEquals("changed:changed:visible:mapped", operation.contextWrite(subscriber).block());

            Method validate = helper.getMethod("validateNotNull", Object.class, String.class);
            Assertions.assertNull(validate.invoke(null, "value", "name"));
            Object error = validate.invoke(null, null, "name");
            Assertions.assertInstanceOf(IllegalArgumentException.class, error);
            Assertions.assertEquals("Parameter name is required and cannot be null.", ((Exception) error).getMessage());

            Method sync = wrapper.getMethod("sync", String.class, String.class, String.class);
            java.lang.reflect.InvocationTargetException failure = Assertions.assertThrows(
                java.lang.reflect.InvocationTargetException.class, () -> sync.invoke(null, null, null, "reserved"));
            Assertions.assertInstanceOf(IllegalArgumentException.class, failure.getCause());
            Assertions.assertEquals("Parameter first is required and cannot be null.", failure.getCause().getMessage());
            Assertions.assertEquals(0, wrapper.getField("validations").getInt(null));
            Method async = wrapper.getMethod("async", String.class, String.class, String.class);
            Mono<?> invalid = (Mono<?>) async.invoke(null, "value", null, "reserved");
            Assertions.assertEquals(1, wrapper.getField("validations").getInt(null));
            IllegalArgumentException asyncError
                = Assertions.assertThrows(IllegalArgumentException.class, invalid::block);
            Assertions.assertEquals("Parameter second is required and cannot be null.", asyncError.getMessage());
            Assertions.assertEquals("ok", sync.invoke(null, "first", "second", "reserved"));

            HttpHeaders headers = new HttpHeaders().set("x-test", "value");
            HttpRequest request = new HttpRequest(HttpMethod.GET, "https://localhost/items");
            Response<?> response = new SimpleResponse<>(request, 206, headers, "body");
            List<String> values = List.of("item");
            PagedResponse<?> page = (PagedResponse<?>) helper
                .getMethod("createPagedResponse", Response.class, List.class, String.class, Object.class)
                .invoke(null, response, values, "next", "decoded");
            Assertions.assertSame(request, page.getRequest());
            Assertions.assertSame(headers, page.getHeaders());
            Assertions.assertEquals(206, page.getStatusCode());
            Assertions.assertEquals(values, page.getValue());
            Assertions.assertEquals("next", page.getContinuationToken());
            Assertions.assertEquals("decoded",
                ((com.azure.core.http.rest.PagedResponseBase<?, ?>) page).getDeserializedHeaders());
        }
    }

    private static String validationBody(boolean sync, boolean enabled) {
        new MockUnitJavagen() {
            @Override
            @SuppressWarnings("unchecked")
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                if ("client-side-validations".equals(key)) {
                    return (T) Boolean.valueOf(enabled);
                }
                if ("enable-sync-stack".equals(key)) {
                    return (T) Boolean.TRUE;
                }
                if ("client-logger".equals(key)) {
                    return (T) Boolean.FALSE;
                }
                return super.getValue(key, converter);
            }
        };
        JavaSettings.clear();
        ClientMethod method = new ClientMethod.Builder().name("validate")
            .type(sync ? ClientMethodType.SimpleSyncRestResponse : ClientMethodType.SimpleAsyncRestResponse)
            .parameters(List.of(new ClientMethodParameter.Builder().name("validationError")
                .wireType(ClassType.STRING)
                .annotations(List.of())
                .build()))
            .proxyMethod(new ProxyMethod.Builder().name("validate").parameters(List.of()).build())
            .requiredNullableParameterExpressions(List.of("first", "second"))
            .validateExpressions(Map.of("first", "recordValidation()"))
            .build();
        JavaFileContents contents = new JavaFileContents();
        ClientMethodTemplate.addValidations(new JavaBlock(contents), method, JavaSettings.getInstance());
        return contents.toString();
    }
}
