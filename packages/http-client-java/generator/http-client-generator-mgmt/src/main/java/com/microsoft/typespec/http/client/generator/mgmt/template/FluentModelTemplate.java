// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelPropertyReference;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.template.ModelTemplate;
import com.microsoft.typespec.http.client.generator.core.util.ModelNamer;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class FluentModelTemplate extends ModelTemplate {

    private static final FluentModelTemplate INSTANCE = new FluentModelTemplate();

    private static ModelNamer modelNamer;

    protected FluentModelTemplate() {
    }

    public static FluentModelTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void addSerializationImports(Set<String> imports, ClientModel model, JavaSettings settings) {
        super.addSerializationImports(imports, model, settings);

        imports.add("com.fasterxml.jackson.annotation.JsonInclude");
    }

    @Override
    protected void addFieldAnnotations(ClientModel model, ClientModelProperty property, JavaClass classBlock, JavaSettings settings) {
        super.addFieldAnnotations(model, property, classBlock, settings);

        // JsonInclude
        if (!property.isAdditionalProperties()) {
            String propertyName = model.getName() + "." + property.getName();
            Set<String> propertiesAllowNull = FluentStatic.getFluentJavaSettings().getJavaNamesForPropertyIncludeAlways();
            final boolean propertyAllowNull = propertiesAllowNull.contains(propertyName);

            if (property.getClientType() instanceof MapType) {
                String value = propertyAllowNull ? "JsonInclude.Include.ALWAYS" : "JsonInclude.Include.NON_NULL";
                classBlock.annotation(String.format("JsonInclude(value = %1$s, content = JsonInclude.Include.ALWAYS)", value));
            } else {
                if (propertyAllowNull) {
                    classBlock.annotation("JsonInclude(value = JsonInclude.Include.ALWAYS)");
                }
            }
        }
    }

    @Override
    protected boolean parentModelHasValidate(String parentModelName) {
        return parentModelName != null
            && FluentType.nonResourceType(parentModelName)
            && FluentType.nonManagementError(parentModelName);
    }

    @Override
    protected String getGetterName(ClientModel model, ClientModelProperty property) {
        if (FluentType.MANAGEMENT_ERROR.getName().equals(model.getParentModelName())) {
            // subclass of ManagementError

            if (modelNamer == null) {
                modelNamer = new ModelNamer();
            }
            return modelNamer.modelPropertyGetterName(property);

            // disabled for now, as e.g. https://github.com/Azure/azure-rest-api-specs/blob/8fa9b5051129dd4808c9be1f5b753af226b044db/specification/iothub/resource-manager/Microsoft.Devices/stable/2023-06-30/iothub.json#L298-L303 makes it usage=output
//            if (model.getImplementationDetails() != null
//                    && model.getImplementationDetails().isException()
//                    && !model.getImplementationDetails().isOutput()
//                    && !model.getImplementationDetails().isInput()) {
//                // model used in Exception, also not in any non-Exception input or output
//
//                if (modelNamer == null) {
//                    modelNamer = new ModelNamer();
//                }
//                return modelNamer.modelPropertyGetterName(property);
//            } else {
//                return super.getGetterName(model, property);
//            }
        } else {
            return super.getGetterName(model, property);
        }
    }

    @Override
    protected List<ClientModelPropertyReference> getClientModelPropertyReferences(ClientModel model) {
        List<ClientModelPropertyReference> propertyReferences = new ArrayList<>();

        String lastParentName = model.getName();
        String parentModelName = model.getParentModelName();
        while (parentModelName != null && !lastParentName.equals(parentModelName)) {
            ClientModel parentModel = FluentUtils.getClientModel(parentModelName);
            if (parentModel != null) {
                if (parentModel.getProperties() != null) {
                    propertyReferences.addAll(parentModel.getProperties().stream()
                        .filter(p -> !p.getClientFlatten() && !p.isAdditionalProperties())
                        .map(ClientModelPropertyReference::ofParentProperty)
                        .collect(Collectors.toList()));
                }

                if (parentModel.getPropertyReferences() != null) {
                    propertyReferences.addAll(parentModel.getPropertyReferences().stream()
                        .filter(ClientModelPropertyReference::isFromFlattenedProperty)
                        .map(ClientModelPropertyReference::ofParentProperty)
                        .collect(Collectors.toList()));
                }
            }

            lastParentName = parentModelName;
            parentModelName = parentModel == null ? null : parentModel.getParentModelName();
        }

        return propertyReferences;
    }

    @Override
    protected void addGeneratedImport(Set<String> imports) {
    }

    @Override
    protected void addGeneratedAnnotation(JavaContext classBlock) {
    }
}
