// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.BinaryDataNode;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ClientModelNode;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleNode;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ListNode;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.LiteralNode;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MapNode;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ObjectNode;
import com.azure.core.util.Base64Url;
import com.azure.core.util.CoreUtils;
import com.azure.core.util.DateTimeRfc1123;
import com.azure.core.util.serializer.CollectionFormat;
import org.slf4j.Logger;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class ModelExampleUtil {

  private static final Logger LOGGER = new PluginLogger(Javagen.getPluginInstance(), ModelExampleUtil.class);

  /**
   * Parse the type (client model or others) with JSON object to tree of ExampleNode.
   *
   * @param type the client type, wire type is assumed to be same
   * @param objectValue the JSON object
   * @return the tree of ExampleNode
   */
  public static ExampleNode parseNode(IType type, Object objectValue) {
    return parseNode(type, type, objectValue);
  }

  /**
   * Parse the type (client model or others) with JSON object to tree of ExampleNode.
   *
   * @param type the client type
   * @param wireType the wire type (the related but different type used in JSON, e.g. DateTimeRfc1123 for OffsetDateTime)
   * @param objectValue the JSON object
   * @return the tree of ExampleNode
   */
  @SuppressWarnings("unchecked")
  public static ExampleNode parseNode(IType type, IType wireType, Object objectValue) {
    ExampleNode node;
    if (type instanceof ListType) {
      IType elementType = ((ListType) type).getElementType();
      if (objectValue instanceof List) {
        ListNode listNode = new ListNode(elementType, objectValue);
        node = listNode;

        List<Object> elements = (List<Object>) objectValue;
        for (Object childObjectValue : elements) {
          ExampleNode childNode = parseNode(elementType, childObjectValue);
          node.getChildNodes().add(childNode);
        }
      } else {
        LOGGER.error("Example value is not List type: {}", objectValue);
        node = new ListNode(elementType, null);
      }
    } else if (type instanceof MapType) {
      IType elementType = ((MapType) type).getValueType();
      if (objectValue instanceof Map) {
        MapNode mapNode = new MapNode(elementType, objectValue);
        node = mapNode;

        Map<String, Object> dict = (Map<String, Object>) objectValue;
        for (Map.Entry<String, Object> entry : dict.entrySet()) {
          Object value = entry.getValue();

          // redact possible credential
          if (elementType == ClassType.STRING && entry.getValue() instanceof String) {
            value = ModelTestCaseUtil.redactStringValue(Collections.singletonList(entry.getKey()), (String) value);
          }

          ExampleNode childNode = parseNode(elementType, value);
          node.getChildNodes().add(childNode);
          mapNode.getKeys().add(entry.getKey());
        }
      } else {
        LOGGER.error("Example value is not Map type: {}", objectValue);
        node = new MapNode(elementType, null);
      }
    } else if (type == ClassType.OBJECT) {
      node = new ObjectNode(type, objectValue);
    } else if (type == ClassType.BINARY_DATA && objectValue != null) {
      node = new BinaryDataNode(type, objectValue);
    } else if (type instanceof ClassType && objectValue instanceof Map) {
      ClientModel model = ClientModelUtil.getClientModel(((ClassType) type).getName());
      if (model != null) {
        if (model.isPolymorphic()) {
          // polymorphic, need to get the correct subclass from discriminator
          String serializedName = model.getPolymorphicDiscriminatorName();
          List<String> jsonPropertyNames = Collections.singletonList(serializedName);
          if (model.getNeedsFlatten()) {
            jsonPropertyNames = ClientModelUtil.splitFlattenedSerializedName(serializedName);
          }

          Object childObjectValue = getChildObjectValue(jsonPropertyNames, objectValue);
          if (childObjectValue instanceof String) {
            String discriminatorValue = (String) childObjectValue;
            ClientModel derivedModel = getDerivedModel(model, discriminatorValue);
            if (derivedModel != null) {
              // use the subclass
              type = derivedModel.getType();
              model = derivedModel;
            } else {
              LOGGER.warn("Failed to find the subclass with discriminator value '{}'", discriminatorValue);
            }
          } else {
            LOGGER.warn("Failed to find the sample value for discriminator property '{}'", serializedName);
          }
        }

        ClientModelNode clientModelNode = new ClientModelNode(type, objectValue).setClientModel(model);
        node = clientModelNode;

        List<ModelProperty> modelProperties = getWritablePropertiesIncludeSuperclass(model);
        for (ModelProperty modelProperty : modelProperties) {
          List<String> jsonPropertyNames = modelProperty.getSerializedNames();

          Object childObjectValue = getChildObjectValue(jsonPropertyNames, objectValue);
          if (childObjectValue != null) {
            ExampleNode childNode = parseNode(modelProperty.getClientType(), modelProperty.getWireType(), childObjectValue);
            node.getChildNodes().add(childNode);
            clientModelNode.getClientModelProperties().put(childNode, modelProperty);

            // redact possible credential
            if (childNode instanceof LiteralNode && childObjectValue instanceof String) {
              LiteralNode literalChildNode = (LiteralNode) childNode;
              if (literalChildNode.getClientType() == ClassType.STRING
                && literalChildNode.getLiteralsValue() != null) {
                literalChildNode.setLiteralsValue(ModelTestCaseUtil.redactStringValue(jsonPropertyNames, literalChildNode.getLiteralsValue()));
              }
            }
          }
        }

        // additional properties
        ModelProperty additionalPropertiesProperty = getAdditionalPropertiesProperty(model);
        if (additionalPropertiesProperty != null) {
          // properties already defined in model
          Set<String> propertySerializedNames = modelProperties.stream()
            .map(p -> p.getSerializedNames().iterator().next())
            .collect(Collectors.toSet());
          // the remaining properties in json
          Map<String, Object> remainingValues = ((Map<String, Object>) objectValue).entrySet().stream()
            .filter(e -> !propertySerializedNames.contains(e.getKey()))
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

          ExampleNode childNode = parseNode(additionalPropertiesProperty.getClientType(), additionalPropertiesProperty.getWireType(), remainingValues);
          node.getChildNodes().add(childNode);
          clientModelNode.getClientModelProperties().put(childNode, additionalPropertiesProperty);
        }
      } else {
        // e.g. do not throw exception, use defaultValueExpression
        node = defaultNode(type, wireType, objectValue);
      }
    } else {
      // If client type is unrecognized, or the objectValue is null, we return default node (LiteralNode)
      // In case of null objectValue, instead of directly returning null node, we let downstream to decide how to deal with it
      node = defaultNode(type, wireType, objectValue);
    }
    return node;
  }

  /**
   * Default String literal node.
   * Generated example will be the type's defaultValueExpression.
   *
   * @param clientType the client type
   * @param wireType the wire type
   * @param exampleValue the example value
   * @return string literal node
   */
  private static ExampleNode defaultNode(IType clientType, IType wireType, Object exampleValue) {
    ExampleNode node;
    LiteralNode literalNode = new LiteralNode(clientType, exampleValue);
    node = literalNode;

    if (exampleValue != null) {
      String literalValue = convertLiteralToClientValue(wireType, exampleValue.toString());
      literalNode.setLiteralsValue(literalValue);
    }
    return node;
  }

  /**
   * Convert literal value in wire type, to literal value in client type
   * <p>
   * date-time in RFC1123 to RFC3339
   * date-time in Unix epoch to RFC3339
   * bytes in base64URL to bytes in string
   *
   * @param wireType the wire type
   * @param literalInWireType the literal value in wire type
   * @return the literal value in client type
   */
  public static String convertLiteralToClientValue(IType wireType, String literalInWireType) {
    // see ClassType.convertToClientType and PrimitiveType.convertToClientType
    String literalValue = literalInWireType;
    if (wireType == ClassType.DATE_TIME_RFC_1123) {
      literalValue = new DateTimeRfc1123(literalValue).getDateTime().toString();
    } else if (wireType == ClassType.BASE_64_URL) {
      literalValue = new Base64Url(literalValue).toString();
    } else if (wireType == PrimitiveType.UNIX_TIME_LONG) {
      literalValue = OffsetDateTime.from(Instant.ofEpochSecond(Long.parseLong(literalValue))).toString();
    }
    return literalValue;
  }

  @SuppressWarnings("unchecked")
  public static Object getChildObjectValue(List<String> jsonPropertyNames, Object objectValue) {
    boolean found = true;
    Object childObjectValue = objectValue;
    // walk the sequence of serialized names
    for (String name : jsonPropertyNames) {
      if (name.isEmpty()) {
        found = false;
        break;
      }

      if (childObjectValue instanceof Map) {
        childObjectValue = ((Map<String, Object>) childObjectValue).get(name);
        if (childObjectValue == null) {
          found = false;
          break;
        }
      } else {
        found = false;
        break;
      }
    }
    return found ? childObjectValue : null;
  }

  /**
   * Parse method parameter (client model or others) to example node.
   * @param example proxy method example
   * @param methodParameter method parameter
   * @return example node
   */
  public static ExampleNode parseNodeFromParameter(ProxyMethodExample example, MethodParameter methodParameter) {
    String serializedName = methodParameter.getSerializedName();
    if (serializedName == null && methodParameter.getProxyMethodParameter().getRequestParameterLocation() == RequestParameterLocation.BODY) {
      serializedName = methodParameter.getProxyMethodParameter().getName();
    }

    Object exampleValue = getParameterExampleValue(example, serializedName, methodParameter.getProxyMethodParameter().getRequestParameterLocation());

    ExampleNode node;
    if (exampleValue == null) {
      if (ClassType.CONTEXT.equals(methodParameter.getClientMethodParameter().getClientType())) {
        node = new LiteralNode(ClassType.CONTEXT, "").setLiteralsValue("");
      } else {
        node = new LiteralNode(methodParameter.getClientMethodParameter().getClientType(), null);
      }
    } else {
      node = parseNodeFromMethodParameter(methodParameter, exampleValue);
    }
    return node;
  }

  /**
   * Get the example value for the parameter.
   *
   * @param example proxy method example
   * @param serializedName parameter serialized name
   * @param requestParameterLocation parameter location
   * @return the example value for the parameter, null if not found
   */
  public static Object getParameterExampleValue(ProxyMethodExample example, String serializedName, RequestParameterLocation requestParameterLocation) {

    ProxyMethodExample.ParameterValue parameterValue = findParameter(example, serializedName);

    if (parameterValue == null && requestParameterLocation == RequestParameterLocation.BODY) {
      // special handling for body, as it does not have serializedName
      String paramSuffix = "Param";
      if (serializedName.endsWith(paramSuffix)) {
        // hack, remove Param, as it likely added by codegen to avoid naming conflict
        serializedName = serializedName.substring(0, serializedName.length() - paramSuffix.length());
        if (!serializedName.isEmpty()) {
          parameterValue = findParameter(example, serializedName);
        }
      }

      // fallback, "body" is commonly used in example JSON for request body
      if (parameterValue == null && !"body".equalsIgnoreCase(serializedName)) {
        serializedName = "body";
        parameterValue = findParameter(example, serializedName);
      }
    }

    Object exampleValue = parameterValue;

    if (parameterValue != null) {
      exampleValue = requestParameterLocation == RequestParameterLocation.QUERY
        ? parameterValue.getUnescapedQueryValue()
        : parameterValue.getObjectValue();
    }

    return exampleValue;
  }

  /**
   * Find parameter example value from proxy method example by serialized parameter name.
   * @param example proxy method example
   * @param serializedName parameter serialized name
   * @return example value for this parameter
   */
  public static ProxyMethodExample.ParameterValue findParameter(ProxyMethodExample example, String serializedName) {
    return example.getParameters().entrySet()
      .stream().filter(p -> p.getKey().equalsIgnoreCase(serializedName))
      .map(Map.Entry::getValue)
      .findFirst().orElse(null);
  }

  private static ExampleNode parseNodeFromMethodParameter(MethodParameter methodParameter, Object objectValue) {
    IType type = methodParameter.getClientMethodParameter().getClientType();
    IType wireType = methodParameter.getClientMethodParameter().getWireType();
    if (methodParameter.getProxyMethodParameter().getCollectionFormat() != null && type instanceof ListType && objectValue instanceof String) {
      // handle parameter style

      IType elementType = ((ListType) type).getElementType();
      ListNode listNode = new ListNode(elementType, objectValue);
      String value = (String) objectValue;

      CollectionFormat collectionFormat = methodParameter.getProxyMethodParameter().getCollectionFormat();
      String[] elements;
      switch (collectionFormat) {
        case CSV:
          elements = value.split(",", -1);
          break;
        case SSV:
          elements = value.split(" ", -1);
          break;
        case PIPES:
          elements = value.split("\\|", -1);
          break;
        case TSV:
          elements = value.split("\t", -1);
          break;
        default:
          // TODO (weidxu): CollectionFormat.MULTI
          elements = value.split(",", -1);
          LOGGER.error("Parameter style '{}' is not supported, fallback to CSV", collectionFormat);
          break;
      }
      for (String childObjectValue : elements) {
        ExampleNode childNode = ModelExampleUtil.parseNode(elementType, childObjectValue);
        listNode.getChildNodes().add(childNode);
      }
      return listNode;
    } else {
      return ModelExampleUtil.parseNode(type, wireType, objectValue);
    }
  }

  private static ModelProperty getAdditionalPropertiesProperty(ClientModel model) {
    ModelProperty modelProperty = null;
    ClientModelProperty property = model.getProperties().stream()
      .filter(ClientModelProperty::isAdditionalProperties)
      .findFirst().orElse(null);
    if (property != null && property.getClientType() instanceof MapType) {
      modelProperty = ModelProperty.ofClientModelProperty(property);
    }
    return modelProperty;
  }

  private static List<ModelProperty> getWritablePropertiesIncludeSuperclass(ClientModel model) {
    Map<String, ModelProperty> propertiesMap = new LinkedHashMap<>();
    List<ModelProperty> properties = new ArrayList<>();

    List<ClientModel> parentModels = new ArrayList<>();
    String parentModelName = model.getParentModelName();
    while (!CoreUtils.isNullOrEmpty(parentModelName)) {
      ClientModel parentModel = ClientModelUtil.getClientModel(parentModelName);
      if (parentModel != null) {
        parentModels.add(parentModel);
      }
      parentModelName = parentModel == null ? null : parentModel.getParentModelName();
    }

    List<List<ModelProperty>> propertiesFromTypeAndParents = new ArrayList<>();
    propertiesFromTypeAndParents.add(new ArrayList<>());
    model.getAccessibleProperties().forEach(p -> {
      ModelProperty modelProperty = ModelProperty.ofClientModelProperty(p);
      if (propertiesMap.putIfAbsent(modelProperty.getName(), modelProperty) == null) {
        propertiesFromTypeAndParents.get(propertiesFromTypeAndParents.size() - 1).add(modelProperty);
      }
    });

    for (ClientModel parent : parentModels) {
      propertiesFromTypeAndParents.add(new ArrayList<>());

      parent.getAccessibleProperties().forEach(p -> {
        ModelProperty modelProperty = ModelProperty.ofClientModelProperty(p);
        if (propertiesMap.putIfAbsent(modelProperty.getName(), modelProperty) == null) {
          propertiesFromTypeAndParents.get(propertiesFromTypeAndParents.size() - 1).add(modelProperty);
        }
      });
    }

    Collections.reverse(propertiesFromTypeAndParents);
    for (List<ModelProperty> properties1 : propertiesFromTypeAndParents) {
      properties.addAll(properties1);
    }

    return properties.stream()
      .filter(p -> !p.isReadOnly() && !p.isConstant())
      .collect(Collectors.toList());
  }

  private static ClientModel getDerivedModel(ClientModel model, String discriminatorValue) {
    if (discriminatorValue.equals(model.getSerializedName())) {
      return model;
    }

    // depth first search
    if (model.getDerivedModels() != null) {
      for (ClientModel childModel : model.getDerivedModels()) {
        if (discriminatorValue.equalsIgnoreCase(childModel.getSerializedName())) {
          // found
          return childModel;
        } else if (childModel.getDerivedModels() != null) {
          // recursive
          ClientModel childModel2 = getDerivedModel(childModel, discriminatorValue);
          if (childModel2 != null) {
            return childModel2;
          }
        }
      }
    }

    // not found
    return null;
  }
}
