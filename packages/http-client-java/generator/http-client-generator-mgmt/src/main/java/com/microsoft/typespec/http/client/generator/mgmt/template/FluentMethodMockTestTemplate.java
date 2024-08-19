// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentMethodMockUnitTest;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleHelperFeature;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleNode;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.IJavaTemplate;
import com.microsoft.typespec.http.client.generator.core.template.example.ModelExampleWriter;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.azure.core.credential.AccessToken;
import com.azure.core.http.HttpResponse;
import com.azure.core.management.profile.AzureProfile;
import com.azure.json.JsonProviders;
import com.azure.json.JsonWriter;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class FluentMethodMockTestTemplate
    implements IJavaTemplate<FluentMethodMockTestTemplate.ClientMethodInfo, JavaFile> {

    public static class ClientMethodInfo {
        private final String className;

        private final FluentMethodMockUnitTest fluentMethodMockUnitTest;

        public ClientMethodInfo(String className, FluentMethodMockUnitTest fluentMethodMockUnitTest) {
            this.className = className;
            this.fluentMethodMockUnitTest = fluentMethodMockUnitTest;
        }
    }

    private static final FluentMethodMockTestTemplate INSTANCE = new FluentMethodMockTestTemplate();

    private FluentMethodMockTestTemplate() {
    }

    public static FluentMethodMockTestTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(ClientMethodInfo info, JavaFile javaFile) {
        Set<String> imports = new HashSet<>(
            Arrays.asList(AccessToken.class.getName(), ClassType.HTTP_CLIENT.getFullName(),
                ClassType.HTTP_HEADERS.getFullName(), ClassType.HTTP_REQUEST.getFullName(),
                HttpResponse.class.getName(), "com.azure.core.test.http.MockHttpResponse",
                ClassType.AZURE_ENVIRONMENT.getFullName(), AzureProfile.class.getName(), "org.junit.jupiter.api.Test",
                ByteBuffer.class.getName(), Mono.class.getName(), Flux.class.getName(),
                StandardCharsets.class.getName(), OffsetDateTime.class.getName()));

        String className = info.className;
        FluentMethodMockUnitTest fluentMethodMockUnitTest = info.fluentMethodMockUnitTest;
        ClientMethod clientMethod = fluentMethodMockUnitTest.getCollectionMethod().getInnerClientMethod();
        IType fluentReturnType = fluentMethodMockUnitTest.getFluentReturnType();
        final boolean isResponseType = FluentUtils.isResponseType(fluentReturnType);
        if (isResponseType) {
            fluentReturnType = FluentUtils.getValueTypeFromResponseType(fluentReturnType);
        }
        final boolean hasReturnValue = fluentReturnType.asNullable() != ClassType.VOID;

        // method invocation
        String clientMethodInvocationWithResponse;
        FluentExampleTemplate.ExampleMethod exampleMethod;
        if (fluentMethodMockUnitTest.getFluentResourceCreateExample() != null) {
            exampleMethod = FluentExampleTemplate.getInstance()
                .generateExampleMethod(fluentMethodMockUnitTest.getFluentResourceCreateExample());
        } else if (fluentMethodMockUnitTest.getFluentMethodExample() != null) {
            exampleMethod = FluentExampleTemplate.getInstance()
                .generateExampleMethod(fluentMethodMockUnitTest.getFluentMethodExample());
        } else {
            throw new IllegalStateException();
        }
        String clientMethodInvocation = exampleMethod.getMethodContent();
        if (hasReturnValue) {
            // hack on replaceResponseForValue, as in "update" case, "exampleMethod.getMethodContent()" would be a code
            // block, not a single line of code invocation.
            clientMethodInvocationWithResponse = fluentReturnType + " response = " + (isResponseType
                ? replaceResponseForValue(clientMethodInvocation)
                : clientMethodInvocation);
        } else {
            clientMethodInvocationWithResponse = clientMethodInvocation;
        }
        imports.addAll(exampleMethod.getImports());
        exampleMethod.getExample().getEntryType().addImportsTo(imports, false);
        fluentReturnType.addImportsTo(imports, false);

        // create response body with mocked data
        int statusCode = fluentMethodMockUnitTest.getResponse().getStatusCode();
        Object jsonObject = fluentMethodMockUnitTest.getResponse().getBody();
        ExampleNode verificationNode = fluentMethodMockUnitTest.getResponseVerificationNode();
        String verificationObjectName = fluentMethodMockUnitTest.getResponseVerificationVariableName();
        String jsonStr;
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JsonWriter jsonWriter = JsonProviders.createWriter(outputStream)) {
            jsonWriter.writeUntyped(jsonObject).flush();
            jsonStr = outputStream.toString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to serialize Object to JSON string", e);
        }

        // prepare assertions
        ModelExampleWriter.ExampleNodeAssertionVisitor assertionVisitor
            = new ModelExampleWriter.ExampleNodeAssertionVisitor();
        if (hasReturnValue) {
            imports.add("org.junit.jupiter.api.Assertions");

            assertionVisitor.accept(verificationNode, verificationObjectName);
            imports.addAll(assertionVisitor.getImports());
        }

        javaFile.declareImport(imports);

        javaFile.publicFinalClass(className, classBlock -> {
            classBlock.annotation("Test");
            classBlock.publicMethod(
                "void test" + CodeNamer.toPascalCase(clientMethod.getName()) + "() throws Exception",
                methodBlock -> {
                    // response
                    methodBlock.line("String responseStr = " + ClassType.STRING.defaultValueExpression(jsonStr) + ";");
                    methodBlock.line();

                    // prepare mock class
                    methodBlock.line(
                        "HttpClient httpClient = response -> Mono.just(new MockHttpResponse(response, " + statusCode
                            + ", responseStr.getBytes(StandardCharsets.UTF_8)));");

                    // initialize manager
                    String exampleMethodName = exampleMethod.getExample().getEntryType().getName();
                    methodBlock.line(exampleMethodName + " manager = " + exampleMethodName + ".configure()"
                        + ".withHttpClient(httpClient).authenticate(tokenRequestContext -> "
                        + "Mono.just(new AccessToken(\"this_is_a_token\", OffsetDateTime.MAX)), "
                        + "new AzureProfile(\"\", \"\", AzureEnvironment.AZURE));");
                    methodBlock.line();
                    // method invocation
                    methodBlock.line(clientMethodInvocationWithResponse);
                    methodBlock.line();
                    // verification
                    if (hasReturnValue) {
                        assertionVisitor.getAssertions().forEach(methodBlock::line);
                    }
                });

            // helper method
            if (exampleMethod.getHelperFeatures().contains(ExampleHelperFeature.MapOfMethod)) {
                ModelExampleWriter.writeMapOfMethod(classBlock);
            }
        });
    }

    private static String replaceResponseForValue(String clientMethodInvocation) {
        if (clientMethodInvocation.endsWith(";")) {
            clientMethodInvocation = clientMethodInvocation.substring(0, clientMethodInvocation.length() - 1);
            clientMethodInvocation += ".getValue();";
        }
        return clientMethodInvocation;
    }
}
