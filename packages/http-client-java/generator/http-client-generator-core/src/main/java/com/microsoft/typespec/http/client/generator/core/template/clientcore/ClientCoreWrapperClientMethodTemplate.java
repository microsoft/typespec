// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.WrapperClientMethodTemplate;
import io.clientcore.core.annotations.ReturnType;
import java.util.List;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class ClientCoreWrapperClientMethodTemplate extends WrapperClientMethodTemplate {

    private static final ClientCoreWrapperClientMethodTemplate INSTANCE = new ClientCoreWrapperClientMethodTemplate();

    private ClientCoreWrapperClientMethodTemplate() {
    }

    public static WrapperClientMethodTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(ClientMethod clientMethod, JavaType typeBlock) {
        ClientMethodType methodType = clientMethod.getType();
        List<ClientMethodParameter> inputParams = clientMethod.getMethodInputParameters();

        // For LRO and paging methods, there is no ClientMethodType to indicate max overload method. So, we check if
        // RequestContext is not present to determine if it is a convenience method. Currently, only max overloads
        // have RequestContext as a parameter.
        boolean hasRequestContext
            = inputParams != null && inputParams.contains(ClientMethodParameter.REQUEST_CONTEXT_PARAMETER);

        if (methodType == ClientMethodType.SimpleSync) {
            // Max overload for single service API is of method type SimpleSyncRestResponse
            writeConvenienceMethod(clientMethod, typeBlock, ReturnType.SINGLE,
                clientMethod.getProxyMethod().getSimpleRestResponseMethodName());
            return;
        } else if (methodType == ClientMethodType.PagingSync && !hasRequestContext) {
            writeConvenienceMethod(clientMethod, typeBlock, ReturnType.COLLECTION, clientMethod.getName());
            return;
        } else if (methodType == ClientMethodType.LongRunningBeginSync && !hasRequestContext) {
            writeConvenienceMethod(clientMethod, typeBlock, ReturnType.LONG_RUNNING_OPERATION, clientMethod.getName());
            return;
        }
        super.write(clientMethod, typeBlock);
    }

    @Override
    protected void addGeneratedAnnotation(JavaType typeBlock) {
        typeBlock.annotation(Annotation.METADATA.getName() + "(properties = {MetadataProperties.GENERATED})");
    }

    @Override
    protected void writeMethodInvocation(ClientMethod clientMethod, JavaBlock function, boolean shouldReturn) {
        List<ClientMethodParameter> parameters = clientMethod.getMethodInputParameters();
        Stream<ClientMethodParameter> argStream = parameters.stream();

        if (clientMethod.isPageStreamingType()) {
            argStream
                = argStream.filter(parameter -> !clientMethod.getMethodPageDetails().shouldHideParameter(parameter));
        }

        final String requestContextParam = parameters.stream()
            .filter(p -> p.getClientType() == ClassType.REQUEST_CONTEXT)
            .map(ClientMethodParameter::getName)
            .findFirst()
            .orElse(null);

        // don't instrument pageables on the client level, we'll instrument them on the impl
        final boolean shouldInstrument = !clientMethod.isPageStreamingType();
        if (shouldInstrument) {
            final String argumentList
                = argStream.map(p -> p.getClientType() == ClassType.REQUEST_CONTEXT ? "updatedContext" : p.getName())
                    .collect(Collectors.joining(", "));

            function.line((shouldReturn ? "return " : "")
                + "this.instrumentation.instrumentWithResponse(\"%1$s\", %2$s, updatedContext -> this.serviceClient.%3$s(%4$s));",
                clientMethod.getOperationInstrumentationInfo().getOperationName(), requestContextParam,
                clientMethod.getName(), argumentList);
        } else {
            function.line((shouldReturn ? "return " : "") + "this.serviceClient.%1$s(%2$s);", clientMethod.getName(),
                argStream.map(MethodParameter::getName).collect(Collectors.joining(", ")));
        }
    }

    protected void generateJavadoc(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod) {
        typeBlock.javadocComment(comment -> {
            comment.description(clientMethod.getDescription());
            final Stream<ClientMethodParameter> methodParameters = clientMethod.getMethodInputParameters().stream();
            if (clientMethod.isPageStreamingType()) {
                final MethodPageDetails pageDetails = clientMethod.getMethodPageDetails();
                methodParameters.filter(parameter -> !pageDetails.shouldHideParameter(parameter))
                    .forEach(parameter -> comment.param(parameter.getName(), parameter.getDescription()));
            } else {
                methodParameters.forEach(parameter -> comment.param(parameter.getName(), parameter.getDescription()));
            }
            if (clientMethod.hasParameterDeclaration()) {
                comment.methodThrows("IllegalArgumentException", "thrown if parameters fail the validation");
            }
            if (restAPIMethod != null) {
                generateJavadocExceptions(clientMethod, comment, false);
                comment.methodThrows("RuntimeException",
                    "all other wrapped checked exceptions if the request fails to be sent");
            }
            comment.methodReturns(clientMethod.getReturnValue().getDescription());
        });
    }

    private void writeConvenienceMethod(ClientMethod clientMethod, JavaType typeBlock, ReturnType returnType,
        String maxOverloadMethodName) {
        ProxyMethod restAPIMethod = clientMethod.getProxyMethod();
        generateJavadoc(clientMethod, typeBlock, restAPIMethod);
        addGeneratedAnnotation(typeBlock);
        addServiceMethodAnnotation(typeBlock, returnType);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), (function -> {
            addOptionalVariables(function, clientMethod);
            String argumentList = clientMethod.getMethodParameters()
                .stream()
                .filter(parameter -> clientMethod.getMethodPageDetails() == null
                    || !clientMethod.getMethodPageDetails().shouldHideParameter(parameter))
                .map(ClientMethodParameter::getName)
                .collect(Collectors.joining(", "));
            argumentList = argumentList == null || argumentList.isEmpty()
                ? "RequestContext.none()"
                : argumentList + ", RequestContext.none()";

            if (clientMethod.getReturnValue().getType().equals(PrimitiveType.VOID)) {
                function.line("%s(%s);", maxOverloadMethodName, argumentList);
            } else if (clientMethod.getType() == ClientMethodType.PagingSync
                || clientMethod.getType() == ClientMethodType.LongRunningBeginSync) {
                function.line("return %s(%s);", maxOverloadMethodName, argumentList);
            } else {
                function.line("return %s(%s).getValue();", maxOverloadMethodName, argumentList);
            }
        }));
    }

    private void writeMethod(JavaType typeBlock, JavaVisibility visibility, String methodSignature,
        Consumer<JavaBlock> method) {
        if (visibility == JavaVisibility.Public) {
            typeBlock.publicMethod(methodSignature, method);
        } else if (typeBlock instanceof JavaClass) {
            JavaClass classBlock = (JavaClass) typeBlock;
            classBlock.method(visibility, null, methodSignature, method);
        }
    }

    private void addServiceMethodAnnotation(JavaType typeBlock, ReturnType returnType) {
        typeBlock.annotation("ServiceMethod(returns = ReturnType." + returnType.name() + ")");
    }

    private void addOptionalVariables(JavaBlock function, ClientMethod clientMethod) {
        if (!clientMethod.getOnlyRequiredParameters()) {
            return;
        }

        final MethodPageDetails pageDetails
            = clientMethod.isPageStreamingType() ? clientMethod.getMethodPageDetails() : null;
        for (ClientMethodParameter parameter : clientMethod.getMethodParameters()) {
            if (parameter.isRequired()) {
                // Parameter is required and will be part of the method signature.
                continue;
            }
            if (pageDetails != null && pageDetails.shouldHideParameter(parameter)) {
                continue;
            }

            IType parameterClientType = parameter.getClientType();
            String defaultValue = parameterDefaultValueExpression(parameterClientType, parameter.getDefaultValue(),
                JavaSettings.getInstance());
            function.line("final %s %s = %s;", parameterClientType, parameter.getName(),
                defaultValue == null ? "null" : defaultValue);
        }
    }

    private String parameterDefaultValueExpression(IType parameterClientType, String parameterDefaultValue,
        JavaSettings settings) {
        String defaultValue;
        if (settings.isNullByteArrayMapsToEmptyArray() && parameterClientType == ArrayType.BYTE_ARRAY) {
            defaultValue = "new byte[0]";
        } else {
            defaultValue = parameterClientType.defaultValueExpression(parameterDefaultValue);
        }
        return defaultValue;
    }
}
