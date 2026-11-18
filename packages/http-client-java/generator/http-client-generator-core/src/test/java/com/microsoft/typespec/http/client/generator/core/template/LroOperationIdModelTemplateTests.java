// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.LongRunningOperationIdMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated
public class LroOperationIdModelTemplateTests {
    @AfterEach
    public void restoreSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @Test
    public void selectedExistingGetterFallsBackToPath() {
        new MockUnitJavagen();
        JavaSettings.clear();
        ClientModel model = model("SelectedOperationId", List.of(property("operationId", ClassType.STRING)), null);
        String source = render(model);
        Assertions.assertTrue(
            source.contains("return this.operationId != null ? this.operationId : this.lroOperationId;"), source);
        Assertions.assertEquals(source.indexOf("String getOperationId()"),
            source.lastIndexOf("String getOperationId()"));
    }

    @Test
    public void inheritedSelectedGetterFallsBackToPath() {
        new MockUnitJavagen();
        JavaSettings.clear();
        ClientModel parent = new ClientModel.Builder().name("OperationIdParent")
            .packageName("com.azure.mock.models")
            .properties(List.of(property("operationId", ClassType.STRING)))
            .build();
        ClientModels.getInstance().addModel(parent);
        String source = render(model("OperationIdChild", List.of(), parent.getName()));
        Assertions.assertTrue(source.contains("String propertyValue = super.getOperationId();"), source);
        Assertions.assertTrue(source.contains("return propertyValue != null ? propertyValue : this.lroOperationId;"),
            source);
    }

    @Test
    public void unsupportedOrConflictingPropertyDoesNotGenerateAnInvalidGetter() {
        new MockUnitJavagen();
        JavaSettings.clear();
        String nonString = render(model("UuidOperationId", List.of(property("operationId", ClassType.UUID)), null));
        Assertions.assertFalse(nonString.contains("private String lroOperationId"), nonString);
        String collision
            = render(model("CollidingOperationId", List.of(property("lroOperationId", ClassType.STRING)), null));
        Assertions.assertFalse(collision.contains("setOperationIdAccessor"), collision);
    }

    private static ClientModelProperty property(String name, ClassType type) {
        return new ClientModelProperty.Builder().name(name)
            .serializedName(name)
            .wireType(type)
            .clientType(type)
            .build();
    }

    private static ClientModel model(String name, List<ClientModelProperty> properties, String parent) {
        LongRunningOperationIdMetadata metadata = new LongRunningOperationIdMetadata();
        metadata.setPathTemplate("/operations/{id}");
        metadata.setPathParameterSerializedName("id");
        metadata.setPollingHeaderName("operation-location");
        metadata.setPropertySerializedName("operationId");
        return new ClientModel.Builder().name(name)
            .packageName("com.azure.mock.models")
            .properties(properties)
            .parentModelName(parent)
            .lroOperationId(metadata)
            .build();
    }

    private static String render(ClientModel model) {
        JavaFile file = new JavaFile(model.getName() + ".java");
        ModelTemplate.getInstance().write(model, file);
        return file.getContents().toString();
    }
}
