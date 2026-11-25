// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.azure.core.util.Context;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsPageable;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.ClientUtilitiesTemplate;
import com.microsoft.typespec.http.client.generator.core.template.Templates;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentTemplateFactory;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.ByteArrayOutputStream;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated("Fluent mapping uses shared settings")
public class FluentClientMethodContextTests {
    @TempDir
    Path compilationDirectory;

    @AfterEach
    public void restoreSettings() {
        new TestUtils.MockFluentGen();
        JavaSettings.clear();
        Mappers.setFactory(new FluentMapperFactory());
        Templates.setFactory(new FluentTemplateFactory());
    }

    @Test
    public void inheritsDocumentationOnlyForMethodsImplementingTheInterface() {
        useSettings(true);
        Templates.setFactory(new FluentTemplateFactory());
        List<ClientMethod> methods = map(new FluentClientMethodMapper(), operation(false, false));
        ClientMethod publicMethod = find(methods, ClientMethodType.LongRunningSync, true, false);
        ClientMethod privateMethod
            = publicMethod.newBuilder().name("helperCreate").methodVisibility(JavaVisibility.Private).build();
        for (boolean implementsInterface : List.of(false, true)) {
            MethodGroupClient client = new MethodGroupClient.Builder().packageName("com.azure.resourcemanager.mock")
                .className("WidgetsClientImpl")
                .interfaceName("WidgetsClient")
                .implementedInterfaces(implementsInterface ? List.of("WidgetsClient") : List.of())
                .supportedInterfaces(List.of())
                .serviceClientName("MockClient")
                .clientMethods(List.of(publicMethod, privateMethod))
                .build();
            JavaFile file = new JavaFile("WidgetsClientImpl.java");
            Templates.getMethodGroupTemplate().write(client, file);
            String source = file.getContents().toString();
            if (implementsInterface) {
                Assertions.assertTrue(source.contains("@Override"), source);
                Assertions.assertEquals(1, source.split("@Override", -1).length - 1, source);
                Assertions.assertEquals(1, source.split("The create operation.", -1).length - 1, source);
            } else {
                Assertions.assertFalse(source.contains("@Override"), source);
                Assertions.assertEquals(2, source.split("The create operation.", -1).length - 1, source);
            }
            Assertions.assertTrue(source.contains("private " + privateMethod.getDeclaration()), source);
        }
    }

    @Test
    public void forwardsPagingAndLroSyncOverloadsWithoutDuplicatingTheirBodies() {
        useSettings(true);
        for (boolean pageable : List.of(false, true)) {
            Operation operation = operation(pageable, false);
            List<ClientMethod> methods = map(new FluentClientMethodMapper(), operation);
            List<ClientMethodType> types = pageable
                ? List.of(ClientMethodType.PagingSyncSinglePage, ClientMethodType.PagingSync)
                : List.of(ClientMethodType.SimpleSyncRestResponse, ClientMethodType.LongRunningBeginSync,
                    ClientMethodType.LongRunningSync);
            for (ClientMethodType type : types) {
                ClientMethod withContext = find(methods, type, true, false);
                if (type == ClientMethodType.PagingSyncSinglePage) {
                    Assertions.assertTrue(methods.stream()
                        .noneMatch(
                            method -> method.getType() == type && !method.hasMethodParameterOfType(ClassType.CONTEXT)));
                    Assertions.assertTrue(write(withContext).contains("service."));
                    continue;
                }
                ClientMethod noContext = find(methods, type, false, false);
                Assertions.assertTrue(noContext.hasWithContextOverload(), noContext.getDeclaration());
                Assertions.assertFalse(withContext.hasWithContextOverload(), withContext.getDeclaration());
                Assertions.assertEquals(noContext.getReturnValue().getType(), withContext.getReturnValue().getType());
                String source = write(noContext);
                Assertions.assertTrue(source.contains("return " + noContext.getName() + "(id, Context.NONE);"), source);
                Assertions.assertFalse(source.contains("service."), source);
                Assertions.assertFalse(source.contains("new PagedIterable"), source);
                Assertions.assertFalse(source.contains("getLroResult"), source);
                String contextSource = write(withContext);
                Assertions.assertFalse(contextSource.contains("Context.NONE"), contextSource);
                if (type == ClientMethodType.SimpleSyncRestResponse || type == ClientMethodType.PagingSyncSinglePage) {
                    Assertions.assertTrue(contextSource.contains("ResourceManagerUtils.validateNotNull(id, \"id\")"),
                        contextSource);
                    Assertions.assertTrue(contextSource.contains("service."), contextSource);
                } else if (type == ClientMethodType.PagingSync) {
                    Assertions.assertTrue(contextSource.contains("new PagedIterable"), contextSource);
                } else if (type == ClientMethodType.LongRunningBeginSync) {
                    Assertions.assertTrue(contextSource.contains("getLroResult"), contextSource);
                }
            }
        }
    }

