// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.android;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaType;
import com.microsoft.typespec.http.client.generator.core.template.ClientMethodTemplate;

public class AndroidClientMethodTemplate extends ClientMethodTemplate {

    private static final ClientMethodTemplate INSTANCE = new AndroidClientMethodTemplate();

    protected AndroidClientMethodTemplate() {
    }

    public static ClientMethodTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected IType getContextType() {
        return ClassType.ANDROID_CONTEXT;
    }

    @Override
    protected void generatePagingSync(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {
    }

    @Override
    protected void generatePagingAsync(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {
    }

    @Override
    protected void generatePagedAsyncSinglePage(ClientMethod clientMethod, JavaType typeBlock,
        ProxyMethod restAPIMethod, JavaSettings settings) {
        typeBlock.annotation("ServiceMethod(returns = ReturnType.SINGLE)");
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addValidations(function, clientMethod.getRequiredNullableParameterExpressions(),
                clientMethod.getValidateExpressions(), settings);
            addOptionalAndConstantVariables(function, clientMethod, restAPIMethod.getParameters(), settings);
            applyParameterTransformations(function, clientMethod, settings);
            //ConvertClientTypesToWireTypes(function, clientMethod, restAPIMethod.getParameters(), clientMethod.getClientReference(), settings);

            if (clientMethod.getMethodPageDetails().nonNullNextLink()) {
                final String completeFutureVariableName = "completableFuture";
                declarePagedCompletableFuture(function, clientMethod, restAPIMethod);

                String serviceMethodCall = generateProxyMethodCall(clientMethod, restAPIMethod, settings);
                function.line(serviceMethodCall);
                function.methodReturn(completeFutureVariableName);
            } else {
                // REVISIT: Is there a use case for this?
            }
        });
    }

    private void declarePagedCompletableFuture(JavaBlock function, ClientMethod clientMethod,
        ProxyMethod restAPIMethod) {
        ProxyMethodParameter callbackParam = restAPIMethod.getParameters()
            .stream()
            .filter(param -> param.getName().equals("callback"))
            .findFirst()
            .get();
        GenericType callbackResponseType
            = (GenericType) ((GenericType) callbackParam.getClientType()).getTypeArguments()[0];
        IType callbackDataType = callbackResponseType.getTypeArguments()[0];

        GenericType clientReturnGenericType = (GenericType) clientMethod.getReturnValue().getType().getClientType();
        GenericType responseType = (GenericType) clientReturnGenericType.getTypeArguments()[0];
        IType modelType = responseType.getTypeArguments()[0];

        function.line("PagedResponseCompletableFuture<%1$s, %2$s> completableFuture =%n", callbackDataType, modelType);
        function.indent(() -> {
            function.line("new PagedResponseCompletableFuture<>(response ->");
            function.indent(() -> function.line(
                "new PagedResponseBase<>(response.getRequest(), response.getStatusCode(), "
                    + "response.getHeaders(), response.getValue().getValue(), response.getValue().getNextLink(), null),"));
            function.line(");");
        });
    }

