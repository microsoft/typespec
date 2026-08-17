// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.mapper.ModelMapper;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

public class FluentMapperTests {

    @Test
    public void testRemoveModelsUsesConfiguredModelMapper() {
        Set<String> removedModels = Set.of("RemovedModel");
        FluentJavaSettings settings = Mockito.mock(FluentJavaSettings.class);
        Mockito.when(settings.getJavaNamesForAddInner()).thenReturn(Collections.emptySet());
        Mockito.when(settings.getJavaNamesForRemoveInner()).thenReturn(Collections.emptySet());
        Mockito.when(settings.getJavaNamesForRemoveModel()).thenReturn(removedModels);

        CodeModel codeModel = Mockito.mock(CodeModel.class);
        Mockito.when(codeModel.getOperationGroups()).thenReturn(Collections.emptyList());

        RecordingFluentModelMapper modelMapper = new RecordingFluentModelMapper();
        Mappers.setFactory(new FluentMapperFactory() {
            @Override
            public ModelMapper getModelMapper() {
                return modelMapper;
            }
        });

        try {
            new FluentMapper(settings).preModelMap(codeModel);
            Assertions.assertEquals(removedModels, modelMapper.getRemovedModels());
        } finally {
            Mappers.setFactory(new FluentMapperFactory());
        }
    }

    private static final class RecordingFluentModelMapper extends FluentModelMapper {
        private final Set<String> removedModels = new LinkedHashSet<>();

        @Override
        public void addRemovedModels(Set<String> models) {
            removedModels.addAll(models);
        }

        private Set<String> getRemovedModels() {
            return removedModels;
        }
    }
}
