// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.example;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IterableType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProtocolExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.ModelExampleUtil;
import com.azure.core.http.ContentType;
import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.Response;
import com.azure.core.util.polling.LongRunningOperationStatus;
import com.azure.core.util.polling.SyncPoller;
import com.azure.core.util.serializer.CollectionFormat;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

public class ProtocolExampleWriter {

    private final Logger logger = new PluginLogger(Javagen.getPluginInstance(), ProtocolExampleWriter.class);

    private final Set<String> imports;
    private final ClientInitializationExampleWriter clientInitializationExampleWriter;
    private final BiConsumer<JavaBlock, Boolean> clientMethodInvocationWriter;
    private final Consumer<JavaBlock> assertionWriter;

    @SuppressWarnings("unchecked")
    public ProtocolExampleWriter(ProtocolExample protocolExample) {
        JavaSettings settings = JavaSettings.getInstance();

        final ClientMethod method = protocolExample.getClientMethod();
        final AsyncSyncClient syncClient = protocolExample.getSyncClient();
        final ProxyMethodExample proxyMethodExample = protocolExample.getProxyMethodExample();
        final String clientVarName = CodeNamer.toCamelCase(syncClient.getClassName());
        final ServiceClient serviceClient = protocolExample.getClientBuilder().getServiceClient();

        this.clientInitializationExampleWriter =
                new ClientInitializationExampleWriter(
                        syncClient,
                        method,
                        proxyMethodExample,
                        serviceClient);

        // import
        this.imports = new HashSet<>();

        imports.addAll(this.clientInitializationExampleWriter.getImports());

        ClassType.BINARY_DATA.addImportsTo(imports, false);
        imports.add(java.util.Arrays.class.getName());
        method.addImportsTo(imports, false, settings);

        // assertion
        imports.add("org.junit.jupiter.api.Assertions");
        imports.add(LongRunningOperationStatus.class.getName());
        ClassType.HTTP_HEADER_NAME.addImportsTo(imports, false);

        // method invocation
        // parameter values and required invocation on RequestOptions
        List<String> params = new ArrayList<>();
        for (ClientMethodParameter parameter : method.getParameters()) {
            params.add(parameter.getClientType().defaultValueExpression());
        }

        StringBuilder binaryDataStmt = new StringBuilder();

        List<String> requestOptionsStmts = new ArrayList<>();

        List<ProxyMethodParameter> proxyMethodParameters = getProxyMethodParameters(method.getProxyMethod(), method.getParameters());
        final int numParam = method.getParameters().size();
        proxyMethodExample.getParameters().forEach((parameterName, parameterValue) -> {
            boolean matchRequiredParameter = false;
            for (int parameterIndex = 0; parameterIndex < numParam; parameterIndex++) {
                ProxyMethodParameter proxyMethodParameter = proxyMethodParameters.get(parameterIndex);
                if (proxyMethodParameter != null) {
                    if (getSerializedName(proxyMethodParameter).equalsIgnoreCase(parameterName)) {
                        // parameter in example found in method signature

                        if (proxyMethodParameter.getCollectionFormat() != null
                                && (proxyMethodParameter.getClientType() instanceof ListType || proxyMethodParameter.getClientType() instanceof IterableType)) {
                            // query with array

                            List<Object> elements = getParameterValueAsList(
                                    proxyMethodParameter.getRequestParameterLocation() == RequestParameterLocation.QUERY
                                            ? parameterValue.getUnescapedQueryValue()
                                            : parameterValue.getObjectValue(),
                                    proxyMethodParameter.getCollectionFormat());
                            if (elements != null) {
                                IType elementType = ((GenericType) proxyMethodParameter.getClientType()).getTypeArguments()[0];
                                String exampleValue = String.format(
                                        "Arrays.asList(%s)",
                                        elements.stream().map(value -> elementType.defaultValueExpression(value.toString())).collect(Collectors.joining(", ")));
                                params.set(parameterIndex, exampleValue);
                            }
                        } else if (proxyMethodParameter.getClientType() != ClassType.BINARY_DATA) {
                            // type like String, int, boolean, date-time

                            String exampleValue = proxyMethodParameter.getRequestParameterLocation() == RequestParameterLocation.QUERY
                                    ? parameterValue.getUnescapedQueryValue().toString()
                                    : parameterValue.getObjectValue().toString();
                            exampleValue = ModelExampleUtil.convertLiteralToClientValue(proxyMethodParameter.getWireType(), exampleValue);
                            params.set(parameterIndex, proxyMethodParameter.getClientType().defaultValueExpression(exampleValue));
                        } else {
                            // BinaryData
                            String binaryDataValue = ClassType.STRING.defaultValueExpression(parameterValue.getJsonString());
                            binaryDataStmt.append(
                                    String.format("BinaryData %s = BinaryData.fromString(%s);",
                                            parameterName, binaryDataValue));
                            params.set(parameterIndex, parameterName);
                        }
                        matchRequiredParameter = true;
                        break;
                    }
                }
            }
            if (!matchRequiredParameter) {
                // parameter in example not found in method signature, check those parameters defined in spec but was left out of method signature

                method.getProxyMethod().getAllParameters().stream().filter(p -> !p.isFromClient()).filter(p -> getSerializedName(p).equalsIgnoreCase(parameterName)).findFirst().ifPresent(p -> {
                    switch (p.getRequestParameterLocation()) {
                        case QUERY:
                            if (p.getCollectionFormat() != null) {
                                List<Object> elements = getParameterValueAsList(
                                        parameterValue.getUnescapedQueryValue(),
                                        p.getCollectionFormat());
                                if (elements != null) {
                                    if (p.getExplode()) {
                                        // collectionFormat: multi
                                        for (Object element : elements) {
                                            requestOptionsStmts.add(
                                                    String.format(".addQueryParam(\"%s\", %s)",
                                                            parameterName,
                                                            ClassType.STRING.defaultValueExpression(element.toString())));
                                        }
                                    } else {
                                        // collectionFormat: csv, ssv, tsv, pipes
                                        String delimiter = p.getCollectionFormat().getDelimiter();
                                        String exampleValue = elements.stream()
                                                .map(Object::toString)
                                                .collect(Collectors.joining(delimiter));
                                        requestOptionsStmts.add(
                                                String.format(".addQueryParam(\"%s\", %s)",
                                                        parameterName,
                                                        ClassType.STRING.defaultValueExpression(exampleValue)));
                                    }
                                }
                            } else {
                                requestOptionsStmts.add(
                                        String.format(".addQueryParam(\"%s\", %s)",
                                                parameterName,
                                                ClassType.STRING.defaultValueExpression(parameterValue.getUnescapedQueryValue().toString())));
                            }
                            break;

                        case HEADER:
                            // TODO (weidxu): header could have csv etc.

                            requestOptionsStmts.add(
                                    String.format(".addHeader(\"%s\", %s)",
                                            parameterName,
                                            ClassType.STRING.defaultValueExpression(parameterValue.getObjectValue().toString())));
                            break;

                        case BODY:
                            requestOptionsStmts.add(
                                    String.format(".setBody(BinaryData.fromString(%s))",
                                            ClassType.STRING.defaultValueExpression(parameterValue.getJsonString())));
                            break;

                        // Path cannot be optional
                    }
                });
            }
        });

        this.clientMethodInvocationWriter = (methodBlock, isTestCode) -> {
            // binaryData
            if (binaryDataStmt.length() > 0) {
                methodBlock.line(binaryDataStmt.toString());
            }
            // requestOptions and context
            if (requestOptionsStmts.isEmpty()) {
                methodBlock.line("RequestOptions requestOptions = new RequestOptions();");
            } else {
                StringBuilder sb = new StringBuilder("RequestOptions requestOptions = new RequestOptions()");
                requestOptionsStmts.forEach(sb::append);
                sb.append(";");
                methodBlock.line(sb.toString());
            }
            for (int i = 0; i < numParam; i++) {
                ClientMethodParameter parameter = method.getParameters().get(i);
                if (parameter.getClientType() == ClassType.REQUEST_OPTIONS) {
                    params.set(i, "requestOptions");
                } else if (parameter.getClientType() == ClassType.CONTEXT) {
                    params.set(i, "Context.NONE");
                }
            }
            String methodCall = String.format("%s.%s(%s)",
                    clientVarName,
                    method.getName(),
                    String.join(", ", params));
            if (isTestCode) {
                if (method.getType() == ClientMethodType.LongRunningBeginSync) {
                    methodCall = "setPlaybackSyncPollerPollInterval(" + methodCall + ")";
                } else if (method.getType() == ClientMethodType.LongRunningBeginAsync) {
                    methodCall = "setPlaybackPollerFluxPollInterval(" + methodCall + ")";
                }
            }
            methodBlock.line(method.getReturnValue().getType() + " response = " + methodCall + ";");
        };

        this.assertionWriter = methodBlock -> {
            ProxyMethodExample.Response response = proxyMethodExample.getPrimaryResponse();
            if (response != null) {
                IType returnType = method.getReturnValue().getType();
                if (returnType instanceof GenericType) {
                    GenericType responseType = (GenericType) returnType;
                    if (Response.class.getSimpleName().equals(responseType.getName())) {
                        // Response<>

                        // assert status code
                        methodBlock.line(String.format("Assertions.assertEquals(%1$s, response.getStatusCode());", response.getStatusCode()));
                        // assert headers
                        response.getHttpHeaders().stream().forEach(header -> {
                            String expectedValueStr = ClassType.STRING.defaultValueExpression(header.getValue());
                            String keyStr = ClassType.STRING.defaultValueExpression(header.getName());
                            methodBlock.line(String.format("Assertions.assertEquals(%1$s, response.getHeaders().get(HttpHeaderName.fromString(%2$s)).getValue());", expectedValueStr, keyStr));
                        });
                        // assert JSON body
                        if (method.getProxyMethod().getResponseContentTypes() != null
                                && method.getProxyMethod().getResponseContentTypes().contains(ContentType.APPLICATION_JSON)
                                && responseType.getTypeArguments().length > 0
                                && responseType.getTypeArguments()[0] == ClassType.BINARY_DATA) {
                            String expectedJsonStr = ClassType.STRING.defaultValueExpression(response.getJsonBody());
                            methodBlock.line(String.format("Assertions.assertEquals(BinaryData.fromString(%1$s).toObject(Object.class), response.getValue().toObject(Object.class));", expectedJsonStr));
                        }
                    } else if (SyncPoller.class.getSimpleName().equals(responseType.getName())) {
                        // SyncPoller<>

                        if (response.getStatusCode() / 100 == 2) {
                            // it should have a 202 leading to SUCCESSFULLY_COMPLETED
                            // but x-ms-examples usually does not include the final result
                            methodBlock.line("Assertions.assertEquals(LongRunningOperationStatus.SUCCESSFULLY_COMPLETED, response.waitForCompletion().getStatus());");
                        }
                    } else if (PagedIterable.class.getSimpleName().equals(responseType.getName())) {
                        // PagedIterable<>

                        // assert status code
                        methodBlock.line(String.format("Assertions.assertEquals(%1$s, response.iterableByPage().iterator().next().getStatusCode());", response.getStatusCode()));
                        // assert headers
                        response.getHttpHeaders().stream().forEach(header -> {
                            String expectedValueStr = ClassType.STRING.defaultValueExpression(header.getValue());
                            String keyStr = ClassType.STRING.defaultValueExpression(header.getName());
                            methodBlock.line(String.format("Assertions.assertEquals(%1$s, response.iterableByPage().iterator().next().getHeaders().get(HttpHeaderName.fromString(%2$s)).getValue());", expectedValueStr, keyStr));
                        });
                        // assert JSON of first item, or assert count=0
                        if (method.getProxyMethod().getResponseContentTypes() != null
                                && method.getProxyMethod().getResponseContentTypes().contains(ContentType.APPLICATION_JSON)
                                && responseType.getTypeArguments().length > 0
                                && responseType.getTypeArguments()[0] == ClassType.BINARY_DATA
                                && method.getMethodPageDetails() != null
                                && response.getBody() instanceof Map) {
                            Map<String, Object> bodyMap = (Map<String, Object>) response.getBody();
                            if (bodyMap.containsKey(method.getMethodPageDetails().getSerializedItemName())) {
                                Object items = bodyMap.get(method.getMethodPageDetails().getSerializedItemName());
                                if (items instanceof List) {
                                    List<Object> itemArray = (List<Object>) items;
                                    if (itemArray.isEmpty()) {
                                        methodBlock.line("Assertions.assertEquals(0, response.stream().count());");
                                    } else {
                                        Object firstItem = itemArray.iterator().next();
                                        String expectedJsonStr = ClassType.STRING.defaultValueExpression(response.getJson(firstItem));
                                        methodBlock.line(String.format("Assertions.assertEquals(BinaryData.fromString(%1$s).toObject(Object.class), response.iterator().next().toObject(Object.class));", expectedJsonStr));
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                methodBlock.line("Assertions.assertNotNull(response);");
            }
        };
    }

    public Set<String> getImports() {
        return imports;
    }

    public void writeClientInitialization(JavaBlock methodBlock) {
        clientInitializationExampleWriter.write(methodBlock);
    }

    public void writeClientMethodInvocation(JavaBlock methodBlock, boolean isTestCode) {
        clientMethodInvocationWriter.accept(methodBlock, isTestCode);
    }

    public void writeAssertion(JavaBlock methodBlock) {
        assertionWriter.accept(methodBlock);
    }

    private static String getSerializedName(ProxyMethodParameter parameter) {
        String serializedName = parameter.getRequestParameterName();
        if (serializedName == null && parameter.getRequestParameterLocation() == RequestParameterLocation.BODY) {
            serializedName = parameter.getName();
        }
        return serializedName;
    }

    private List<ProxyMethodParameter> getProxyMethodParameters(
            ProxyMethod proxyMethod,
            List<ClientMethodParameter> clientMethodParameters) {
        // the list of proxy method parameters will be 1-1 with list of client method parameters

        Map<String, ProxyMethodParameter> proxyMethodParameterByClientParameterName = proxyMethod.getParameters().stream()
                .collect(Collectors.toMap(p -> CodeNamer.getEscapedReservedClientMethodParameterName(p.getName()), Function.identity()));
        List<ProxyMethodParameter> proxyMethodParameters = new ArrayList<>();
        for (ClientMethodParameter clientMethodParameter : clientMethodParameters) {
            ProxyMethodParameter proxyMethodParameter = proxyMethodParameterByClientParameterName.get(clientMethodParameter.getName());
            proxyMethodParameters.add(proxyMethodParameter);

            if (proxyMethodParameter == null) {
                // this should not happen unless we changed the naming of client method parameter from proxy method parameter
                logger.warn("Failed to find proxy method parameter for client method parameter with name '{}'", clientMethodParameter.getName());
            }
        }
        return proxyMethodParameters;
    }

    @SuppressWarnings("unchecked")
    private static List<Object> getParameterValueAsList(Object parameterValue, CollectionFormat collectionFormat) {
        List<Object> elements = null;
        if (parameterValue instanceof String) {
            String value = (String) parameterValue;
            switch (collectionFormat) {
                case CSV:
                    elements = Arrays.stream(value.split(",", -1)).collect(Collectors.toList());
                    break;
                case SSV:
                    elements = Arrays.stream(value.split(" ", -1)).collect(Collectors.toList());
                    break;
                case PIPES:
                    elements = Arrays.stream(value.split("\\|", -1)).collect(Collectors.toList());
                    break;
                case TSV:
                    elements = Arrays.stream(value.split("\t", -1)).collect(Collectors.toList());
                    break;
                default:
                    // TODO (weidxu): CollectionFormat.MULTI
                    elements = Arrays.stream(value.split(",", -1)).collect(Collectors.toList());
                    break;
            }
        } else if (parameterValue instanceof List) {
            elements = (List<Object>) parameterValue;
        }
        return elements;
    }
}