    @Test
    public void removesPrivateLroBeginOverloadsSupersededByContextForwarding() {
        useSettings(true);
        List<ClientMethod> methods = map(new FluentClientMethodMapper(), operation(false, true));
        Assertions.assertTrue(methods.stream()
            .noneMatch(method -> method.getType() == ClientMethodType.LongRunningBeginSync
                && method.getMethodVisibility() == JavaVisibility.Private
                && !method.hasMethodParameterOfType(ClassType.CONTEXT)));
        Assertions.assertNotNull(find(methods, ClientMethodType.LongRunningBeginSync, true, false));
        Assertions.assertNotNull(find(methods, ClientMethodType.LongRunningBeginSync, false, true));
    }

    @Test
    public void forwardsRequiredOnlyParametersInOrderAndPreservesHistoricalContextSignatures() {
        useSettings(true);
        for (boolean pageable : List.of(false, true)) {
            List<ClientMethod> methods = map(new FluentClientMethodMapper(), operation(pageable, true));
            ClientMethodType type = pageable ? ClientMethodType.PagingSync : ClientMethodType.LongRunningBeginSync;
            ClientMethod requiredOnly = find(methods, type, false, true);
            Assertions.assertTrue(requiredOnly.hasWithContextOverload());
            String source = write(requiredOnly);
            Assertions.assertTrue(source.contains("String filter = null;"), source);
            Assertions.assertTrue(source.contains("String added = null;"), source);
            Assertions.assertTrue(source.contains(requiredOnly.getName() + "(id, filter, added, Context.NONE)"),
                source);
            ClientMethod historical = methods.stream()
                .filter(method -> method.getType() == type
                    && method.hasMethodParameterOfType(ClassType.CONTEXT)
                    && method.getParametersDeclaration().equals("String id, String filter, Context context"))
                .findFirst()
                .orElseThrow();
            String historicalSource = write(historical);
            Assertions.assertFalse(historicalSource.contains("Context.NONE"), historicalSource);
            Assertions.assertTrue(historicalSource.contains("context"), historicalSource);
        }
    }

    @Test
    public void generatedForwarderPreservesResultsDefaultsAndValidation() throws Exception {
        useSettings(true);
        List<ClientMethod> methods = map(new FluentClientMethodMapper(), operation(false, true));
        ClientMethod requiredOnly = find(methods, ClientMethodType.LongRunningSync, false, true);
        ClientMethod withContext = find(methods, ClientMethodType.LongRunningSync, true, false);
        JavaFile file = new JavaFile("TestClientImpl.java");
        file.declareImport(List.of("com.azure.core.annotation.ServiceMethod", "com.azure.core.annotation.ReturnType",
            "com.azure.core.management.exception.ManagementException", "com.azure.core.util.Context"));
        file.publicFinalClass("TestClientImpl", javaClass -> {
            javaClass.privateMemberVariable("Object[]", "arguments");
            javaClass.publicMethod("Object[] getArguments()", block -> block.methodReturn("arguments"));
            FluentClientMethodTemplate.getInstance().write(requiredOnly, javaClass);
            javaClass.publicMethod(withContext.getDeclaration(), block -> {
                block.ifBlock("id == null",
                    ifBlock -> ifBlock.line("throw new IllegalArgumentException(\"id is required\");"));
                block.line("arguments = new Object[] {id, filter, added, context};");
                block.methodReturn("\"result\"");
            });
        });
        Path source = compilationDirectory.resolve("TestClientImpl.java");
        Files.writeString(source, file.getContents().toString());
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        int result = ToolProvider.getSystemJavaCompiler()
            .run(null, diagnostics, diagnostics, "-classpath",
                System.getProperty("surefire.test.class.path", System.getProperty("java.class.path")), "-d",
                compilationDirectory.toString(), source.toString());
        Assertions.assertEquals(0, result, diagnostics.toString(StandardCharsets.UTF_8));
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { compilationDirectory.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> clientType = loader.loadClass("TestClientImpl");
            Object client = clientType.getConstructor().newInstance();
            var method = clientType.getMethod(requiredOnly.getName(), String.class);
            Assertions.assertEquals("result", method.invoke(client, "widget"));
            Object[] arguments = (Object[]) clientType.getMethod("getArguments").invoke(client);
            Assertions.assertArrayEquals(new Object[] { "widget", null, null, Context.NONE }, arguments);
            InvocationTargetException error = Assertions.assertThrows(InvocationTargetException.class,
                () -> method.invoke(client, new Object[] { null }));
            Assertions.assertInstanceOf(IllegalArgumentException.class, error.getCause());
        }
    }

