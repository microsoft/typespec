// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.template.ConvenienceSyncMethodTemplate;

public class ClientCoreConvenienceSyncMethodTemplate extends ConvenienceSyncMethodTemplate {

    private static final ClientCoreConvenienceSyncMethodTemplate INSTANCE
        = new ClientCoreConvenienceSyncMethodTemplate();

    private ClientCoreConvenienceSyncMethodTemplate() {
    }

    public static ClientCoreConvenienceSyncMethodTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void createEmptyRequestOptions(JavaBlock methodBlock) {
        methodBlock.line("RequestContext requestContext = RequestContext.none();");
    }

    @Override
    protected void addRequestCallback(JavaBlock javaBlock, String variableName) {
        javaBlock.line("requestContext = requestContext.toBuilder().addRequestCallback(request -> { request.setBody("
            + variableName + ");}).build();");
    }

    @Override
    protected String getAddQueryParamExpression(MethodParameter parameter, String variable) {
        return String.format("requestContext = requestContext.toBuilder().addQueryParam(%1$s, %2$s, %3$s).build();",
            ClassType.STRING.defaultValueExpression(parameter.getSerializedName()), variable,
            parameter.getProxyMethodParameter().getAlreadyEncoded());
    }
}
