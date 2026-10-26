// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated
public class ClientMethodSseTests {
    @AfterEach
    public void restoreSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @Test
    public void resolvesSyncOverAsyncDeclarationAndCallForHiddenSseProtocolMethods() {
        new MockUnitJavagen();
        JavaSettings.clear();
        for (String contentType : List.of("text/event-stream", "application/json")) {
            ClientMethod method = new ClientMethod.Builder().name("readWithResponseInternal")
                .type(ClientMethodType.SimpleSyncRestResponse)
                .parameters(List.of())
                .returnValue(new ReturnValue("the response", GenericType.response(ClassType.BINARY_DATA)))
                .proxyMethod(new ProxyMethod.Builder().responseContentTypes(Set.of(contentType)).build())
                .build();
            JavaFile javaFile = new JavaFile("Test.java");
            javaFile.publicFinalClass("Test", javaClass -> new ClientMethodTemplate().generateSyncMethod(method,
                javaClass, JavaSettings.getInstance()));
            String source = javaFile.getContents().toString();
            if ("text/event-stream".equals(contentType)) {
                Assertions.assertTrue(source.contains("readWithResponse()"));
                Assertions.assertTrue(source.contains("readWithResponseAsync().block()"));
                Assertions.assertFalse(source.contains("readWithResponseInternal"));
            } else {
                Assertions.assertTrue(source.contains("readWithResponseInternal()"));
                Assertions.assertTrue(source.contains("readWithResponseInternalAsync().block()"));
            }
        }
    }
}