    @Test
    public void forwardsEmptyAndVoidOverloads() {
        useSettings(true);
        Operation operation = operation(false, false);
        operation.getRequests().get(0).setParameters(List.of());
        operation.getRequests().get(0).setSignatureParameters(List.of());
        operation.getResponses().get(0).setSchema(null);
        List<ClientMethod> methods = map(new FluentClientMethodMapper(), operation);
        ClientMethod begin = find(methods, ClientMethodType.LongRunningBeginSync, false, false);
        String beginSource = write(begin);
        Assertions.assertTrue(beginSource.contains("return " + begin.getName() + "(Context.NONE);"), beginSource);
        ClientMethod wait = find(methods, ClientMethodType.LongRunningSync, false, false);
        String waitSource = write(wait);
        Assertions.assertTrue(waitSource.contains("void " + wait.getName() + "()"), waitSource);
        Assertions.assertTrue(waitSource.contains(wait.getName() + "(Context.NONE);"), waitSource);
        Assertions.assertFalse(waitSource.contains("return "), waitSource);
    }

    @Test
    public void retainsContextOnFirstAndNextPages() {
        useSettings(true);
        Operation operation = operation(true, true);
        ObjectSchema page = (ObjectSchema) operation.getResponses().get(0).getSchema();
        page.setLanguage(languages("WidgetPageWithNextLink"));
        Property nextLink = new Property();
        nextLink.setLanguage(languages("nextLink"));
        nextLink.setSerializedName("nextLink");
        nextLink.setSchema(stringSchema());
        page.setProperties(List.of(page.getProperties().get(0), nextLink));
        XmsPageable paging = operation.getExtensions().getXmsPageable();
        paging.setNextLinkName("nextLink");
        paging.setNextLinkProperty(List.of(nextLink));
        Operation next = operation(true, false);
        next.setLanguage(languages("listNext"));
        next.getRequests().get(0).setLanguage(next.getLanguage());
        next.getResponses().get(0).setSchema(page);
        Parameter nextLinkParameter = parameter("nextLink", true);
        nextLinkParameter.setOperation(next);
        List<Parameter> nextParameters = new ArrayList<>(next.getRequests().get(0).getParameters());
        nextParameters.add(nextLinkParameter);
        next.getRequests().get(0).setParameters(nextParameters);
        next.getRequests().get(0).setSignatureParameters(nextParameters);
        paging.setNextOperation(next);
        next.getExtensions().getXmsPageable().setNextOperation(next);
        next.getExtensions().getXmsPageable().setNextLinkName("nextLink");
        next.getExtensions().getXmsPageable().setNextLinkProperty(List.of(nextLink));
        List<ClientMethod> methods = map(new FluentClientMethodMapper(), operation);
        methods.stream()
            .filter(method -> method.getType() == ClientMethodType.PagingAsyncSinglePage)
            .forEach(method -> {
                String pagingSource = write(method);
                Assertions.assertTrue(
                    pagingSource.contains(
                        ".map(res -> " + ClientUtilitiesTemplate.getFullClassName() + ".createPagedResponse("),
                    pagingSource);
                Assertions.assertFalse(pagingSource.contains(".<PagedResponse<"), pagingSource);
            });
        ClientMethod withContext = find(methods, ClientMethodType.PagingSync, true, false);
        String source = write(withContext);
        Assertions.assertTrue(source.contains("listSinglePage(id, filter, added, context)"), source);
        Assertions.assertTrue(source.contains("listNextSinglePage(id, nextLink, context)"), source);
        ClientMethod requiredOnly = find(methods, ClientMethodType.PagingSync, false, true);
        Assertions.assertTrue(write(requiredOnly).contains("list(id, filter, added, Context.NONE)"));
    }