    @Override
    protected void generateResumable(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {
    }

    @Override
    protected void generateSimpleAsyncRestResponse(ClientMethod clientMethod, JavaType typeBlock,
        ProxyMethod restAPIMethod, JavaSettings settings) {
        typeBlock.annotation("ServiceMethod(returns = ReturnType.SINGLE)");
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addValidations(function, clientMethod.getRequiredNullableParameterExpressions(),
                clientMethod.getValidateExpressions(), settings);
            addOptionalAndConstantVariables(function, clientMethod, restAPIMethod.getParameters(), settings);
            applyParameterTransformations(function, clientMethod, settings);
            // REVISIT: Restore this call for Android
            // ConvertClientTypesToWireTypes(function, clientMethod, restAPIMethod.getParameters(), clientMethod.getClientReference(), settings);

            final String completeFutureVariableName = "completableFuture";
            function.line(declareResponseCompletableFuture(clientMethod));

            String serviceMethodCall = generateProxyMethodCall(clientMethod, restAPIMethod, settings);
            function.line(serviceMethodCall);
            function.methodReturn(completeFutureVariableName);
        });
    }

    private String declareResponseCompletableFuture(ClientMethod clientMethod) {
        GenericType clientReturnGenericType = (GenericType) clientMethod.getReturnValue().getType().getClientType();
        GenericType responseType = (GenericType) clientReturnGenericType.getTypeArguments()[0];
        IType modelType = responseType.getTypeArguments()[0];
        if (modelType.equals(PrimitiveType.VOID)) {
            modelType = ClassType.VOID;
        } else if (modelType.equals(PrimitiveType.BOOLEAN)) {
            modelType = ClassType.BOOLEAN;
        } else if (modelType.equals(PrimitiveType.DOUBLE)) {
            modelType = ClassType.DOUBLE;
        } else if (modelType.equals(PrimitiveType.FLOAT)) {
            modelType = ClassType.FLOAT;
        } else if (modelType.equals(PrimitiveType.INT)) {
            modelType = ClassType.INTEGER;
        } else if (modelType.equals(PrimitiveType.LONG)) {
            modelType = ClassType.LONG;
        }

        return String.format("ResponseCompletableFuture<%1$s> %2$s = new ResponseCompletableFuture<>(); ", modelType,
            "completableFuture");
    }

    private String generateProxyMethodCall(ClientMethod clientMethod, ProxyMethod restAPIMethod,
        JavaSettings settings) {
        java.util.List<String> serviceMethodArgs = clientMethod.getProxyMethodArguments(settings)
            .stream()
            .map(argVal -> {
                if (clientMethod.getParameters()
                    .stream()
                    .filter(param -> param.getName().equals(argVal))
                    .anyMatch(param -> clientMethod.getMethodTransformationDetails()
                        .stream()
                        .anyMatch(
                            transformation -> param.getName().equals(transformation.getOutParameter().getName())))) {
                    return argVal + "Local";
                }

                if (!contextInParameters(clientMethod) && argVal.equals("context")) {
                    return "Context.NONE";
                }

                if (argVal.startsWith("callback")) {
                    return "completableFuture";
                }
                return argVal;
            })
            .collect(java.util.stream.Collectors.toList());
        String restAPIMethodArgumentList = String.join(", ", serviceMethodArgs);
        return String.format("service.%s(%s);", restAPIMethod.getName(), restAPIMethodArgumentList);
    }

    @Override
    protected void generateSimpleAsync(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {
        typeBlock.annotation("ServiceMethod(returns = ReturnType.SINGLE)");
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), (function -> {
            addOptionalVariables(function, clientMethod);
            function.line("return %s(%s).thenApply(response -> response.getValue());",
                clientMethod.getProxyMethod().getSimpleAsyncRestResponseMethodName(), clientMethod.getArgumentList());
        }));
    }

    @Override
    protected void generateSyncMethod(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {
        String asyncMethodName = restAPIMethod.getSimpleAsyncMethodName();
        if (clientMethod.getType() == ClientMethodType.SimpleSyncRestResponse) {
            asyncMethodName = restAPIMethod.getSimpleAsyncRestResponseMethodName();
        }
        String effectiveAsyncMethodName = asyncMethodName;
        typeBlock.annotation("ServiceMethod(returns = ReturnType.SINGLE)");
        typeBlock.publicMethod(clientMethod.getDeclaration(), function -> {
            addOptionalVariables(function, clientMethod);
            if (clientMethod.getReturnValue().getType() == ClassType.INPUT_STREAM) {
                throw new UnsupportedOperationException(
                    "Return type 'ClassType.InputStream' not implemented for android");
            } else {
                IType returnType = clientMethod.getReturnValue().getType();
                String proxyMethodCall = String.format("%s(%s).get()", effectiveAsyncMethodName,
                    clientMethod.getArgumentList());

                function.line("try {");
                if (returnType != PrimitiveType.VOID) {
                    function.methodReturn(proxyMethodCall);
                } else {
                    function.line("\t" + proxyMethodCall + ";");
                }
                function.line("} catch (InterruptedException e) {");
                function.line("\tthrow new RuntimeException(e);");
                function.line("} catch (ExecutionException e) {");
                function.line("\tthrow new RuntimeException(e);");
                function.line("}");
            }
        });
    }

}
