// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.implementation;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.azure.core.util.CoreUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.xml.XmlReader;
import com.azure.xml.XmlSerializable;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Consumer;

import static com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil.getClientModel;

/**
 * Manages metadata about properties in a {@link ClientModel} and how they correlate with model class generation.
 * <p>
 * This will bucket all properties, and super type properties, into the buckets of required, optional, and additional
 * properties. In addition to bucketing, each property will be checked if it requires flattening and be used to generate
 * the flattened properties structure for the model.
 * <p>
 * This will also handle getting the discriminator property and the expected value for the field.
 */
public final class ClientModelPropertiesManager {
  private final ClientModel model;
  private final JavaSettings settings;

  private final String deserializedModelName;
  private final boolean hasRequiredProperties;
  private final boolean hasConstructorArguments;
  private final int requiredPropertiesCount;
  private final int setterPropertiesCount;
  private final int readOnlyPropertiesCount;
  private final LinkedHashMap<String, ClientModelProperty> superConstructorProperties;
  private final LinkedHashMap<String, ClientModelProperty> superRequiredProperties;
  private final LinkedHashMap<String, ClientModelProperty> superSetterProperties;
  private final LinkedHashMap<String, ClientModelProperty> superReadOnlyProperties;
  private final ClientModelProperty superAdditionalPropertiesProperty;
  private final LinkedHashMap<String, ClientModelProperty> constructorProperties;
  private final LinkedHashMap<String, ClientModelProperty> requiredProperties;
  private final LinkedHashMap<String, ClientModelProperty> setterProperties;
  private final LinkedHashMap<String, ClientModelProperty> readOnlyProperties;
  private final ClientModelProperty additionalProperties;
  private final ClientModelPropertyWithMetadata discriminatorProperty;
  private final String expectedDiscriminator;
  private final JsonFlattenedPropertiesTree jsonFlattenedPropertiesTree;
  private final boolean allFlattenedPropertiesFromParent;
  private final String jsonReaderFieldNameVariableName;

  private final String xmlRootElementName;
  private final String xmlRootElementNamespace;
  private final boolean hasXmlElements;
  private final boolean hasXmlTexts;
  private final String xmlReaderNameVariableName;
  private final List<ClientModelProperty> superXmlAttributes;
  private final List<ClientModelProperty> xmlAttributes;
  private final List<ClientModelProperty> superXmlTexts;
  private final List<ClientModelProperty> xmlTexts;
  private final List<ClientModelProperty> superXmlElements;
  private final List<ClientModelProperty> xmlElements;
  private final Map<String, String> xmlNamespaceWithPrefix;
  private final Map<String, String> xmlNamespaceToConstantMapping;