    @Test
    public void doesNotForwardWhenTheMatchingContextMethodIsNotGenerated() {
        useSettings(true);
        FluentClientMethodMapper mapper = new FluentClientMethodMapper() {
            @Override
            protected JavaVisibility methodVisibility(ClientMethodType type, MethodOverloadType overload,
                boolean context, boolean protocol) {
                return context ? NOT_GENERATE : super.methodVisibility(type, overload, false, protocol);
            }
        };
        List<ClientMethod> methods = map(mapper, operation(true, false));
        ClientMethod singlePage = find(methods, ClientMethodType.PagingSyncSinglePage, false, false);
        Assertions.assertFalse(singlePage.hasWithContextOverload());
        Assertions.assertTrue(write(singlePage).contains("service."));
    }

    @Test
    public void preservesAsyncAndSyncOverAsyncContextPropagation() {
        for (boolean syncStack : List.of(false, true)) {
            useSettings(syncStack);
            for (boolean pageable : List.of(false, true)) {
                List<ClientMethod> methods = map(new FluentClientMethodMapper(), operation(pageable, false));
                ClientMethodType asyncType
                    = pageable ? ClientMethodType.PagingAsyncSinglePage : ClientMethodType.SimpleAsyncRestResponse;
                String asyncSource = write(find(methods, asyncType, false, false));
                Assertions.assertTrue(asyncSource.contains("ResourceManagerUtils.withContext"), asyncSource);
                Assertions.assertTrue(asyncSource.contains("() -> this.client.getContext()"), asyncSource);
                Assertions.assertFalse(asyncSource.contains("Context.NONE"), asyncSource);
                if (pageable) {
                    Assertions.assertTrue(
                        asyncSource.contains(
                            ".map(res -> " + ClientUtilitiesTemplate.getFullClassName() + ".createPagedResponse("),
                        asyncSource);
                    Assertions.assertFalse(asyncSource.contains(".<PagedResponse<"), asyncSource);
                }
                if (!syncStack) {
                    ClientMethodType syncType
                        = pageable ? ClientMethodType.PagingSync : ClientMethodType.LongRunningBeginSync;
                    String syncSource = write(find(methods, syncType, false, false));
                    Assertions.assertFalse(syncSource.contains("Context.NONE"), syncSource);
                    Assertions.assertTrue(syncSource.contains("Async("), syncSource);
                }
            }
        }
    }

