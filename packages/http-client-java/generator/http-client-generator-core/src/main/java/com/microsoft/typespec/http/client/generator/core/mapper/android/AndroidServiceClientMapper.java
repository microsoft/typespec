// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.android;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.ServiceClientMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClientProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.android.AndroidProxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.android.AndroidServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;

import java.util.List;

public class AndroidServiceClientMapper extends ServiceClientMapper {

    private static final ServiceClientMapper INSTANCE = new AndroidServiceClientMapper();

    protected AndroidServiceClientMapper() {
    }

    public static ServiceClientMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected ServiceClient.Builder createClientBuilder() {
        return new AndroidServiceClient.Builder();
    }

    @Override
    protected Proxy.Builder getProxyBuilder() {
        return new AndroidProxy.Builder();
    }

    @Override
    protected void addHttpPipelineProperty(List<ServiceClientProperty> serviceClientProperties) {
        serviceClientProperties.add(
            new ServiceClientProperty("The HTTP pipeline to send requests through.", ClassType.ANDROID_HTTP_PIPELINE,
                "httpPipeline", true, null));
    }

    @Override
    protected void addSerializerAdapterProperty(List<ServiceClientProperty> serviceClientProperties,
        JavaSettings settings) {
        serviceClientProperties.add(new ServiceClientProperty("The serializer to serialize an object into a string.",
            ClassType.ANDROID_JACKSON_SERDER, "jacksonSerder", true, null,
            settings.isFluent() ? JavaVisibility.PackagePrivate : JavaVisibility.Public));
    }

    @Override
    protected IType getHttpPipelineClassType() {
        return ClassType.ANDROID_HTTP_PIPELINE;
    }

    @Override
    protected ClientMethodParameter createSerializerAdapterParameter() {
        return new ClientMethodParameter.Builder().description(
                "The serializer to serialize an object into a string")
            .finalParameter(false)
            .wireType(ClassType.ANDROID_JACKSON_SERDER)
            .name("jacksonSerder")
            .required(true)
            .constant(false)
            .fromClient(true)
            .defaultValue(null)
            .annotations(new java.util.ArrayList<>())
            .build();
    }
}
