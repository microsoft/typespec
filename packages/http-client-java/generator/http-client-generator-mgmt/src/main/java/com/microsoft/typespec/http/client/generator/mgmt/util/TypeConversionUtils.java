// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.util;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.Response;

import java.util.Objects;

public class TypeConversionUtils {

    private TypeConversionUtils() {
    }

    /**
     * Get expression that converts the response of client method to the response of the collection method.
     *
     * It converts innerModel to implementation of resource model.
     * It transfers the conversion along chain of generic types.
     * It converts list and map to immutable.
     *
     * @param clientType the type of the response of client method
     * @param variableName the variable name of the response of client method
     * @return the expression that converts the response of client method to the response of the collection method
     */
    public static String conversionExpression(IType clientType, String variableName) {
        String expression = null;
        if (clientType instanceof ClassType) {
            ClassType type = (ClassType) clientType;
            if (FluentUtils.isInnerClassType(type)) {
                expression = String.format("new %1$s(%2$s, this.%3$s())", getModelImplName(type), variableName, ModelNaming.METHOD_MANAGER);
            } else if (FluentUtils.isResponseType(type)) {
                IType valueType = FluentUtils.getValueTypeFromResponseType(type);
                if (valueType instanceof ClassType || valueType instanceof GenericType) {
                    String valuePropertyName = variableName + ".getValue()";
                    expression = String.format("new SimpleResponse<>(%1$s.getRequest(), %1$s.getStatusCode(), %1$s.getHeaders(), %2$s)", variableName, conversionExpression(valueType, valuePropertyName));
                } else {
                    expression = variableName;
                }
            }
        } else if (clientType instanceof ListType) {
            ListType type = (ListType) clientType;
            String nestedPropertyName = nextPropertyName(variableName);
            expression = String.format("%1$s.stream().map(%2$s -> %3$s).collect(Collectors.toList())", variableName, nestedPropertyName, conversionExpression(type.getElementType(), nestedPropertyName));
        } else if (clientType instanceof MapType) {
            MapType type = (MapType) clientType;
            String nestedPropertyName = nextPropertyName(variableName);
            String valuePropertyName = nestedPropertyName + ".getValue()";
            expression = String.format("%1$s.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, %2$s -> %3$s))", variableName, nestedPropertyName, conversionExpression(type.getValueType(), valuePropertyName));
        } else if (clientType instanceof GenericType) {
            GenericType type = (GenericType) clientType;
            if (PagedIterable.class.getSimpleName().equals(type.getName())) {
                IType valueType = type.getTypeArguments()[0];
                if (valueType instanceof ClassType) {
                    String nestedPropertyName = nextPropertyName(variableName);
                    expression = String.format("%1$s.mapPage(%2$s, %3$s -> new %4$s(%5$s, this.%6$s()))",
                            ModelNaming.CLASS_RESOURCE_MANAGER_UTILS, variableName, nestedPropertyName, getModelImplName((ClassType) valueType), nestedPropertyName, ModelNaming.METHOD_MANAGER);
                }
            } else if (Response.class.getSimpleName().equals(type.getName())) {
                IType valueType = type.getTypeArguments()[0];
                if (valueType instanceof ClassType || valueType instanceof GenericType) {
                    String valuePropertyName = variableName + ".getValue()";
                    expression = String.format("new SimpleResponse<>(%1$s.getRequest(), %1$s.getStatusCode(), %1$s.getHeaders(), %2$s)", variableName, conversionExpression(valueType, valuePropertyName));
                } else {
                    expression = variableName;
                }
            }
        }
        Objects.requireNonNull(expression, "Unexpected scenario in WrapperTypeConversionMethod.conversionExpression. ClientType is " + clientType);
        return expression;
    }

    public static String objectOrUnmodifiableCollection(IType clientType, String expression) {
        String unmodifiableMethodName = null;
        if (clientType instanceof ListType) {
            unmodifiableMethodName = "unmodifiableList";
        } else if (clientType instanceof MapType) {
            unmodifiableMethodName = "unmodifiableMap";
        }
        return (unmodifiableMethodName == null)
                ? expression
                : String.format("Collections.%1$s(%2$s)", unmodifiableMethodName, expression);
    }

    public static String nullOrEmptyCollection(IType clientType) {
        String emptyExpression = "null";
        if (clientType instanceof ListType) {
            emptyExpression = "Collections.emptyList()";
        } else if (clientType instanceof MapType) {
            emptyExpression = "Collections.emptyMap()";
        }
        return emptyExpression;
    }

    public static boolean isPagedIterable(IType clientType) {
        boolean ret = false;
        if (clientType instanceof GenericType) {
            GenericType type = (GenericType) clientType;
            if (PagedIterable.class.getSimpleName().equals(type.getName())) {
                ret = true;
            }
        }
        return ret;
    }

    public static String tempVariableName() {
        return "inner";
    }

    private static String nextPropertyName(String propertyName) {
        if (propertyName.indexOf('.') > 0) {
            propertyName = propertyName.substring(0, propertyName.indexOf('.'));
        }
        if (propertyName.equals(tempVariableName())) {
            return tempVariableName() + "1";
        } else {
            return tempVariableName() + (Integer.parseInt(propertyName.substring(tempVariableName().length())) + 1);
        }
    }

    private static String getModelImplName(ClassType classType) {
        return FluentUtils.resourceModelInterfaceClassType(classType).getName() + ModelNaming.MODEL_IMPL_SUFFIX;
    }
}
