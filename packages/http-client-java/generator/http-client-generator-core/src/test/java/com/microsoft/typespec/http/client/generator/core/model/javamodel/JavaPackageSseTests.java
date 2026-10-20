// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class JavaPackageSseTests {
    @Test
    public void rejectsOrdinaryModelCollisionsBeforeAddingSseFiles() {
        for (String collidingClassName : List.of("RetrievalStreamEvent", "RetrievalStartedStreamEvent",
            "RetrievalStreamEventConverter")) {
            JavaSettings.clear();
            JavaPackage javaPackage = new JavaPackage(new MockUnitJavagen());
            javaPackage.addModel("com.azure.mock.models", collidingClassName,
                new ClientModel.Builder().name(collidingClassName)
                    .packageName("com.azure.mock.models")
                    .properties(List.of())
                    .build());

            IllegalStateException exception = Assertions.assertThrows(IllegalStateException.class,
                () -> javaPackage.addSseEventFiles("com.azure.mock.models", metadata()));

            Assertions.assertTrue(exception.getMessage().contains(collidingClassName));
            Assertions.assertEquals(1, javaPackage.getJavaFiles().size());
        }
    }

    private static SseMetadata metadata() {
        SseEventMetadata event = new SseEventMetadata();
        event.setName("retrieval.started");
        SseMetadata metadata = new SseMetadata();
        metadata.setStreamName("RetrievalStreamEvents");
        metadata.setEvents(List.of(event));
        return metadata;
    }

}