    @Test
    public void implementationStaticallyImportsUsedContextPagingAndValidationHelpers() {
        useSettings(true);
        Templates.setFactory(new FluentTemplateFactory());
        for (String conflictingMethod : List.of("", "withContext", "createPagedResponse", "validateNotNull")) {
            List<ClientMethod> methods = new ArrayList<>(map(new FluentClientMethodMapper(), operation(true, false)));
            if (!conflictingMethod.isEmpty()) {
                methods.add(methods.get(0).newBuilder().name(conflictingMethod).build());
            }
            JavaSettings settings = JavaSettings.getInstance();
            String packageName = settings.getPackage(settings.getImplementationSubpackage());
            MethodGroupClient client = new MethodGroupClient.Builder().packageName(packageName)
                .className("WidgetsClientImpl")
                .interfaceName("WidgetsClient")
                .implementedInterfaces(List.of())
                .supportedInterfaces(List.of())
                .serviceClientName("MockClient")
                .clientMethods(methods)
                .build();
            JavaFile file = new JavaFile("WidgetsClientImpl.java");
            file.declarePackage(packageName);
            file.line();
            Templates.getMethodGroupTemplate().write(client, file);

            String source = file.getContents().toString();
            String utility = ClientUtilitiesTemplate.getFullClassName();
            for (String method : List.of("withContext", "createPagedResponse", "validateNotNull")) {
                boolean collision = method.equals(conflictingMethod);
                Assertions.assertEquals(!collision, source.contains("import static " + utility + "." + method + ";"),
                    source);
                Assertions.assertEquals(collision, source.contains("ResourceManagerUtils." + method + "("), source);
            }
            Assertions.assertEquals(
                Set.of(ClientUtilitiesTemplate.UtilityMethod.WITH_CONTEXT,
                    ClientUtilitiesTemplate.UtilityMethod.CREATE_PAGED_RESPONSE,
                    ClientUtilitiesTemplate.UtilityMethod.VALIDATE_NOT_NULL),
                ClientUtilitiesTemplate.getUsedMethods(List.of(file)));
        }
    }

    @Test
    public void collectionForwardsSimpleRequestsToMatchingResponseOverloads() {
        useSettings(true);
        for (boolean returnsVoid : List.of(false, true)) {
            Operation operation = operation(false, false);
            operation.getExtensions().setXmsLongRunningOperation(false);
            if (returnsVoid) {
                operation.getResponses().get(0).setSchema(null);
            }
            List<ClientMethod> methods = map(new FluentClientMethodMapper(), operation);
            String source = writeCollection(methods);
            String invocation = "this.createWithResponse(id, Context.NONE)" + (returnsVoid ? ";" : ".getValue();");
            Assertions.assertTrue(source.contains(invocation), source);
            List<ClientMethod> withoutResponse = methods.stream()
                .filter(method -> method.getType() != ClientMethodType.SimpleSyncRestResponse)
                .collect(Collectors.toList());
            String fallback = writeCollection(withoutResponse);
            Assertions.assertFalse(fallback.contains(invocation), fallback);
            Assertions.assertTrue(fallback.contains("this.serviceClient().create(id)"), fallback);
        }
    }

    @Test
    public void collectionMatchesOptionalAndHistoricalResponseSignaturesExactly() {
        useSettings(true);
        Operation operation = operation(false, true);
        operation.getExtensions().setXmsLongRunningOperation(false);
        operation.getRequests().get(0).getParameters().get(1).setRequired(true);
        List<ClientMethod> methods = map(new FluentClientMethodMapper(), operation);
        ClientMethod requiredOnly = find(methods, ClientMethodType.SimpleSync, false, true);
        ClientMethod response = find(methods, ClientMethodType.SimpleSyncRestResponse, true, false);
        ClientMethod historicalResponse = methods.stream()
            .filter(method -> method.getType() == ClientMethodType.SimpleSyncRestResponse
                && method.getParametersDeclaration().equals("String id, String filter, Context context"))
            .findFirst()
            .orElseThrow();
        String source = writeCollection(List.of(requiredOnly, response, historicalResponse));
        Assertions.assertTrue(source.contains("this.createWithResponse(id, filter, Context.NONE).getValue()"), source);
        String mismatch = writeCollection(List.of(requiredOnly, response));
        Assertions.assertFalse(mismatch.contains("this.createWithResponse("), mismatch);
        Assertions.assertTrue(mismatch.contains("this.serviceClient().create(id, filter)"), mismatch);
    }

    @Test
    public void collectionPreservesNonResponseCollectionConversions() {
        useSettings(true);
        Operation operation = operation(false, false);
        operation.getExtensions().setXmsLongRunningOperation(false);
        ArraySchema values = new ArraySchema();
        values.setLanguage(languages("WidgetValues"));
        values.setType(Schema.AllSchemaTypes.ARRAY);
        values.setElementType(stringSchema());
        operation.getResponses().get(0).setSchema(values);
        String source = writeCollection(map(new FluentClientMethodMapper(), operation));
        Assertions.assertFalse(source.contains("this.createWithResponse(id, Context.NONE).getValue()"), source);
        Assertions.assertTrue(source.contains("this.serviceClient().create(id)"), source);
    }

