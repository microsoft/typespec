// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * A generic type that is used by the client.
 */
public class GenericType implements IType {
    public static final GenericType FLUX_BYTE_BUFFER = flux(ClassType.BYTE_BUFFER);
    /**
     * The main non-generic type of this generic type.
     */
    private final String name;
    /**
     * The package that this type belongs to.
     */
    private final String packageName;
    /**
     * The type arguments of this generic type.
     */
    private final IType[] typeArguments;

    private final String jsonToken;

    /**
     * Create a new GenericType from the provided properties.
     * 
     * @param name The main non-generic type of this generic type.
     * @param typeArguments The type arguments of this generic type.
     */
    public GenericType(String packageKeyword, String name, IType... typeArguments) {
        this(packageKeyword, name, null, typeArguments);
    }

    public GenericType(String packageKeyword, String name, String jsonToken, IType... typeArguments) {
        this.name = name;
        this.packageName = packageKeyword;
        this.typeArguments = typeArguments;
        this.jsonToken = jsonToken;
    }

    public static GenericType flux(IType typeArgument) {
        return genericType(ClassType.FLUX, typeArgument);
    }

    public static GenericType mono(IType typeArgument) {
        return genericType(ClassType.MONO, typeArgument);
    }

    public static GenericType response(IType bodyType) {
        return genericType(ClassType.RESPONSE, bodyType);
    }

    public static GenericType restResponse(IType headersType, IType bodyType) {
        return genericType(ClassType.RESPONSE_BASE, headersType, bodyType);
    }

    public static GenericType pagedResponse(IType bodyType) {
        return genericType(ClassType.PAGED_RESPONSE, bodyType);
    }

    public static GenericType pagedFlux(IType bodyType) {
        return genericType(ClassType.PAGED_FLUX, bodyType);
    }

    public static GenericType pagedIterable(IType bodyType) {
        return genericType(ClassType.PAGED_ITERABLE, bodyType);
    }

    public static GenericType function(IType inputType, IType outputType) {
        return genericType(ClassType.FUNCTION, inputType, outputType);
    }

    public static GenericType pollerFlux(IType pollResultType, IType finalResultType) {
        return genericType(ClassType.POLLER_FLUX, pollResultType, finalResultType);
    }

    public static GenericType syncPoller(IType pollResultType, IType finalResultType) {
        return genericType(ClassType.SYNC_POLLER, pollResultType, finalResultType);
    }

    public static GenericType pollResult(IType pollResultType) {
        return genericType(ClassType.POLL_RESULT, pollResultType);
    }

    private static GenericType genericType(ClassType wrapper, IType... types) {
        return new GenericType(wrapper.getPackage(), wrapper.getName(), types);
    }

    public final String getName() {
        return name;
    }

    public final String getPackage() {
        return packageName;
    }

    public final IType[] getTypeArguments() {
        return typeArguments;
    }

    @Override
    public String toString() {
        return String.format("%1$s<%2$s>", getName(),
            Arrays.stream(getTypeArguments())
                .map(typeArgument -> typeArgument.asNullable().toString())
                .collect(Collectors.joining(", ")));
    }

    /**
     * Creates a String based on the generic type that can be used as a Java property name.
     * <p>
     * For example {@code Map<String, Object>} would become {@code MapStringObject}.
     *
     * @return A String representation of the generic type that can be used as a Java property name.
     */
    public String toJavaPropertyString() {
        StringBuilder javaPropertyString = new StringBuilder(getName());

        for (IType typeArgument : typeArguments) {
            if (typeArgument instanceof GenericType) {
                javaPropertyString.append(((GenericType) typeArgument).toJavaPropertyString());
            } else {
                javaPropertyString.append(typeArgument.asNullable());
            }
        }

        return javaPropertyString.toString();
    }

    @Override
    public boolean equals(Object rhs) {
        boolean tempVar = rhs instanceof GenericType;
        GenericType genericTypeRhs = tempVar ? (GenericType) rhs : null;
        return tempVar
            && getPackage().equals(genericTypeRhs.packageName)
            && getName().equals(genericTypeRhs.name)
            && Arrays.equals(getTypeArguments(), genericTypeRhs.typeArguments);
    }

    @Override
    public int hashCode() {
        return getPackage().hashCode() + getName().hashCode()
            + Arrays.stream(getTypeArguments()).map(Object::hashCode).reduce(0, Integer::sum);
    }