  /**
   * Creates a new instance of {@link ClientModelPropertiesManager}.
   *
   * @param model The {@link ClientModel}.
   */
  public ClientModelPropertiesManager(ClientModel model, JavaSettings settings) {
    // The reader name variable needs to be mutable as it may match a property name in the class.
    Set<String> possibleReaderFieldNameVariableNames = new LinkedHashSet<>(Arrays.asList(
      "fieldName", "jsonFieldName", "deserializationFieldName"));
    Set<String> possibleXmlNameVariableNames = new LinkedHashSet<>(Arrays.asList(
      "elementName", "xmlElementName", "deserializationElementName"));
    this.model = model;
    this.settings = settings;

    this.deserializedModelName = "deserialized" + model.getName();
    this.expectedDiscriminator = model.getSerializedName();
    ClientModelPropertyWithMetadata discriminatorProperty = null;

    Map<String, ClientModelPropertyWithMetadata> flattenedProperties = new LinkedHashMap<>();
    boolean hasRequiredProperties = false;
    boolean hasConstructorArguments = false;
    superConstructorProperties = new LinkedHashMap<>();
    superRequiredProperties = new LinkedHashMap<>();
    superSetterProperties = new LinkedHashMap<>();
    superReadOnlyProperties = new LinkedHashMap<>();
    ClientModelProperty superAdditionalProperties = null;
    boolean hasXmlElements = false;
    boolean hasXmlTexts = false;
    xmlNamespaceWithPrefix = new LinkedHashMap<>();
    superXmlAttributes = new ArrayList<>();
    xmlAttributes = new ArrayList<>();
    superXmlTexts = new ArrayList<>();
    xmlTexts = new ArrayList<>();
    superXmlElements = new ArrayList<>();
    xmlElements = new ArrayList<>();
    boolean allFlattenedPropertiesFromParent = true;

    if (model.isPolymorphic()) {
      ClientModel superTypeModel = model;
      ClientModel parentModel = getClientModel(model.getParentModelName());
      while (parentModel != null) {
        superTypeModel = parentModel;
        parentModel = getClientModel(superTypeModel.getParentModelName());
      }

      xmlRootElementName = superTypeModel.getXmlName();
      xmlRootElementNamespace = superTypeModel.getXmlNamespace();
    } else {
      xmlRootElementName = model.getXmlName();
      xmlRootElementNamespace = model.getXmlNamespace();
    }

    for (ClientModelProperty property : ClientModelUtil.getParentProperties(model)) {
      // Ignore additional properties from parent types as it will be handled specifically in the subtype.
      if (property.isAdditionalProperties()) {
        superAdditionalProperties = property;
        continue;
      }

      if (property.isPolymorphicDiscriminator()) {
        discriminatorProperty = new ClientModelPropertyWithMetadata(model, property, true);
      }

      if (!property.isPolymorphicDiscriminator()) {
        superPropertyConsumer(property, superRequiredProperties, superConstructorProperties,
          superReadOnlyProperties, superSetterProperties, settings);
        hasRequiredProperties |= property.isRequired();
        hasConstructorArguments |= ClientModelUtil.includePropertyInConstructor(property, settings);
      }

      if (property.getNeedsFlatten()) {
        flattenedProperties.put(property.getName(), new ClientModelPropertyWithMetadata(model, property, true));
      }

      possibleReaderFieldNameVariableNames.remove(property.getName());
      possibleXmlNameVariableNames.remove(property.getName());

      if (property.isXmlAttribute()) {
        if (!property.isPolymorphicDiscriminator()) {
          superXmlAttributes.add(property);
        }
      } else if (property.isXmlText()) {
        hasXmlTexts = true;
        superXmlTexts.add(property);
      } else {
        hasXmlElements = true;
        superXmlElements.add(property);
      }

      if (!CoreUtils.isNullOrEmpty(property.getXmlPrefix())) {
        xmlNamespaceWithPrefix.put(property.getXmlPrefix(), property.getXmlNamespace());
      }
    }

    this.superAdditionalPropertiesProperty = superAdditionalProperties;

    constructorProperties = new LinkedHashMap<>();
    requiredProperties = new LinkedHashMap<>();
    setterProperties = new LinkedHashMap<>();
    readOnlyProperties = new LinkedHashMap<>();
    ClientModelProperty additionalProperties = null;
    for (ClientModelProperty property : model.getProperties()) {
      if (property.isRequired()) {
        hasRequiredProperties = true;
        requiredProperties.put(property.getSerializedName(), property);

        if (!property.isConstant()) {
          if (ClientModelUtil.includePropertyInConstructor(property, settings)) {
            constructorProperties.put(property.getSerializedName(), property);
            hasConstructorArguments = true;
          } else {
            readOnlyProperties.put(property.getSerializedName(), property);
          }
        }
      } else if (property.isAdditionalProperties()) {
        // Extract the additionalProperties property as this will need to be passed into all deserialization
        // logic creation calls.
        additionalProperties = property;
      } else {
        setterProperties.put(property.getSerializedName(), property);
      }

      if (property.isPolymorphicDiscriminator()) {
        if (discriminatorProperty == null) {
          discriminatorProperty = new ClientModelPropertyWithMetadata(model, property, false);
        } else if (Objects.equals(discriminatorProperty.getProperty().getSerializedName(), property.getSerializedName())) {
          discriminatorProperty = new ClientModelPropertyWithMetadata(model, property, true);
        } else {
          discriminatorProperty = new ClientModelPropertyWithMetadata(model, property, false);
        }
      }

      if (property.getNeedsFlatten()) {
        flattenedProperties.put(property.getName(), new ClientModelPropertyWithMetadata(model, property, false));
        allFlattenedPropertiesFromParent = false;
      }

      possibleReaderFieldNameVariableNames.remove(property.getName());
      possibleXmlNameVariableNames.remove(property.getName());

      if (property.isXmlAttribute()) {
        if (!property.isPolymorphicDiscriminator()) {
          xmlAttributes.add(property);
        }
      } else if (property.isXmlText()) {
        hasXmlTexts = true;
        xmlTexts.add(property);
      } else {
        hasXmlElements = true;
        xmlElements.add(property);
      }

      if (!CoreUtils.isNullOrEmpty(property.getXmlPrefix())) {
        xmlNamespaceWithPrefix.put(property.getXmlPrefix(), property.getXmlNamespace());
      }
    }

    // Temporary fix to a larger problem where the discriminator property is defined by a parent model, but not as
    // a discriminator. This results in the discriminator property being serialized and deserialized twice as it
    // shows up once as a regular property and once as a discriminator property. This will remove the regular
    // property from the super properties and indicate that the discriminator came from a parent model.
    if (discriminatorProperty != null) {
      String serializedDiscriminatorName = discriminatorProperty.getProperty().getSerializedName();
      ClientModelProperty removed;
      if ((removed = superRequiredProperties.remove(serializedDiscriminatorName)) != null) {
        discriminatorProperty = new ClientModelPropertyWithMetadata(model, removed.newBuilder()
          .defaultValue(discriminatorProperty.getProperty().getDefaultValue()).build(),
          true);
      } else if ((removed = superSetterProperties.remove(serializedDiscriminatorName)) != null) {
        discriminatorProperty = new ClientModelPropertyWithMetadata(model, removed.newBuilder()
          .defaultValue(discriminatorProperty.getProperty().getDefaultValue()).build(),
          true);
      }
    }

    this.hasRequiredProperties = hasRequiredProperties;
    this.requiredPropertiesCount = requiredProperties.size() + superRequiredProperties.size();
    this.setterPropertiesCount = setterProperties.size() + superSetterProperties.size();
    this.readOnlyPropertiesCount = readOnlyProperties.size() + superReadOnlyProperties.size();
    this.hasConstructorArguments = hasConstructorArguments;
    this.hasXmlElements = hasXmlElements;
    this.hasXmlTexts = hasXmlTexts;
    this.discriminatorProperty = discriminatorProperty;
    this.additionalProperties = additionalProperties;
    this.jsonFlattenedPropertiesTree = getFlattenedPropertiesHierarchy(model.getPolymorphicDiscriminatorName(),
      flattenedProperties);
    this.allFlattenedPropertiesFromParent = allFlattenedPropertiesFromParent;
    Iterator<String> possibleReaderFieldNameVariableNamesIterator = possibleReaderFieldNameVariableNames.iterator();
    if (possibleReaderFieldNameVariableNamesIterator.hasNext()) {
      this.jsonReaderFieldNameVariableName = possibleReaderFieldNameVariableNamesIterator.next();
    } else {
      throw new IllegalStateException("Model properties exhausted all possible JsonReader field name variables. "
        + "Add additional possible JsonReader field name variables to resolve this issue.");
    }

    Iterator<String> possibleXmlNameVariableNamesIterator = possibleXmlNameVariableNames.iterator();
    if (possibleXmlNameVariableNamesIterator.hasNext()) {
      this.xmlReaderNameVariableName = possibleXmlNameVariableNamesIterator.next();
    } else {
      throw new IllegalStateException("Model properties exhausted all possible XmlReader name variables. "
        + "Add additional possible XmlReader name variables to resolve this issue.");
    }

    this.xmlNamespaceToConstantMapping = model.getXmlName() == null
      ? Collections.emptyMap() : ClientModelUtil.xmlNamespaceToConstantMapping(model);
  }

