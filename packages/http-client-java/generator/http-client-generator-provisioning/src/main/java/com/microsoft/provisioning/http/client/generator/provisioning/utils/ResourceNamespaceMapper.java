package com.microsoft.provisioning.http.client.generator.provisioning.utils;

import com.azure.core.annotation.Get;
import com.azure.core.annotation.Put;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.ResponseBase;
import com.azure.resourcemanager.resources.fluentcore.arm.ResourceId;
import org.reflections.Reflections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public class ResourceNamespaceMapper {

    private static final Logger LOGGER = LoggerFactory.getLogger(ResourceNamespaceMapper.class);

    private static final Map<Type, ResourceId> RESOURCE_NAMESPACES = new HashMap<>();
    private static final Map<ResourceId, Type> RESOURCE_ARM_TYPES = new HashMap<>();

    public static String getNamespace(Type armType) {
        ResourceId resourceIdTemplate = getResourceIdTemplate(armType);
        if (resourceIdTemplate == null) {
            return null;
        }
        return resourceIdTemplate.fullResourceType();
    }

    public static Type getResourceType(ResourceId resourceIdTemplate) {
        return RESOURCE_ARM_TYPES.get(resourceIdTemplate);
    }

    public static ResourceId getResourceIdTemplate(Type armType) {
        return RESOURCE_NAMESPACES.get(armType);
    }

    private ResourceNamespaceMapper() {

    }

    public static void initializeNamespace(Reflections reflections) {
        Map<String, Method> getMethods = reflections.getMethodsAnnotatedWith(Get.class)
            .stream()
            .filter(method -> !method.getAnnotation(Get.class).value().equals("{nextLink}") && method.getName().startsWith("get"))
            .collect(Collectors.toMap(method -> method.getAnnotation(Get.class).value(), Function.identity()));
        reflections.getMethodsAnnotatedWith(Put.class)
            .stream()
            .filter(proxyMethod -> proxyMethod.getName().startsWith("create"))
            .forEach(proxyMethod -> {
                Type resourceType = getResourceType(proxyMethod);
                Put put = proxyMethod.getAnnotation(Put.class);
                if (resourceType != null
                    // exclude Flux<ByteBuffer>
                    && !ParameterizedType.class.isAssignableFrom(resourceType.getClass())) {
                    try {
                        ResourceId resourceId = ResourceId.fromString(put.value());
                        RESOURCE_NAMESPACES.put(resourceType, resourceId);
                        RESOURCE_ARM_TYPES.put(resourceId, resourceType);
                    } catch (Exception e) {
                        LOGGER.warn("Invalid resourceId found on ProxyMethod. Method: {}, resourceId: {}", proxyMethod, put.value());
                    }
                } else {
                    Method getMethod = getMethods.get(put.value());
                    if (getMethod != null) {
                        ResourceId resourceId = ResourceId.fromString(put.value());
                        Type armType = getResourceType(getMethod);
                        RESOURCE_NAMESPACES.put(armType, resourceId);
                        RESOURCE_ARM_TYPES.put(resourceId, armType);
                    } else {
                        LOGGER.warn("Invalid resourceId found on ProxyMethod. Method: {}, resourceId: {}", proxyMethod, put.value());
                    }
                }
            });
    }

    private static Type getResourceType(Method proxyMethod) {
        try {
            Type resourceType = null;
            Type returnType = proxyMethod.getReturnType();
            if (returnType == Response.class) {
                resourceType = getGenericArgument(proxyMethod.getGenericReturnType());
            } else if (returnType == Mono.class) {
                Type responseType = getGenericArgument(proxyMethod.getGenericReturnType());
                if (responseType instanceof ParameterizedType && ((ParameterizedType) responseType).getRawType() == Response.class) {
                    return getGenericArgument(responseType);
                } else if (responseType instanceof Class<?> && ((Class<?>) responseType).getSuperclass() ==
                    ResponseBase.class) {
                    return ((ParameterizedType) ((Class<?>) responseType).getGenericSuperclass()).getActualTypeArguments()[1];
                }
            }
            return resourceType;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static Type getGenericArgument(Type returnType) {
        return ((ParameterizedType) returnType).getActualTypeArguments()[0];
    }
}
