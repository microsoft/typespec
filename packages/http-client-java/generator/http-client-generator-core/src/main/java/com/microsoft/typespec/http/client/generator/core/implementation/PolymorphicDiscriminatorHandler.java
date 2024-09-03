package com.microsoft.typespec.http.client.generator.core.implementation;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;

import java.util.function.Consumer;
import java.util.function.Function;

/**
 * This class handles generating code for polymorphic discriminators.
 * <p>
 * This class exists to contain all logic for polymorphic discriminators in one location rather that having repetitive
 * logic in multiple places.
 */
public final class PolymorphicDiscriminatorHandler {
  public static void addAnnotationToField(ClientModel model, JavaFile javaFile, JavaSettings settings) {
    if (!model.isPolymorphic() || settings.isStreamStyleSerialization()) {
      return;
    }

    // After removing the concept of passing discriminator to children models and always doing it, there is no need
    // to set the 'include' property of the JsonTypeInfo annotation. We use 'JsonTypeInfo.As.PROPERTY' as the value,
    // which is the default value, so it doesn't need to be declared.
    // And to support unknown subtypes, we always set a default implementation to the class being generated.
    // And the discriminator is passed to child models, so the discriminator property needs to be set to visible.
    String jsonTypeInfo = "JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = \""
      + model.getPolymorphicDiscriminatorName() + "\", defaultImpl = " + model.getName()
      + ".class, visible = true)";

    javaFile.annotation(jsonTypeInfo);
    javaFile.annotation("JsonTypeName(\"" + model.getSerializedName() + "\")");

    if (!model.getDerivedModels().isEmpty()) {
      javaFile.line("@JsonSubTypes({");
      javaFile.indent(() -> {
        Function<ClientModel, String> getDerivedTypeAnnotation = derivedType -> "@JsonSubTypes.Type(name = \""
          + derivedType.getSerializedName() + "\", value = " + derivedType.getName() + ".class)";

        for (int i = 0; i != model.getDerivedModels().size() - 1; i++) {
          ClientModel derivedModel = model.getDerivedModels().get(i);
          javaFile.line(getDerivedTypeAnnotation.apply(derivedModel) + ',');
        }
        javaFile.line(getDerivedTypeAnnotation.apply(model.getDerivedModels()
          .get(model.getDerivedModels().size() - 1)));
      });
      javaFile.line("})");
    }
  }

  public static void declareField(ClientModel model, JavaClass classBlock, Consumer<JavaClass> addGeneratedAnnotation,
                                  Consumer<ClientModelProperty> addFieldAnnotations, JavaSettings settings) {
    if (!model.isPolymorphic()) {
      return;
    }

    for (ClientModelProperty discriminator : model.getParentPolymorphicDiscriminators()) {
      declareFieldInternal(discriminator, model, false, classBlock, addGeneratedAnnotation, addFieldAnnotations,
        settings);
    }

    declareFieldInternal(model.getPolymorphicDiscriminator(), model,
      model.isPolymorphicDiscriminatorDefinedByModel(), classBlock, addGeneratedAnnotation, addFieldAnnotations,
      settings);
  }

  private static void declareFieldInternal(ClientModelProperty discriminator, ClientModel model,
                                           boolean discriminatorDefinedByModel, JavaClass classBlock, Consumer<JavaClass> addGeneratedAnnotation,
                                           Consumer<ClientModelProperty> addFieldAnnotations, JavaSettings settings) {
    boolean allPolymorphicModelsInSamePackage = model.isAllPolymorphicModelsInSamePackage();
    boolean discriminatorUsedInConstructor = ClientModelUtil.includePropertyInConstructor(discriminator, settings);

    String propertyName = discriminator.getName();
    IType propertyType = discriminator.getWireType();
    String discriminatorValue = (discriminator.getDefaultValue() == null)
      ? discriminator.getClientType().defaultValueExpression(model.getSerializedName())
      : discriminator.getDefaultValue();

    // Only set the property to a default value if the property isn't included in the constructor.
    // There can be cases with polymorphic discriminators where they have both a default value and are
    // required, in which case the default value will be set in the constructor.
    boolean discriminatorFieldIsInitialized = (!discriminatorUsedInConstructor || discriminator.isConstant())
      && (discriminatorValue != null && (!allPolymorphicModelsInSamePackage || !settings.isShareJsonSerializableCode()));
    String fieldSignature =  discriminatorFieldIsInitialized
      ? propertyType + " " + propertyName + " = " + discriminatorValue
      : propertyType + " " + propertyName;

    boolean generateCommentAndAnnotations = discriminatorUsedInConstructor
      || (allPolymorphicModelsInSamePackage && discriminatorDefinedByModel && settings.isShareJsonSerializableCode())
      || (!allPolymorphicModelsInSamePackage || !settings.isShareJsonSerializableCode());

    if (generateCommentAndAnnotations) {
      classBlock.blockComment(comment -> comment.line(discriminator.getDescription()));
      addGeneratedAnnotation.accept(classBlock);
      addFieldAnnotations.accept(discriminator);
    }

    if (discriminatorUsedInConstructor) {
      classBlock.privateFinalMemberVariable(fieldSignature);
    } else {
      // If the model defines the discriminator and all models in the polymorphic hierarchy are in the same
      // package, make it package-private to allow derived models to access it.
      if (allPolymorphicModelsInSamePackage && discriminatorDefinedByModel && settings.isShareJsonSerializableCode()) {
        classBlock.memberVariable(JavaVisibility.PackagePrivate, fieldSignature);
      } else if (!allPolymorphicModelsInSamePackage || !settings.isShareJsonSerializableCode()) {
        classBlock.privateMemberVariable(fieldSignature);
      }
    }
  }

  public static void initializeInConstructor(ClientModel model, JavaBlock constructor, JavaSettings settings) {
    if (!model.isPolymorphic()) {
      return;
    }

    // Polymorphic models are contained in different packages, so the discriminator value was set in the field
    // declaration.
    if (!model.isAllPolymorphicModelsInSamePackage() || !settings.isShareJsonSerializableCode()) {
      return;
    }

    for (ClientModelProperty discriminator : model.getParentPolymorphicDiscriminators()) {
      initializeInConstructorInternal(discriminator, model, constructor, settings);
    }

    initializeInConstructorInternal(model.getPolymorphicDiscriminator(), model, constructor, settings);
  }

  private static void initializeInConstructorInternal(ClientModelProperty discriminator, ClientModel model,
                                                      JavaBlock constructor, JavaSettings settings) {
    // When the polymorphic discriminator is used in the constructor it will be initialized by the constructor.
    if (ClientModelUtil.includePropertyInConstructor(discriminator, settings)) {
      return;
    }

    String discriminatorValue = (discriminator.getDefaultValue() == null)
      ? discriminator.getClientType().defaultValueExpression(model.getSerializedName())
      : discriminator.getDefaultValue();
    constructor.line("this." + discriminator.getName() + " = " + discriminatorValue + ";");
  }

  /**
   * Determines whether a getter method should be generated for the discriminator property.
   *
   * @return Whether a getter method should be generated for the discriminator property.
   */
  public static boolean generateGetter(ClientModel model, ClientModelProperty discriminator, JavaSettings settings) {
    // If all the polymorphic models aren't in the same package the getter for the discriminator value will be
    // generated for each model as each model defines properties for all discriminators.
    if (!model.isAllPolymorphicModelsInSamePackage() || !settings.isShareJsonSerializableCode()) {
      return true;
    }

    // If all polymorphic models are in the same package, only the declaring model needs to generate the getter.
    return ClientModelUtil.modelDefinesProperty(model, discriminator);
  }
}
