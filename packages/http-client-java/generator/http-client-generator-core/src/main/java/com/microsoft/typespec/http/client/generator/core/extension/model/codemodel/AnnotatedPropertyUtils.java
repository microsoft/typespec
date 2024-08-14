// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import org.yaml.snakeyaml.introspector.BeanAccess;
import org.yaml.snakeyaml.introspector.Property;
import org.yaml.snakeyaml.introspector.PropertyUtils;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * PropertyUtils that leverage @YamlProperty annotation on getter methods.
 * @see YamlProperty
 */
public class AnnotatedPropertyUtils extends PropertyUtils {
    private final Map<Class<?>, Map<String, Property>> cachedPropertyMap = new HashMap<>();

    /**
     * Creates a new instance of AnnotatedPropertyUtils class.
     */
    public AnnotatedPropertyUtils() {
        super();
    }

    @Override
    protected Map<String, Property> getPropertiesMap(Class<?> type, BeanAccess bAccess) {
        if (cachedPropertyMap.get(type) != null) {
            return new LinkedHashMap<>(cachedPropertyMap.get(type));
        }
        Map<String, Property> propertyMap =  super.getPropertiesMap(type, bAccess);
        Map<String, Property> mappedPropertyMap = new HashMap<>();
        for (String propertyName : propertyMap.keySet()) {
            Property property = propertyMap.get(propertyName);
            YamlProperty yamlProperty = property.getAnnotation(YamlProperty.class);
            if (yamlProperty != null) {
                mappedPropertyMap.put(yamlProperty.value(), property);
            }
        }
        propertyMap.putAll(mappedPropertyMap);
        cachedPropertyMap.put(type, propertyMap);
        return propertyMap;
    }
}