  private static void superPropertyConsumer(ClientModelProperty property,
                                            Map<String, ClientModelProperty> superRequiredProperties,
                                            Map<String, ClientModelProperty> superConstructorProperties,
                                            Map<String, ClientModelProperty> superReadOnlyProperties,
                                            Map<String, ClientModelProperty> superSetterProperties, JavaSettings settings) {
    if (property.isRequired()) {
      superRequiredProperties.put(property.getSerializedName(), property);

      if (!property.isConstant()) {
        if (ClientModelUtil.includePropertyInConstructor(property, settings)) {
          superConstructorProperties.put(property.getSerializedName(), property);
        } else {
          superReadOnlyProperties.put(property.getSerializedName(), property);
        }
      }
    } else {
      superSetterProperties.put(property.getSerializedName(), property);
    }
  }

  /**
   * Gets the {@link ClientModel} that the properties are based on.
   *
   * @return The {@link ClientModel} that the properties are based on.
   */
  public ClientModel getModel() {
    return model;
  }

  /**
   * The {@link JavaSettings} being used to determine code generation.
   *
   * @return The {@link JavaSettings} being used to determine code generation.
   */
  public JavaSettings getSettings() {
    return settings;
  }

  /**
   * Gets the name of the variable used when deserializing an instance of the {@link #getModel() model}.
   *
   * @return The name of the variable used during deserialization.
   */
  public String getDeserializedModelName() {
    return deserializedModelName;
  }

