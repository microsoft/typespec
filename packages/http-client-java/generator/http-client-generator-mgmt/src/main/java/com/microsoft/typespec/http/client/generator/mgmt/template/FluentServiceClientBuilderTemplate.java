// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.template.ServiceClientBuilderTemplate;

import java.util.Set;

public class FluentServiceClientBuilderTemplate extends ServiceClientBuilderTemplate {

    private static final FluentServiceClientBuilderTemplate INSTANCE = new FluentServiceClientBuilderTemplate();

    public static FluentServiceClientBuilderTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void writeSyncClientBuildMethod(AsyncSyncClient syncClient, AsyncSyncClient asyncClient, JavaBlock function,
                                              String buildMethodName, boolean wrapServiceClient) {
        writeSyncClientBuildMethodFromInnerClient(syncClient, function, buildMethodName, wrapServiceClient);
    }

    @Override
    protected void addGeneratedImport(Set<String> imports) {
    }

    @Override
    protected void addGeneratedAnnotation(JavaContext classBlock) {
    }
}
