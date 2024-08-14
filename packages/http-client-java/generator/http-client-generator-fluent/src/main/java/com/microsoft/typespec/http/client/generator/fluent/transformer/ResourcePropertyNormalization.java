// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent.transformer;

import com.azure.autorest.extension.base.model.codemodel.ArraySchema;
import com.azure.autorest.extension.base.model.codemodel.CodeModel;
import com.azure.autorest.extension.base.model.codemodel.DictionarySchema;
import com.azure.autorest.extension.base.model.codemodel.ObjectSchema;
import com.azure.autorest.extension.base.model.codemodel.Parameter;
import com.azure.autorest.extension.base.model.codemodel.Property;
import com.azure.autorest.extension.base.model.codemodel.Schema;
import com.azure.autorest.extension.base.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.fluent.model.FluentType;
import com.microsoft.typespec.http.client.generator.fluent.model.ResourceTypeName;
import com.microsoft.typespec.http.client.generator.fluent.util.Utils;
import com.microsoft.typespec.http.client.generator.fluentnamer.FluentNamer;
import org.slf4j.Logger;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Normalizes resource properties as SubResource.
 */
public class ResourcePropertyNormalization {

    private static final Logger LOGGER = new PluginLogger(FluentNamer.getPluginInstance(), ResourcePropertyNormalization.class);

    public CodeModel process(CodeModel codeModel) {
        // Heuristic, only consider type used in request parameter.
        // Better to compare with sample request.
        Set<ObjectSchema> typesUsedInRequestParameters = codeModel.getOperationGroups().stream()
                .flatMap(og -> og.getOperations().stream())
                .flatMap(o -> o.getRequests().stream())
                .flatMap(r -> r.getParameters().stream())
                .filter(Parameter::isRequired)
                .filter(Utils::nonFlattenedParameter)
                .map(Parameter::getSchema)
                .filter(s -> s instanceof ObjectSchema)
                .map(s -> (ObjectSchema) s)
                .collect(Collectors.toSet());
        // And its 1st level properties.
        typesUsedInRequestParameters.addAll(typesUsedInRequestParameters.stream()
                .flatMap(s -> s.getProperties().stream())
                .map(Property::getSchema)
                .filter(s -> s instanceof ObjectSchema)
                .map(s -> (ObjectSchema) s)
                .collect(Collectors.toSet())
        );

        codeModel.getSchemas().getObjects().stream()
                .filter(FluentType::nonResourceType)
                .filter(typesUsedInRequestParameters::contains)
                .forEach(compositeType -> {
                    List<Property> candidateProperties = compositeType.getProperties().stream()
                            .filter(p -> !p.isReadOnly())
                            .collect(Collectors.toList());

                    candidateProperties.forEach(p -> {
                        Schema type = p.getSchema();
                        if (type instanceof ObjectSchema) {
                            ObjectSchema candidateType = (ObjectSchema) type;
                            if (checkOnParentConvertToSubResource(candidateType)) {
                                p.setSchema(ResourceTypeNormalization.subResourceSchema());
                                LOGGER.info("SubResource for property '{}.{}'", Utils.getJavaName(compositeType), p.getSerializedName());
                            }
                        } else if (type instanceof ArraySchema && ((ArraySchema) type).getElementType() instanceof ObjectSchema) {
                            ArraySchema arrayType = ((ArraySchema) type);
                            ObjectSchema candidateType = (ObjectSchema) (arrayType.getElementType());
                            if (checkConvertToSubResource(candidateType)) {
                                arrayType.setElementType(ResourceTypeNormalization.subResourceSchema());
                                LOGGER.info("Array of SubResource for property '{}.{}'", Utils.getJavaName(compositeType), p.getSerializedName());
                            }
                        } else if (type instanceof DictionarySchema && ((DictionarySchema) type).getElementType() instanceof ObjectSchema) {
                            DictionarySchema dictType = ((DictionarySchema) type);
                            ObjectSchema candidateType = (ObjectSchema) (dictType.getElementType());
                            if (checkConvertToSubResource(candidateType)) {
                                dictType.setElementType(ResourceTypeNormalization.subResourceSchema());
                                LOGGER.info("Dictionary of SubResource for property '{}.{}'", Utils.getJavaName(compositeType), p.getSerializedName());
                            }
                        }
                    });
                });

        return codeModel;
    }

    private static boolean checkOnParentConvertToSubResource(ObjectSchema candidateType) {
        boolean convert = false;
        if (candidateType != null && candidateType.getParents() != null) {
            Schema parentType = candidateType.getParents().getImmediate().get(0);
            if (parentType instanceof ObjectSchema && !FluentType.nonResourceType((ObjectSchema) parentType)) {
                convert = true;
            }
        }
        return convert;
    }

    private static boolean checkConvertToSubResource(ObjectSchema candidateType) {
        boolean convert = false;
        if (candidateType != null && !FluentType.nonResourceType(candidateType) && !ResourceTypeName.SUB_RESOURCE.equals(Utils.getJavaName(candidateType))) {
            convert = true;
        }
        return convert;
    }
}