  /**
   * Whether the {@link #getModel() model} contains required properties, either directly or through super classes.
   *
   * @return Whether the {@link #getModel() model} contains required properties.
   */
  public boolean hasRequiredProperties() {
    return hasRequiredProperties;
  }

  /**
   * Gets the number of required properties in the {@link #getModel() model}.
   *
   * @return The number of required properties in the {@link #getModel() model}.
   */
  public int getRequiredPropertiesCount() {
    return requiredPropertiesCount;
  }

  /**
   * Gets the number of setter properties in the {@link #getModel() model}.
   *
   * @return The number of setter properties in the {@link #getModel() model}.
   */
  public int getSetterPropertiesCount() {
    return setterPropertiesCount;
  }

  /**
   * Gets the number of read-only properties in the {@link #getModel() model}.
   *
   * @return The number of read-only properties in the {@link #getModel() model}.
   */
  public int getReadOnlyPropertiesCount() {
    return readOnlyPropertiesCount;
  }

  /**
   * Whether the {@link #getModel() model} has constructor arguments, either directly or required through super
   * classes.
   *
   * @return Whether the {@link #getModel() model} contains constructor arguments.
   */
  public boolean hasConstructorArguments() {
    return hasConstructorArguments;
  }

  /**
   * Consumes each constructor {@link ClientModelProperty property} defined by super classes of the
   * {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachSuperConstructorProperty(Consumer<ClientModelProperty> consumer) {
    superConstructorProperties.values().forEach(consumer);
  }

  /**
   * Consumes each required {@link ClientModelProperty property} defined by super classes of the
   * {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachSuperRequiredProperty(Consumer<ClientModelProperty> consumer) {
    superRequiredProperties.values().forEach(consumer);
  }

  /**
   * Consumes each non-required {@link ClientModelProperty property} defined by super classes of the
   * {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachSuperSetterProperty(Consumer<ClientModelProperty> consumer) {
    superSetterProperties.values().forEach(consumer);
  }

  /**
   * Consumes each read-only {@link ClientModelProperty property} defined by super classes of the
   * {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachSuperReadOnlyProperty(Consumer<ClientModelProperty> consumer) {
    superReadOnlyProperties.values().forEach(consumer);
  }

  /**
   * Consumes each constructor {@link ClientModelProperty property} defined by the {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachConstructorProperty(Consumer<ClientModelProperty> consumer) {
    constructorProperties.values().forEach(consumer);
  }

  /**
   * Consumes each required {@link ClientModelProperty property} defined by the {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachRequiredProperty(Consumer<ClientModelProperty> consumer) {
    requiredProperties.values().forEach(consumer);
  }

  /**
   * Consumes each non-required {@link ClientModelProperty property} defined by the {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachSetterProperty(Consumer<ClientModelProperty> consumer) {
    setterProperties.values().forEach(consumer);
  }

  /**
   * Consumes each read-only {@link ClientModelProperty property} defined by the {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachReadOnlyProperty(Consumer<ClientModelProperty> consumer) {
    readOnlyProperties.values().forEach(consumer);
  }

  /**
   * Gets the {@link ClientModelProperty} that defines the additional properties property.
   * <p>
   * If the model doesn't contain additional properties this will return null.
   *
   * @return The {@link ClientModelProperty} that defines the additional properties property, or null if the model
   * doesn't define additional properties.
   */
  public ClientModelProperty getAdditionalProperties() {
    return additionalProperties;
  }

  /**
   * Gets the {@link ClientModelProperty} that defines the additional properties property in superclass.
   * <p>
   * If the no superclass contain additional properties, this will return null.
   *
   * @return The {@link ClientModelProperty} that defines the additional properties property in superclass, or null if
   * no superclass defines additional properties.
   */
  public ClientModelProperty getSuperAdditionalPropertiesProperty() {
    return superAdditionalPropertiesProperty;
  }

  /**
   * Gets the {@link ClientModelPropertyWithMetadata} that defines the discriminator property for polymorphic types.
   * <p>
   * If the model isn't polymorphic this will return null.
   *
   * @return The {@link ClientModelPropertyWithMetadata} that defines the discriminator property for polymorphic
   * types, or null if the model isn't a polymorphic type.
   */
  public ClientModelPropertyWithMetadata getDiscriminatorProperty() {
    return discriminatorProperty;
  }