    public final IType asNullable() {
        return this;
    }

    public final boolean contains(IType type) {
        return this == type
            || Arrays.stream(getTypeArguments()).anyMatch((IType typeArgument) -> typeArgument.contains(type));
    }

    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        imports.add(String.format("%1$s.%2$s", getPackage(), getName()));
        for (IType typeArgument : getTypeArguments()) {
            typeArgument.addImportsTo(imports, includeImplementationImports);
        }
    }

    public final String defaultValueExpression(String sourceExpression) {
        return sourceExpression;
    }

    @Override
    public String defaultValueExpression() {
        return "null";
    }

    public final IType getClientType() {
        IType clientType = this;

        IType[] wireTypeArguments = getTypeArguments();
        IType[] clientTypeArguments = Arrays.stream(wireTypeArguments).map(IType::getClientType).toArray(IType[]::new);

        for (int i = 0; i < clientTypeArguments.length; ++i) {
            if (clientTypeArguments[i] != wireTypeArguments[i]) {
                if (this instanceof ListType) {
                    clientType = new ListType(clientTypeArguments[0]);
                } else if (this instanceof IterableType) {
                    clientType = new IterableType(clientTypeArguments[0]);
                } else if (this instanceof MapType) {
                    clientType = new MapType(clientTypeArguments[1]);
                } else {
                    clientType = new GenericType(getPackage(), getName(), jsonToken(), clientTypeArguments);
                }
                break;
            }
        }

        return clientType;
    }

    public final String convertToClientType(String expression) {
        return convert(expression, true);
    }

    public final String convertFromClientType(String expression) {
        return convert(expression, false);
    }

    private String convert(String expression, boolean isToClient) {
        if (this == getClientType()) {
            return expression;
        }

        IType[] wireTypeArguments = getTypeArguments();
        IType[] clientTypeArguments = Arrays.stream(wireTypeArguments).map(IType::getClientType).toArray(IType[]::new);

        for (int i = 0; i < clientTypeArguments.length; ++i) {
            if (clientTypeArguments[i] != wireTypeArguments[i]) {
                if (this instanceof ListType) {
                    String mapping = isToClient
                        ? wireTypeArguments[i].convertToClientType("el")
                        : wireTypeArguments[i].convertFromClientType("el");
                    expression
                        = String.format("%1$s.stream().map(el -> %2$s).collect(java.util.stream.Collectors.toList())",
                            expression, mapping);
                } else if (this instanceof IterableType) {
                    String mapping = isToClient
                        ? wireTypeArguments[i].convertToClientType("el")
                        : wireTypeArguments[i].convertFromClientType("el");
                    expression = String.format("java.util.stream.StreamSupport.stream(%1$s.spliterator(), false).map"
                        + "(el -> %2$s).collect(java.util.stream.Collectors.toList())", expression, mapping);
                } else if (this instanceof MapType) {
                    String mapping = isToClient
                        ? wireTypeArguments[i].convertToClientType("el")
                        : wireTypeArguments[i].convertFromClientType("el");
                    // Key is always String in Swagger 2
                    expression = String.format(
                        "%1$s.entrySet().stream().collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, el -> %2$s))",
                        expression, mapping);
                } else {
                    throw new UnsupportedOperationException(String.format(
                        "Instance %1$s of generic type %2$s not supported for conversion %3$s client type.", expression,
                        this, isToClient ? "to" : "from"));
                }
                break;
            }
        }

        return expression;
    }

    @Override
    public String jsonToken() {
        return jsonToken;
    }

    @Override
    public final String jsonDeserializationMethod(String jsonReaderName) {
        return null;
    }

    @Override
    public final String jsonSerializationMethodCall(String jsonWriterName, String fieldName, String valueGetter,
        boolean jsonMergePatch) {
        return null;
    }

    @Override
    public final String xmlDeserializationMethod(String xmlReaderName, String attributeName, String attributeNamespace,
        boolean namespaceIsConstant) {
        return null;
    }

    @Override
    public final String xmlSerializationMethodCall(String xmlWriterName, String attributeOrElementName,
        String namespaceUri, String valueGetter, boolean isAttribute, boolean nameIsVariable,
        boolean namespaceIsConstant) {
        return null;
    }

    @Override
    public boolean isUsedInXml() {
        return false;
    }

    @Override
    public String validate(String expression) {
        return null;
    }

    public String validate(String expression, int depth) {
        return validate(expression);
    }
}
