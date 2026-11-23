// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent;

import com.microsoft.typespec.http.client.generator.JavaSettingsTestBase;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SchemaContext;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SealedChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.mapper.MapperUtils;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.mgmt.mapper.FluentObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

public class ArmInternalAccessTests extends JavaSettingsTestBase {
    @ParameterizedTest
    @CsvSource({ "lite,false", "lite,true", "premium,false", "premium,true" })
    public void internalModelsUseImplementationPackagesBeforeInnerPackages(String fluent, boolean flattened) {
        configure(fluent);
        ObjectSchema schema = new ObjectSchema();
        schema.setLanguage(language("InternalModel"));
        schema.setUsage(Set.of(SchemaContext.INPUT, SchemaContext.OUTPUT, SchemaContext.INTERNAL));
        schema.setFlattenedSchema(flattened);
        FluentObjectMapper mapper = (FluentObjectMapper) Mappers.getObjectMapper();
        mapper.addInnerModels(List.of(schema));
        ClassType type = mapper.map(schema);
        Assertions.assertEquals("com.example.implementation.models", type.getPackage());
        Assertions.assertEquals("InternalModel", type.getName());

        ObjectSchema publicSchema = new ObjectSchema();
        publicSchema.setLanguage(language("PublicModel"));
        publicSchema.setUsage(Set.of(SchemaContext.OUTPUT, SchemaContext.PUBLIC));
        mapper.addInnerModels(List.of(publicSchema));
        ClassType publicType = mapper.map(publicSchema);
        Assertions.assertEquals("com.example.fluent.models", publicType.getPackage());
        Assertions.assertEquals("PublicModelInner", publicType.getName());
    }

    @ParameterizedTest
    @CsvSource({ "lite,false", "lite,true", "premium,false", "premium,true" })
    public void internalEnumsUseImplementationPackages(String fluent, boolean expandable) {
        configure(fluent);
        ChoiceSchema schema = expandable ? new ChoiceSchema() : new SealedChoiceSchema();
        schema.setLanguage(language("InternalState"));
        schema.setUsage(Set.of(SchemaContext.INPUT, SchemaContext.INTERNAL));
        StringSchema string = new StringSchema();
        string.setType(Schema.AllSchemaTypes.STRING);
        schema.setChoiceType(string);
        EnumType type = (EnumType) MapperUtils.createEnumType(schema, expandable, true);
        Assertions.assertEquals("com.example.implementation.models", type.getPackage());

        schema.setUsage(Set.of(SchemaContext.INPUT, SchemaContext.PUBLIC));
        EnumType publicType = (EnumType) MapperUtils.createEnumType(schema, expandable, true);
        Assertions.assertEquals("com.example.models", publicType.getPackage());
    }

    private static void configure(String fluent) {
        configureJavaSettings(
            Map.of("namespace", "com.example", "flavor", "azure", "data-plane", "false", "fluent", fluent));
        Mappers.setFactory(new TypeSpecFluentMapperFactory());
    }

    private static Languages language(String name) {
        Language java = new Language();
        java.setName(name);
        Languages languages = new Languages();
        languages.setDefault(java);
        languages.setJava(java);
        return languages;
    }
}
