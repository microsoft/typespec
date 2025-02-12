package com.microsoft.provisioning.http.client.generator.provisioning.model;

import com.microsoft.provisioning.http.client.generator.provisioning.utils.ReflectionUtils;
import java.lang.reflect.Field;
import java.lang.reflect.Parameter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class Property {
    private final TypeModel parent;
    private String name;
    private ModelBase propertyType;
    private String description;
    private List<String> path;
    private boolean isReadOnly;
    private boolean isRequired;
    private boolean isSecure;
    private boolean generateDefaultValue;
    private boolean hideAccessors;

    public Property(TypeModel parent, ModelBase propertyType, String name) {
        this.parent = parent;
        this.name = name;
        this.propertyType = propertyType;
        this.description = parent.getSpec().getDocComments();
        this.isReadOnly = false;
        this.isRequired = false;
        this.isSecure = false;
        this.generateDefaultValue = false;
        this.hideAccessors = false;
        this.path = new ArrayList<>();
    }

    private String parseName(Parameter armParameter, Field armMember) {
        if (armParameter != null) {
            return toCamelCase(armParameter.getName());
        } else if (ReflectionUtils.isPropertiesTypes(armMember)) {
            return "properties";
        } else {
            return toCamelCase(armMember.getName());
        }
    }

    public TypeModel getParent() {
        return parent;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ModelBase getPropertyType() {
        return propertyType;
    }

    public void setPropertyType(ModelBase propertyType) {
        this.propertyType = propertyType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getPath() {
        return path;
    }

    public void setPath(List<String> path) {
        this.path = path;
    }

    public boolean isReadOnly() {
        return isReadOnly;
    }

    public void setReadOnly(boolean readOnly) {
        isReadOnly = readOnly;
    }

    public boolean isRequired() {
        return isRequired;
    }

    public void setRequired(boolean required) {
        isRequired = required;
    }

    public boolean isSecure() {
        return isSecure;
    }

    public void setSecure(boolean secure) {
        isSecure = secure;
    }

    public boolean isGenerateDefaultValue() {
        return generateDefaultValue;
    }

    public void setGenerateDefaultValue(boolean generateDefaultValue) {
        this.generateDefaultValue = generateDefaultValue;
    }

    public boolean isHideAccessors() {
        return hideAccessors;
    }

    public void setHideAccessors(boolean hideAccessors) {
        this.hideAccessors = hideAccessors;
    }

    public String getFieldName() {
        return "_" + toCamelCase(name);
    }

    public String getBicepTypeReference() {
        return getBicepType(propertyType);
    }

    private static String getBicepType(ModelBase type) {
        // FIXME we never seem to get in the other types for dictionary / list
        if (type == null) {
            return "BicepValue<Object>";
        } else if (type instanceof DictionaryModel && isCollection(((DictionaryModel) type).getElementType())) {
            return "BicepDictionary<" + getBicepType(((DictionaryModel) type).getElementType()) + ">";
        } else if (type instanceof DictionaryModel) {
            return "BicepDictionary<" + ((DictionaryModel) type).getElementType().getTypeReference() + ">";
        } else if (type instanceof ListModel && isCollection(((ListModel) type).getElementType())) {
            return "BicepList<" + getBicepType(((ListModel) type).getElementType()) + ">";
        } else if (type instanceof ListModel) {
            return "BicepList<" + ((ListModel) type).getElementType().getTypeReference() + ">";
        } else {
            return "BicepValue<" + type.getTypeReference() + ">";
        }
    }

    // FIXME shouldn't need this param!
    public String getBicepDefinition(boolean withBooleans) {
        StringBuilder sb = new StringBuilder();
        final String bicepPath = "\"" + name + "\""; // getPath().stream().collect(Collectors.joining(", "));

        if (propertyType instanceof DictionaryModel) {
            return "BicepDictionary.defineProperty(this, \"" + name + "\", new String[] { " + bicepPath + " }, "
                + isReadOnly + ", " + isRequired + ")";
        } else if (propertyType instanceof ListModel) {
            return "BicepList.defineProperty(this, \"" + name + "\", new String[] { " + bicepPath + " }, false, "
                + isReadOnly + ")";
        } else {
            sb.append("BicepValue.defineProperty(this, \"" + name + "\", new String[] { " + bicepPath + " }");
            if (withBooleans) {
                sb.append(", " + isReadOnly + ", " + isRequired + ", " + isSecure);
            }
            sb.append(", null)");    // defaultValue
        }

        return sb.toString();
    }

    private static boolean isCollection(ModelBase type) {
        return type instanceof DictionaryModel || type instanceof ListModel;
    }

    private static String toPascalCase(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    private static String toCamelCase(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toLowerCase() + str.substring(1);
    }

    @Override
    public String toString() {
        return "<Property " + (parent != null ? parent.getSpec().getName() : "") + "::"
            + (parent != null ? parent.getName() : "") + "." + name + " : "
            + (propertyType != null ? propertyType.getName() : "") + ">";
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.name, this.propertyType);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj instanceof Property) {
            Property that = (Property) obj;
            return Objects.equals(this.name, that.getName())
                && Objects.equals(this.propertyType, that.getPropertyType());
        }
        return false;
    }
}
