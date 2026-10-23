// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

public class TypeSpecFluentNamerTests {
    @Test
    public void preservesRootGroupsWhenThereAreNoNestedClients() {
        CodeModel model = new CodeModel();
        OperationGroup group = new OperationGroup();
        model.getOperationGroups().add(group);
        TypeSpecFluentNamer namer = new TypeSpecFluentNamer(new TestHost(), "test", "test", Map.of(), model);

        assertSame(model, namer.getCodeModelAndWriteToTargetFolder(null));
        assertEquals(List.of(group), model.getOperationGroups());
    }

    @Test
    public void exposesNestedGroupsInClientOrderForLegacyManagementTransformers() {
        CodeModel model = new CodeModel();
        model.getOperationGroups().add(new OperationGroup());
        OperationGroup first = new OperationGroup();
        OperationGroup second = new OperationGroup();
        Client firstClient = new Client();
        firstClient.getOperationGroups().add(first);
        Client secondClient = new Client();
        secondClient.getOperationGroups().add(second);
        model.getClients().addAll(List.of(firstClient, secondClient));
        TypeSpecFluentNamer namer = new TypeSpecFluentNamer(new TestHost(), "test", "test", Map.of(), model);

        assertSame(model, namer.getCodeModelAndWriteToTargetFolder(null));
        assertEquals(List.of(first, second), model.getOperationGroups());
    }

    private static final class TestHost extends NewPlugin {
        private TestHost() {
            super(null, "test", "test");
        }

        @Override
        public boolean getBooleanValue(String key, boolean defaultValue) {
            return false;
        }

        @Override
        public void message(Message message) {
        }

        @Override
        public boolean processInternal() {
            throw new UnsupportedOperationException();
        }
    }
}
