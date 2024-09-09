// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.android;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaInterface;
import com.microsoft.typespec.http.client.generator.core.template.ProxyTemplate;

import java.util.List;

public class AndroidProxyTemplate extends ProxyTemplate {
    private static final ProxyTemplate INSTANCE = new AndroidProxyTemplate();

    protected AndroidProxyTemplate() {
    }

    public static ProxyTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void writeUnexpectedExceptions(ProxyMethod restAPIMethod, JavaInterface interfaceBlock) {
        StringBuilder annotationBuilder = new StringBuilder();
        annotationBuilder.append(String.format("UnexpectedResponseExceptionTypes({%n"));
        for (java.util.Map.Entry<ClassType, List<Integer>> exception : restAPIMethod.getUnexpectedResponseExceptionTypes().entrySet()) {
            annotationBuilder.append(String.format("\t@UnexpectedResponseExceptionType(value = %1$s.class, code = {%2$s})%n",
                    exception.getKey(), exception.getValue().stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(", "))));
        }
        annotationBuilder.append(String.format("})%n"));
        interfaceBlock.annotation(annotationBuilder.toString());
    }

    @Override
    protected void writeSingleUnexpectedException(ProxyMethod restAPIMethod, JavaInterface interfaceBlock) {
        // REVISIT: For some reason this can be called even when writeUnexpectedExceptions is called already
    }
}
