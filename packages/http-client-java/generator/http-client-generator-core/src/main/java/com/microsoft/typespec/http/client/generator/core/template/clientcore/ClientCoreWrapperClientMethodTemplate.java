// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaType;
import com.microsoft.typespec.http.client.generator.core.template.WrapperClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import java.util.List;
import java.util.stream.Collectors;

public class ClientCoreWrapperClientMethodTemplate extends WrapperClientMethodTemplate {

    private static final ClientCoreWrapperClientMethodTemplate INSTANCE = new ClientCoreWrapperClientMethodTemplate();

    private ClientCoreWrapperClientMethodTemplate() {
    }

    public static WrapperClientMethodTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void addGeneratedAnnotation(JavaType typeBlock) {
        typeBlock.annotation(Annotation.METADATA.getName() + "(properties = {MetadataProperties.GENERATED})");
    }

    @Override
    protected void writeMethodInvocation(ClientMethod clientMethod, JavaBlock function, boolean shouldReturn) {
        List<ClientMethodParameter> parameters = clientMethod.getMethodInputParameters();
        String argumentList = parameters.stream()
            .filter(parameter -> !MethodUtil.shouldHideParameterInPageable(clientMethod, parameter))
            .map(ClientMethodParameter::getName)
            .collect(Collectors.joining(", "));
        function.line((shouldReturn ? "return " : "") + "this.serviceClient.%1$s(%2$s);", clientMethod.getName(),
            argumentList);
    }

    protected void generateJavadoc(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod) {
        typeBlock.javadocComment(comment -> {
            comment.description(clientMethod.getDescription());
            List<ClientMethodParameter> methodParameters = clientMethod.getMethodInputParameters();
            methodParameters.stream()
                .filter(parameter -> !MethodUtil.shouldHideParameterInPageable(clientMethod, parameter))
                .forEach(parameter -> comment.param(parameter.getName(), parameter.getDescription()));
            if (clientMethod.getParametersDeclaration() != null && !clientMethod.getParametersDeclaration().isEmpty()) {
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
}