  /**
   * Gets the expected discriminator value for the polymorphic model.
   * <p>
   * If the model isn't polymorphic this will return null.
   *
   * @return The expected discriminator value for the polymorphic model, or null if the model isn't a polymorphic
   * type.
   */
  public String getExpectedDiscriminator() {
    return expectedDiscriminator;
  }

  /**
   * Gets the JSON flattened properties tree for the model.
   * <p>
   * If the model doesn't contain any JSON flattening this will return null.
   *
   * @return The JSON flattened properties tree for the model, or null if the model doesn't contain any JSON
   * flattening.
   */
  public JsonFlattenedPropertiesTree getJsonFlattenedPropertiesTree() {
    return jsonFlattenedPropertiesTree;
  }

  /**
   * Whether all the flattened properties are from parent models.
   *
   * @return Whether all the flattened properties are from parent models.
   */
  public boolean isAllFlattenedPropertiesFromParent() {
    return allFlattenedPropertiesFromParent;
  }

  /**
   * Gets the variable name for {@link JsonReader#getFieldName()} in {@link JsonSerializable#fromJson(JsonReader)}
   * implementations.
   * <p>
   * This is used instead of a static variable name as deserialization maintains holders for required properties which
   * could conflict with the static variable name. The constructor manages determination of the variable name by
   * tracking a set of possible names, if all possible names are exhausted the constructor will throw an exception to
   * indicate more possible names need to be added to support all code generation expectations.
   *
   * @return The variable name that tracks the current JSON field name.
   */
  public String getJsonReaderFieldNameVariableName() {
    return jsonReaderFieldNameVariableName;
  }

  /**
   * Gets the variable name for {@link XmlReader#getElementName()} in {@link XmlSerializable#fromXml(XmlReader)}
   * implementations.
   * <p>
   * This is used instead of a static variable name as deserialization maintains holders for required properties which
   * could conflict with the static variable name. The constructor manages determination of the variable name by
   * tracking a set of possible names, if all possible names are exhausted the constructor will throw an exception to
   * indicate more possible names need to be added to support all code generation expectations.
   *
   * @return The variable name that tracks the current XML name.
   */
  public String getXmlReaderNameVariableName() {
    return xmlReaderNameVariableName;
  }

  /**
   * Gets the default XML root element name for the model.
   * <p>
   * Polymorphism for XML works differently from JSON where the discriminator to determine which type to deserialize
   * is determined by an attribute rather than a special property. This results in the super type and all subtypes
   * using the same root element name determined by the super type.
   *
   * @return The default XML root element name.
   */
  public String getXmlRootElementName() {
    return xmlRootElementName;
  }

  /**
   * Gets the XML root element namespace for the model.
   * <p>
   * Polymorphism for XML has the super type define the XML namespace.
   *
   * @return The XML root element namespace.
   */
  public String getXmlRootElementNamespace() {
    return xmlRootElementNamespace;
  }

  /**
   * Whether the {@link #getModel() model} defines XML elements, XML properties that aren't
   * {@link ClientModelProperty#isXmlAttribute() attributes} or {@link ClientModelProperty#isXmlText() text}.
   *
   * @return Whether the {@link #getModel() model} defines XML elements
   */
  public boolean hasXmlElements() {
    return hasXmlElements;
  }

  /**
   * Whether the {@link #getModel() model} defines XML texts, XML properties that are
   * {@link ClientModelProperty#isXmlText() text}.
   *
   * @return Whether the {@link #getModel() model} defines XML texts
   */
  public boolean hasXmlTexts() {
    return hasXmlTexts;
  }

  /**
   * Consumes each XML namespace that has a prefix.
   *
   * @param consumer XML namespace with prefix consumer.
   */
  public void forEachXmlNamespaceWithPrefix(BiConsumer<String, String> consumer) {
    xmlNamespaceWithPrefix.forEach(consumer);
  }

