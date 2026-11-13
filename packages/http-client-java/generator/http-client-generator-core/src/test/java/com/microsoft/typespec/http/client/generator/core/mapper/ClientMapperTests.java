// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated
public class ClientMapperTests {
    @BeforeEach
    @AfterEach
    public void resetSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @Test
    public void preservesOrdinaryModelPackageCollection() {
        List<ClientModel> models
            = List.of(new ClientModel.Builder().name("Zebra").packageName("com.azure.zebra.models").build(),
                new ClientModel.Builder().name("Apple").packageName("com.azure.apple.models").build(),
                new ClientModel.Builder().name("Mango").packageName("com.azure.mango.models").build());
        List<String> expected
            = new ArrayList<>(models.stream().map(ClientModel::getPackage).collect(Collectors.toSet()));

        Assertions.assertEquals(expected, ClientMapper.getInstance().getModelsPackages(models, List.of(), List.of()));
    }
}
