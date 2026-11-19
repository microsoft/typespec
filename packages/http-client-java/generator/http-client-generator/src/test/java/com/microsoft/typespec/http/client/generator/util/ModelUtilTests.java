// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.microsoft.typespec.http.client.generator.JavaSettingsTestBase;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientResponse;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails.Usage;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.UnionModel;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

public class ModelUtilTests extends JavaSettingsTestBase {
    private List<ClientModel> originalModels;

    @BeforeEach
    public void saveModels() {
        originalModels = ClientModels.getInstance().getModels();
    }

    @AfterEach
    public void restoreModels() {
        ClientModels.getInstance().clear();
        originalModels.forEach(ClientModels.getInstance()::addModel);
    }

    @ParameterizedTest
    @CsvSource({
        "azure, PUBLIC, true",
        "azure, INTERNAL, true",
        "azure, INPUT, false",
        "azure, OUTPUT, false",
        "azure, EXCEPTION, false",
        "azure, SSE, false",
        "azure, SSE+OUTPUT, false",
        "azure, SSE+PUBLIC+OUTPUT, true",
        "azure, SSE+INTERNAL+OUTPUT, true",
        "azure, PUBLIC+EXTERNAL, false",
        "azure, INTERNAL+EXTERNAL, false",
        "azure, PUBLIC+PAGED, false",
        "clientcore, PUBLIC, true",
        "clientcore, INTERNAL, true",
        "clientcore, INPUT, false",
        "clientcore, OUTPUT, false",
        "clientcore, EXCEPTION, false",
        "clientcore, PUBLIC+EXTERNAL, false",
        "clientcore, PUBLIC+PAGED, true",
        "azurev2, PUBLIC, true",
        "azurev2, INTERNAL, true",
        "azurev2, INPUT, true",
        "azurev2, OUTPUT, false",
        "azurev2, EXCEPTION, true",
        "azurev2, PUBLIC+EXTERNAL, false",
        "azurev2, INPUT+EXTERNAL, false",
        "azurev2, EXCEPTION+EXTERNAL, false",
        "azurev2, PUBLIC+PAGED, true" })
    public void selectsModelsAndTheirResponsesByFlavorAndUsage(String flavor, String usages, boolean expected) {
        configureJavaSettings(Map.of("flavor", flavor));
        ClientModel model = new ClientModel.Builder().packageName("com.azure.mock.models")
            .name("EligibilityModel")
            .implementationDetails(details(usages))
            .build();
        ClientModels.getInstance().addModel(model);
        ClassType bodyType = new ClassType.Builder().packageName(model.getPackage()).name(model.getName()).build();
        ClientResponse response = new ClientResponse.Builder().bodyType(bodyType).build();

        assertEquals(expected, ModelUtil.isGeneratingModel(model));
        assertEquals(expected, ModelUtil.isGeneratingModel(response));
    }

    @ParameterizedTest
    @CsvSource({
        "azure, PUBLIC, true",
        "azure, INTERNAL, true",
        "azure, INPUT, false",
        "azure, OUTPUT, false",
        "azure, EXCEPTION, false",
        "azure, PUBLIC+PAGED, true",
        "azure, PUBLIC+EXTERNAL, true",
        "clientcore, PUBLIC, true",
        "clientcore, INTERNAL, true",
        "clientcore, INPUT, false",
        "clientcore, OUTPUT, false",
        "clientcore, EXCEPTION, false",
        "clientcore, PUBLIC+PAGED, true",
        "clientcore, PUBLIC+EXTERNAL, true",
        "azurev2, PUBLIC, true",
        "azurev2, INTERNAL, true",
        "azurev2, INPUT, true",
        "azurev2, OUTPUT, false",
        "azurev2, EXCEPTION, false",
        "azurev2, PUBLIC+PAGED, true",
        "azurev2, INPUT+EXTERNAL, true" })
    public void selectsEnumsByFlavorAndUsage(String flavor, String usages, boolean expected) {
        configureJavaSettings(Map.of("flavor", flavor));
        EnumType model = new EnumType.Builder().name("EligibilityEnum").implementationDetails(details(usages)).build();

        assertEquals(expected, ModelUtil.isGeneratingModel(model));
    }

    @ParameterizedTest
    @CsvSource({
        "PUBLIC, true",
        "INTERNAL, true",
        "INPUT, false",
        "OUTPUT, false",
        "EXCEPTION, false",
        "PUBLIC+EXTERNAL, false",
        "INTERNAL+EXTERNAL, false",
        "PUBLIC+PAGED, true" })
    public void selectsUnionsByVisibilityAndExternalUsage(String usages, boolean expected) {
        UnionModel model = new UnionModel.Builder().implementationDetails(details(usages)).build();

        assertEquals(expected, ModelUtil.isGeneratingModel(model));
    }

    @ParameterizedTest
    @ValueSource(strings = { "azure", "clientcore", "azurev2" })
    public void doesNotGenerateModelsWithoutUsageInformation(String flavor) {
        configureJavaSettings(Map.of("flavor", flavor));

        assertFalse(ModelUtil.isGeneratingModel(new ClientModel.Builder().build()));
        assertFalse(ModelUtil.isGeneratingModel(new EnumType.Builder().build()));
        assertFalse(ModelUtil.isGeneratingModel(new UnionModel.Builder().build()));
        ImplementationDetails empty = new ImplementationDetails.Builder().build();
        assertFalse(ModelUtil.isGeneratingModel(new ClientModel.Builder().implementationDetails(empty).build()));
        assertFalse(ModelUtil.isGeneratingModel(new EnumType.Builder().implementationDetails(empty).build()));
        assertFalse(ModelUtil.isGeneratingModel(new UnionModel.Builder().implementationDetails(empty).build()));
    }

    @ParameterizedTest
    @MethodSource("nonModelBodyTypes")
    @NullSource
    public void doesNotGenerateResponsesWithoutAModelBody(IType bodyType) {
        assertFalse(ModelUtil.isGeneratingModel(new ClientResponse.Builder().bodyType(bodyType).build()));
    }

    private static Stream<IType> nonModelBodyTypes() {
        return Stream.of(PrimitiveType.INT, ClassType.STRING, new ListType(ClassType.STRING),
            new ClassType.Builder().packageName("com.azure.mock.models").name("UnregisteredModel").build());
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "java.lang",
            "com.azure.core.models",
            "io.clientcore.core.models",
            "com.azure.v2.core.models",
            "com.azure.json" })
    public void doesNotGenerateResponsesForLibraryTypesEvenWhenRegistered(String packageName) {
        ClientModel model = new ClientModel.Builder().packageName(packageName)
            .name("LibraryModel")
            .implementationDetails(details("PUBLIC"))
            .build();
        ClientModels.getInstance().addModel(model);
        ClassType bodyType = new ClassType.Builder().packageName(packageName).name(model.getName()).build();

        assertFalse(ModelUtil.isGeneratingModel(new ClientResponse.Builder().bodyType(bodyType).build()));
    }

    private static ImplementationDetails details(String usages) {
        return new ImplementationDetails.Builder()
            .usages(Arrays.stream(usages.split("\\+")).map(Usage::valueOf).collect(Collectors.toSet()))
            .build();
    }
}