    @Test
    public void collectionPreservesNullableResourceModelConversion() {
        useSettings(true);
        Operation operation = operation(false, false);
        operation.getExtensions().setXmsLongRunningOperation(false);
        List<ClientMethod> methods = map(new FluentClientMethodMapper(), operation);
        ClassType innerType = new ClassType.Builder()
            .packageName(JavaSettings.getInstance().getPackage(JavaSettings.getInstance().getFluentModelsSubpackage()))
            .name("WidgetInner")
            .build();
        ClientMethod value = find(methods, ClientMethodType.SimpleSync, false, false).newBuilder()
            .returnValue(new ReturnValue("the widget", innerType))
            .build();
        ClientMethod response = find(methods, ClientMethodType.SimpleSyncRestResponse, true, false).newBuilder()
            .returnValue(new ReturnValue("the response", GenericType.response(innerType)))
            .build();
        String source = writeCollection(List.of(value, response));
        Assertions.assertFalse(source.contains("this.createWithResponse(id, Context.NONE).getValue()"), source);
        Assertions.assertTrue(source.contains("this.serviceClient().create(id)"), source);
        Assertions.assertTrue(source.contains("return null;"), source);
    }

    @Test
    public void collectionForwardsPagingOnlyWhenContextBehaviorMatches() {
        for (boolean syncStack : List.of(false, true)) {
            useSettings(syncStack);
            String source = writeCollection(map(new FluentClientMethodMapper(), operation(true, false)));
            Assertions.assertEquals(syncStack, source.contains("return this.list(id, Context.NONE);"), source);
            if (!syncStack) {
                Assertions.assertTrue(source.contains("this.serviceClient().list(id)"), source);
            }
        }
    }

    private static String writeCollection(List<ClientMethod> methods) {
        Client previousClient = FluentStatic.getClient();
        Client client = new Client.Builder().models(List.of()).responseModels(List.of()).build();
        FluentStatic.setClient(client);
        try {
            MethodGroupClient group = new MethodGroupClient.Builder().packageName("com.azure.resourcemanager.mock")
                .className("WidgetsClientImpl")
                .interfaceName("WidgetsClient")
                .clientMethods(methods)
                .build();
            JavaFile file = new JavaFile("WidgetsImpl.java");
            List<FluentCollectionMethod> generatedMethods = new FluentResourceCollection(group).getMethodsForTemplate();
            file.publicFinalClass("WidgetsImpl", javaClass -> generatedMethods
                .forEach(method -> method.getImplementationMethodTemplate(generatedMethods).writeMethod(javaClass)));
            return file.getContents().toString();
        } finally {
            FluentStatic.setClient(previousClient);
        }
    }

    private static List<ClientMethod> map(FluentClientMethodMapper mapper, Operation operation) {
        Schema schema = operation.getResponses().get(0).getSchema();
        if (schema instanceof ObjectSchema) {
            Mappers.getModelMapper().map((ObjectSchema) schema);
        }
        return mapper.map(operation, false);
    }

    private static ClientMethod find(List<ClientMethod> methods, ClientMethodType type, boolean context,
        boolean requiredOnly) {
        return methods.stream()
            .filter(method -> method.getType() == type
                && method.hasMethodParameterOfType(ClassType.CONTEXT) == context
                && method.getOnlyRequiredParameters() == requiredOnly
                && method.getOverloadedClientMethod() == null)
            .findFirst()
            .orElseThrow();
    }

    private static String write(ClientMethod method) {
        JavaFile file = new JavaFile("TestClientImpl.java");
        file.publicFinalClass("TestClientImpl",
            javaClass -> FluentClientMethodTemplate.getInstance().write(method, javaClass));
        return file.getContents().toString();
    }

