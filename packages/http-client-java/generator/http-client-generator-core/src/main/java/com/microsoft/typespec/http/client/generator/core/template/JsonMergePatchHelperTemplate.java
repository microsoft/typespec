// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.azure.core.util.CoreUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

public class JsonMergePatchHelperTemplate implements IJavaTemplate<List<ClientModel>, JavaFile>{

    private static final JsonMergePatchHelperTemplate INSTANCE = new JsonMergePatchHelperTemplate();

    protected JsonMergePatchHelperTemplate() {
    }

    public static JsonMergePatchHelperTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(List<ClientModel> models, JavaFile javaFile) {
        // imports
        JavaSettings settings = JavaSettings.getInstance();
        Set<String> imports = new HashSet<>();
        addImports(imports, models, settings);
        javaFile.declareImport(imports);

        // class javadoc
        javaFile.javadocComment(comment ->
            comment.description("This is the Helper class to enable json merge patch serialization for a model"));
        // class code
        javaFile.publicClass(null, ClientModelUtil.JSON_MERGE_PATCH_HELPER_CLASS_NAME,
            javaClass -> createJsonMergePatchAccessHelpers(models, javaClass));
    }

    /**
     * Add imports for JsonMergePatchHelper.
     *
     * @param imports Set of imports to add to.
     * @param models List of models in the service that are used in json-merge-patch.
     * @param settings JavaSettings to use.
     */
    private static void addImports(Set<String> imports, List<ClientModel> models, JavaSettings settings) {
        if (models != null && !models.isEmpty()) {
            models.forEach(model -> model.addImportsTo(imports, settings));
        }
    }

    /**
     * Creates the access helpers for the json-merge-patch models in a service.
     * <p>
     * This will create the accessor property, interface, and method for each model that is used in json-merge-patch.
     * Instead of following standard patterns where all fields are declared together, the field, interface, and static
     * methods for each model are declared together.
     *
     * @param models List of models in the service that are used in json-merge-patch.
     * @param javaClass JavaClass to add accessor properties.
     */
    private static void createJsonMergePatchAccessHelpers(List<ClientModel> models, JavaClass javaClass) {
        if (models == null || models.isEmpty()) {
            return;
        }

        for (ClientModel model : models) {
            if (!model.getImplementationDetails().isInput()) {
                // Model is only used as output and doesn't need to support json-merge-patch.
                continue;
            }

            if (model.isPolymorphic() && CoreUtils.isNullOrEmpty(model.getDerivedModels())) {
                // Only polymorphic parent models generate an accessor.
                // If it is the super most parent model, it will generate the prepareModelForJsonMergePatch method.
                // Other parents need to generate setters for the properties that are used in json-merge-patch, used in
                // deserialization to prevent these properties from always being included in serialization.
                continue;
            }

            List<ClientModelProperty> setterProperties = model.getProperties().stream()
                .filter(property -> !property.isConstant() && !property.isPolymorphicDiscriminator())
                .collect(Collectors.toList());

            if (!CoreUtils.isNullOrEmpty(model.getParentModelName()) && setterProperties.isEmpty()) {
                // Model isn't the root parent and doesn't have any setter properties, no need to generate an accessor.
                continue;
            }

            String modelName = model.getName();
            String camelModelName = CodeNamer.toCamelCase(modelName);

            // Accessor field declaration.
            javaClass.privateMemberVariable("static " + modelName + "Accessor " + camelModelName + "Accessor");

            // Accessor interface declaration.
            javaClass.interfaceBlock(JavaVisibility.Public, modelName + "Accessor", interfaceBlock -> {
                if (CoreUtils.isNullOrEmpty(model.getParentModelName())) {
                    // Only the super most parent model generates the prepareModelForJsonMergePatch method.
                    interfaceBlock.publicMethod(
                        modelName + " prepareModelForJsonMergePatch(" + modelName + " " + camelModelName
                            + ", boolean jsonMergePatchEnabled)");

                    interfaceBlock.publicMethod("boolean isJsonMergePatch("  + modelName + " " + camelModelName + ")");
                }

                if (model.isPolymorphicParent()) {
                    String modelNameParameter = model.getName().substring(0, 1).toLowerCase(Locale.ROOT)
                        + model.getName().substring(1);
                    for (ClientModelProperty property : model.getProperties()) {
                        if (property.isConstant() || property.isPolymorphicDiscriminator()) {
                            // Don't generate setters for constant or discriminator properties.
                            continue;
                        }

                        interfaceBlock.publicMethod("void " + property.getSetterName() + "("
                            + model.getName() + " " + modelNameParameter + ", "
                            + property.getClientType() + " " + property.getName() + ")");
                    }
                }
            });

            // Accessor field setter.
            javaClass.publicStaticMethod("void set" + modelName + "Accessor(" + modelName + "Accessor accessor)",
                methodBlock -> methodBlock.line(camelModelName + "Accessor = accessor;"));

            // Accessor field getter.
            javaClass.publicStaticMethod(modelName + "Accessor get" + modelName + "Accessor()",
                methodBlock -> methodBlock.methodReturn(camelModelName + "Accessor"));
        }
    }
}
