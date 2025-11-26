// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.implementation.ClientModelPropertiesManager;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelPropertyReference;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.template.StreamSerializationModelTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.ErrorClientModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import io.clientcore.core.utils.CoreUtils;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;

public class FluentStreamStyleSerializationModelTemplate extends StreamSerializationModelTemplate {
    private static final FluentModelTemplate FLUENT_MODEL_TEMPLATE = FluentModelTemplate.getInstance();

    public static FluentStreamStyleSerializationModelTemplate getInstance() {
        return new FluentStreamStyleSerializationModelTemplate();
    }

    @Override
    protected String getGetterName(ClientModel model, ClientModelProperty property) {
        return FLUENT_MODEL_TEMPLATE.getGetterName(model, property);
    }

    @Override
    protected boolean modelHasValidate(String modelName) {
        return FLUENT_MODEL_TEMPLATE.modelHasValidate(modelName);
    }

    @Override
    protected boolean isManagementErrorSubclass(ClientModel model) {
        if (CoreUtils.isNullOrEmpty(model.getParentModelName())) {
            return false;
        }
        boolean manageErrorParent = false;
        String parentModelName = model.getParentModelName();
        while (parentModelName != null) {
            ClientModel parentModel = FluentUtils.getClientModel(parentModelName);
            if (parentModel == ErrorClientModel.MANAGEMENT_ERROR) {
                manageErrorParent = true;
                break;
            }
            parentModelName = parentModel.getParentModelName();
        }
        return manageErrorParent;
    }

    @Override
    protected List<ClientModelPropertyReference> getClientModelPropertyReferences(ClientModel model) {
        return FLUENT_MODEL_TEMPLATE.getClientModelPropertyReferences(model);
    }

    @Override
    protected void addGeneratedImport(Set<String> imports) {
    }

    @Override
    protected void addGeneratedAnnotation(JavaContext classBlock) {
    }

    @Override
    protected void writeStreamStyleSerialization(JavaClass classBlock, ClientModelPropertiesManager propertiesManager) {
        // Early out as strongly-typed headers do their own thing.
        if (propertiesManager.getModel().isStronglyTypedHeader()) {
            return;
        }

        new FluentStreamSerializationGenerator(propertiesManager, this::isManagementErrorSubclass)
            .writeStreamStyleSerialization(classBlock);
    }

    private static class FluentStreamSerializationGenerator extends StreamSerializationGenerator {

        private FluentStreamSerializationGenerator(ClientModelPropertiesManager propertiesManager,
            Predicate<ClientModel> isManagementErrorSubclass) {
            super(propertiesManager, isManagementErrorSubclass);
        }

        @Override
        protected void writeSerializeJsonPropertyViaFieldSerializationMethod(JavaBlock methodBlock,
            ClientModelProperty property, ClientModel model, String serializedName, String fieldSerializationMethod,
            boolean fromSuperType) {

            IType clientType = property.getClientType();
            IType wireType = property.getWireType();

            String propertyName = model.getName() + "." + property.getName();
            Set<String> propertiesAllowNull
                = FluentStatic.getFluentJavaSettings().getJavaNamesForPropertyIncludeAlways();
            final boolean propertyAllowNull = propertiesAllowNull.contains(propertyName);

            if (fromSuperType && clientType != wireType && clientType.isNullable()) {
                // If the property is from a super type and the client type is different from the wire type then a
                // null check is required to prevent a NullPointerException when converting the value.
                if (propertyAllowNull) {
                    writeNullableField(methodBlock, property, serializedName, fieldSerializationMethod);
                } else {
                    methodBlock.ifBlock(property.getGetterName() + "() != null",
                        ifAction -> ifAction.line(fieldSerializationMethod + ";"));
                }
            } else {
                if (propertyAllowNull) {
                    writeNullableField(methodBlock, property, serializedName, fieldSerializationMethod);
                } else {
                    methodBlock.line(fieldSerializationMethod + ";");
                }
            }
        }

        private static void writeNullableField(JavaBlock methodBlock, ClientModelProperty property,
            String serializedName, String fieldSerializationMethod) {
            methodBlock
                .ifBlock(property.getGetterName() + "() != null",
                    ifAction -> ifAction.line(fieldSerializationMethod + ";"))
                .elseBlock(elseAction -> elseAction.line("jsonWriter.writeNullField(\"" + serializedName + "\");"));
        }
    }
}