    private static void useSettings(boolean syncStack) {
        new TestUtils.MockFluentGen() {
            @SuppressWarnings("unchecked")
            @Override
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                return "enable-sync-stack".equals(key)
                    ? (T) Boolean.valueOf(syncStack)
                    : super.getValue(key, converter);
            }

            @SuppressWarnings("unchecked")
            @Override
            public <T> T getValueWithJsonReader(String key, IOExceptionCheckedFunction<JsonReader, T> converter) {
                return "enable-sync-stack".equals(key)
                    ? (T) Boolean.valueOf(syncStack)
                    : super.getValueWithJsonReader(key, converter);
            }
        };
        JavaSettings.clear();
        Mappers.setFactory(new FluentMapperFactory());
    }

    private static Operation operation(boolean pageable, boolean optionalParameters) {
        Operation operation = new Operation();
        operation.setLanguage(languages(pageable ? "list" : "create"));
        OperationGroup group = new OperationGroup();
        group.setLanguage(languages("Widgets"));
        CodeModel codeModel = new CodeModel();
        codeModel.setLanguage(languages("WidgetManagementClient"));
        codeModel.setOperationGroups(List.of(group));
        group.setCodeModel(codeModel);
        operation.setOperationGroup(group);
        Protocol http = new Protocol();
        http.setMethod(pageable ? "GET" : "PUT");
        http.setUri("https://example.org");
        http.setPath("/widgets");
        Request request = new Request();
        request.setProtocol(protocols(http));
        request.setLanguage(operation.getLanguage());
        List<Parameter> parameters = new ArrayList<>();
        parameters.add(parameter("id", true));
        if (optionalParameters) {
            parameters.add(parameter("filter", false));
            Parameter added = parameter("added", false);
            XmsExtensions extensions = new XmsExtensions();
            extensions.setXmsVersioningAdded(new ArrayList<>(List.of("v2")));
            added.setExtensions(extensions);
            parameters.add(added);
        }
        parameters.forEach(parameter -> parameter.setOperation(operation));
        request.setParameters(parameters);
        request.setSignatureParameters(parameters);
        operation.setRequests(List.of(request));
        Response response = new Response();
        Protocol responseHttp = new Protocol();
        responseHttp.setStatusCodes(List.of("200"));
        response.setProtocol(protocols(responseHttp));
        response.setSchema(stringSchema());
        XmsExtensions extensions = new XmsExtensions();
        if (pageable) {
            ObjectSchema page = new ObjectSchema();
            page.setType(Schema.AllSchemaTypes.OBJECT);
            page.setLanguage(languages("WidgetPage"));
            ArraySchema values = new ArraySchema();
            values.setLanguage(languages("WidgetValues"));
            values.setType(Schema.AllSchemaTypes.ARRAY);
            values.setElementType(stringSchema());
            Property value = new Property();
            value.setLanguage(languages("value"));
            value.setSerializedName("value");
            value.setSchema(values);
            page.setProperties(List.of(value));
            response.setSchema(page);
            XmsPageable paging = new XmsPageable();
            paging.setItemName("value");
            paging.setPageItemsProperty(List.of(value));
            extensions.setXmsPageable(paging);
        } else {
            extensions.setXmsLongRunningOperation(true);
        }
        operation.setExtensions(extensions);
        operation.setResponses(List.of(response));
        return operation;
    }

    private static Parameter parameter(String name, boolean required) {
        Parameter parameter = new Parameter();
        parameter.setLanguage(languages(name));
        parameter.setSchema(stringSchema());
        parameter.setRequired(required);
        parameter.setImplementation(Parameter.ImplementationLocation.METHOD);
        Protocol http = new Protocol();
        http.setIn(RequestParameterLocation.QUERY);
        parameter.setProtocol(protocols(http));
        return parameter;
    }

    private static StringSchema stringSchema() {
        StringSchema schema = new StringSchema();
        schema.setLanguage(languages("String"));
        schema.setType(Schema.AllSchemaTypes.STRING);
        return schema;
    }

    private static Languages languages(String name) {
        Language language = new Language();
        language.setName(name);
        language.setSerializedName(name);
        Languages languages = new Languages();
        languages.setJava(language);
        languages.setDefault(language);
        return languages;
    }

    private static Protocols protocols(Protocol http) {
        Protocols protocols = new Protocols();
        protocols.setHttp(http);
        return protocols;
    }
}
