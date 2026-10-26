// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModelCustomConstructor;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;

public class SseCatalogTests {
    private static final String YAML = "sseStreams:\n" + "  Test.Events:\n" + "    streamName: Events\n"
        + "    modelNamespace: test\n" + "    events:\n" + "      - name: update\n" + "        payload:\n"
        + "          type: dictionary\n" + "          elementType:\n" + "            type: integer\n"
        + "            precision: 64\n" + "operationGroups:\n" + "  - operations:\n"
        + "      - sseStreamId: Test.Events\n" + "      - sseStreamId: Test.Events\n";

    @Test
    public void loadsAndBindsCanonicalDefinitionsWithPolymorphicPayloads() {
        CodeModel model = load(YAML);
        model.resolveSseStreams();
        var operations = model.getOperationGroups().get(0).getOperations();
        Assertions.assertSame(model.getSseStreams().get("Test.Events"), operations.get(0).getSseMetadata());
        Assertions.assertSame(operations.get(0).getSseMetadata(), operations.get(1).getSseMetadata());
        Assertions.assertInstanceOf(DictionarySchema.class,
            operations.get(0).getSseMetadata().getEvents().get(0).getPayload());
    }

    @Test
    public void rejectsDanglingAndEmptyReferences() {
        for (String reference : List.of("Missing.Events", "''")) {
            CodeModel model = load(YAML.replace("sseStreamId: Test.Events", "sseStreamId: " + reference));
            Assertions.assertThrows(IllegalStateException.class, model::resolveSseStreams);
        }
    }

    @Test
    public void acceptsNoSseAndRejectsInvalidCatalogEntries() {
        load("operationGroups: []").resolveSseStreams();
        Assertions.assertThrows(IllegalStateException.class,
            () -> load(YAML.replace("streamName: Events", "streamName: ''")).resolveSseStreams());
    }

    private static CodeModel load(String yaml) {
        return new Yaml(new CodeModelCustomConstructor(new LoaderOptions())).loadAs(yaml, CodeModel.class);
    }
}