  /**
   * Consumes each XML attribute {@link ClientModelProperty property} defined by super classes of the
   * {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachSuperXmlAttribute(Consumer<ClientModelProperty> consumer) {
    superXmlAttributes.forEach(consumer);
  }

  /**
   * Consumes each XML attribute {@link ClientModelProperty property} defined by the {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachXmlAttribute(Consumer<ClientModelProperty> consumer) {
    xmlAttributes.forEach(consumer);
  }

  /**
   * Consumes each XML text {@link ClientModelProperty property} defined by super classes of the
   * {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachSuperXmlText(Consumer<ClientModelProperty> consumer) {
    superXmlTexts.forEach(consumer);
  }

  /**
   * Consumes each XML text {@link ClientModelProperty property} defined by the {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachXmlText(Consumer<ClientModelProperty> consumer) {
    xmlTexts.forEach(consumer);
  }

  /**
   * Consumes each XML element {@link ClientModelProperty property} defined by super classes of the
   * {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachSuperXmlElement(Consumer<ClientModelProperty> consumer) {
    superXmlElements.forEach(consumer);
  }

  /**
   * Consumes each XML element {@link ClientModelProperty property} defined by the {@link #getModel() model}.
   *
   * @param consumer The {@link ClientModelProperty} consumer.
   */
  public void forEachXmlElement(Consumer<ClientModelProperty> consumer) {
    xmlElements.forEach(consumer);
  }

  /**
   * Gets the XML namespace constant for the given XML namespace.
   *
   * @param xmlNamespace The XML namespace.
   * @return The XML namespace constant.
   */
  public String getXmlNamespaceConstant(String xmlNamespace) {
    return xmlNamespaceToConstantMapping.get(xmlNamespace);
  }

  /**
   * Takes all properties that will be included in a {@code fromJson(JsonReader)} call and for all properties that are
   * flattened creates a tree representation of their paths.
   * <p>
   * Flattened properties require additional processing as they must be handled at the same time. For example if a
   * model has three flattened properties with JSON paths "im.flattened", "im.deeper.flattened", and
   * "im.deeper.flattenedtoo" this will create the following structure:
   *
   * <pre>
   * im -> flattened
   *     | deeper -> flattened
   *               | flattenedtoo
   * </pre>
   *
   * This structure is then used while generating deserialization logic to ensure that when the "im" JSON sub-object
   * is found that it'll look for both "flattened" and the "deeper" JSON sub-object before either reading or skipping
   * unknown properties. If this isn't done and deserialization logic is generated on a property-by-property basis,
   * this could result in the "im.flattened" check skipping the "deeper" JSON sub-object.
   *
   * @param discriminatorProperty A potential discriminator property for hierarchical models.
   * @param flattenedProperties All flattened properties that are part of a model's deserialization.
   * @return The flattened JSON properties structure, or an empty structure if the model doesn't contained flattened
   * properties.
   */
  private static JsonFlattenedPropertiesTree getFlattenedPropertiesHierarchy(String discriminatorProperty,
                                                                             Map<String, ClientModelPropertyWithMetadata> flattenedProperties) {
    JsonFlattenedPropertiesTree structure = JsonFlattenedPropertiesTree.createBaseNode();

    if (!CoreUtils.isNullOrEmpty(discriminatorProperty)) {
      List<String> propertyHierarchy = ClientModelUtil.splitFlattenedSerializedName(discriminatorProperty);
      if (!propertyHierarchy.isEmpty()) {
        structure = JsonFlattenedPropertiesTree.createBaseNode();
      }
    }

    for (ClientModelPropertyWithMetadata property : flattenedProperties.values()) {
      if (!property.getProperty().getNeedsFlatten()) {
        // Property doesn't need flattening, ignore it.
        continue;
      }

      // Splits the flattened property into the individual properties in the JSON path.
      // For example "im.deeper.flattened" becomes ["im", "deeper", "flattened"].
      List<String> propertyHierarchy = ClientModelUtil.splitFlattenedSerializedName(property.getProperty().getSerializedName());

      if (propertyHierarchy.size() == 1) {
        // Property is marked for flattening but points directly to its JSON path, ignore it.
        continue;
      }

      // Loop over all the property names in the JSON path, either getting or creating that node in the
      // flattened JSON properties structure.
      JsonFlattenedPropertiesTree pointer = structure;
      for (int i = 0; i < propertyHierarchy.size(); i++) {
        String nodeName = propertyHierarchy.get(i);

        // Structure doesn't contain the flattened property.
        if (!pointer.hasChildNode(nodeName)) {
          // Depending on whether this is the last property in the flattened property either a terminal
          // or intermediate node will be inserted.
          JsonFlattenedPropertiesTree newPointer = (i == propertyHierarchy.size() - 1)
            ? JsonFlattenedPropertiesTree.createTerminalNode(nodeName, property)
            : JsonFlattenedPropertiesTree.createIntermediateNode(nodeName);

          pointer.addChildNode(newPointer);
          pointer = newPointer;
        } else {
          pointer = pointer.getChildNode(nodeName);
        }
      }
    }

    return structure;
  }
}
