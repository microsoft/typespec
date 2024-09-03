// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.util;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.ResourceTypeName;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.ErrorClientModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.ResourceClientModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.LocalVariable;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceLocalVariables;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientResponse;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelProperty;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.microsoft.typespec.http.client.generator.core.util.TypeUtil;
import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.ResponseBase;
import com.azure.core.http.rest.SimpleResponse;
import com.azure.core.http.rest.StreamResponse;
import com.azure.core.util.Context;
import com.azure.core.util.CoreUtils;
import org.slf4j.Logger;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class FluentUtils {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), FluentUtils.class);

    private static final Set<String> RESERVED_CLASS_NAMES = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            Response.class.getSimpleName(),
            Context.class.getSimpleName()
    )));

    private FluentUtils() {
    }

    public static void log(String format) {
        LOGGER.info(format);
    }

    public static void log(String format, Object... arguments) {
        LOGGER.info(format, arguments);
    }

    public static Set<String> reservedClassNames() {
        return RESERVED_CLASS_NAMES;
    }

    public static boolean isInnerClassType(ClassType classType) {
        return isInnerClassType(classType.getPackage(), classType.getName());
    }

    public static boolean isInnerClassType(String packageName, String name) {
        JavaSettings settings = JavaSettings.getInstance();
        String innerPackageName = settings.getPackage(settings.getFluentModelsSubpackage());
        return packageName.equals(innerPackageName) && name.endsWith("Inner");
    }

    public static ClassType resourceModelInterfaceClassType(ClassType innerModelClassType) {
        return resourceModelInterfaceClassType(innerModelClassType.getName());
    }

    public static ClassType resourceModelInterfaceClassType(String innerModelClassName) {
        JavaSettings settings = JavaSettings.getInstance();
        String modelName = innerModelClassName.substring(0, innerModelClassName.length() - "Inner".length());
        if (reservedClassNames().contains(modelName)) {
            modelName += "Model";
        }
        return new ClassType.Builder()
                .packageName(settings.getPackage(settings.getModelsSubpackage()))
                .name(modelName)
                .build();
    }

    public static String getGetterName(String propertyName) {
        return CodeNamer.getModelNamer().modelPropertyGetterName(propertyName);
    }

    public static String getServiceName(String clientName) {
        JavaSettings settings = JavaSettings.getInstance();
        String serviceName = settings.getServiceName();
        if (CoreUtils.isNullOrEmpty(serviceName)) {
            serviceName = getServiceNameFromClientName(clientName, settings.getPackage());
        }
        return serviceName;
    }

    static String getServiceNameFromClientName(String clientName, String packageName) {
        String serviceName = null;
        String packageLastName = getPackageLastName(packageName);

        if (clientName != null) {
            if (clientName.toLowerCase(Locale.ROOT).startsWith(packageLastName.toLowerCase(Locale.ROOT))) {
                serviceName = clientName.substring(0, packageLastName.length());
            } else {
                final String keywordManagementClient = "ManagementClient";
                final String keywordClient = "Client";
                if (clientName.endsWith(keywordManagementClient)) {
                    serviceName = clientName.substring(0, clientName.length() - keywordManagementClient.length());
                } else if (clientName.endsWith(keywordClient)) {
                    serviceName = clientName.substring(0, clientName.length() - keywordClient.length());
                }
            }
        }

        if (CoreUtils.isNullOrEmpty(serviceName)) {
            serviceName = packageLastName;
        }
        return serviceName;
    }

    public static String getArtifactId() {
        JavaSettings settings = JavaSettings.getInstance();
        String artifactId = ClientModelUtil.getArtifactId();
        if (CoreUtils.isNullOrEmpty(artifactId)) {
            artifactId = getArtifactIdFromPackageName(settings.getPackage().toLowerCase(Locale.ROOT));
        }
        return artifactId;
    }

    static String getArtifactIdFromPackageName(String packageName) {
        String artifactId;
        if (packageName.startsWith("com.azure.resourcemanager")) {
            // if namespace looks good, convert it to artifactId directly
            artifactId = packageName.substring("com.".length()).replace(".", "-");
        } else {
            String packageLastName = getPackageLastName(packageName).toLowerCase(Locale.ROOT);
            artifactId = String.format("azure-resourcemanager-%1$s-generated", packageLastName);
        }
        return artifactId;
    }

    private static String getPackageLastName(String packageName) {
        String packageLastName = packageName;
        if (packageLastName.endsWith(".generated")) {
            packageLastName = packageLastName.substring(0, packageLastName.lastIndexOf("."));
        }
        int pos = packageLastName.lastIndexOf(".");
        if (pos != -1 && pos != packageLastName.length() - 1) {
            packageLastName = packageLastName.substring(pos + 1);
        }
        return packageLastName;
    }

    public static IType getFluentWrapperType(IType clientType) {
        IType wrapperType = clientType;
        if (clientType instanceof ClassType) {
            ClassType type = (ClassType) clientType;
            if (FluentUtils.isInnerClassType(type)) {
                wrapperType = FluentUtils.resourceModelInterfaceClassType(type);
            } else if (FluentUtils.isResponseType(type)) {
                IType bodyType = FluentUtils.getValueTypeFromResponseType(type);
                IType wrapperItemType = getFluentWrapperType(bodyType);
                wrapperType = wrapperItemType == bodyType ? type : GenericType.Response(wrapperItemType);
            }
        } else if (clientType instanceof ListType) {
            ListType type = (ListType) clientType;
            IType wrapperElementType = getFluentWrapperType(type.getElementType());
            wrapperType = wrapperElementType == type.getElementType() ? type : new ListType(wrapperElementType);
        } else if (clientType instanceof MapType) {
            MapType type = (MapType) clientType;
            IType wrapperElementType = getFluentWrapperType(type.getValueType());
            wrapperType = wrapperElementType == type.getValueType() ? type : new MapType(wrapperElementType);
        } else if (clientType instanceof GenericType) {
            GenericType type = (GenericType) clientType;
            if (PagedIterable.class.getSimpleName().equals(type.getName())) {
                IType wrapperItemType = getFluentWrapperType(type.getTypeArguments()[0]);
                wrapperType = wrapperItemType == type.getTypeArguments()[0] ? type : GenericType.PagedIterable(wrapperItemType);
            } else if (Response.class.getSimpleName().equals(type.getName())) {
                IType wrapperItemType = getFluentWrapperType(type.getTypeArguments()[0]);
                wrapperType = wrapperItemType == type.getTypeArguments()[0] ? type : GenericType.Response(wrapperItemType);
            }
        }
        return wrapperType;
    }

    public static String getSingular(String name) {
        return Utils.getSingular(name);
    }

    public static boolean isContextParameter(ClientMethodParameter parameter) {
        return ClassType.CONTEXT.getName().equals(parameter.getClientType().toString());
    }

    public static ClientModel getClientModel(String name) {
        if (name == null) {
            return null;
        }

        ClientModel clientModel = null;
        if (FluentStatic.getClient() == null) {
            clientModel = ClientModels.getInstance().getModel(name);
        } else {
            for (ClientModel model : FluentStatic.getClient().getModels()) {
                if (name.equals(model.getName())) {
                    clientModel = model;
                    break;
                }
            }
        }
        if (clientModel == null) {
            clientModel = ResourceClientModel.getResourceClientModel(name)
                    .or(() -> ErrorClientModel.getErrorClientModel(name))
                    .orElse(null);
        }
        return clientModel;
    }

    public static String loadTextFromResource(String filename, String... replacements) {
        return TemplateUtil.loadTextFromResource(filename, replacements);
    }

    /**
     * Get the name of the argument for the method call.
     *
     * If the parameter is provided by the caller, the name is unchanged and directly passed to the method call.
     * If the parameter is provided by class variable or local variable, the name is unchanged, or might need simple conversion as the type might not align exactly.
     * If the parameter is same as innerModel of the resource model, use innerModel.
     * If the parameter is Context, use Context.NONE.
     *
     * @param parameter the client method parameter that requires the argument
     * @param inputParametersSet the parameters that provided by the caller
     * @param localVariables the local variables that defined in the class
     * @param resourceModel the resource model, usually its innerModel
     * @param collectionMethod the method
     * @return the name of the argument
     */
    public static String getLocalMethodArgument(ClientMethodParameter parameter,
                                                Set<ClientMethodParameter> inputParametersSet, ResourceLocalVariables localVariables,
                                                FluentResourceModel resourceModel, FluentCollectionMethod collectionMethod) {
        return getLocalMethodArgument(parameter, inputParametersSet, localVariables, resourceModel, collectionMethod, null);
    }

    public static String getLocalMethodArgument(ClientMethodParameter parameter,
                                                Set<ClientMethodParameter> inputParametersSet, ResourceLocalVariables localVariables,
                                                FluentResourceModel resourceModel, FluentCollectionMethod collectionMethod,
                                                ResourceLocalVariables resourceLocalVariablesDefinedInClass) {
        if (inputParametersSet.contains(parameter)) {
            // input parameter
            return parameter.getName();
        } else if (resourceModel.getInnerModel().getName().equals(parameter.getClientType().toString())) {
            // body payload, use innerModel
            return String.format("this.%1$s()", ModelNaming.METHOD_INNER_MODEL);
        } else if (ClassType.CONTEXT == parameter.getClientType()) {
            // context not in input, use NONE
            return "Context.NONE";
        } else {
            // local variables
            LocalVariable localVariable = localVariables.getLocalVariableByMethodParameter(parameter);
            if (localVariable == null) {
                throw new IllegalStateException(String.format("Local variable not found for method %1$s, model %2$s, parameter %3$s, available local variables %4$s",
                        collectionMethod.getMethodName(),
                        resourceModel.getName(),
                        parameter.getName(),
                        localVariables.getLocalVariablesMap().entrySet().stream().collect(Collectors.toMap(e -> e.getKey().getName(), e -> e.getValue().getName()))));
            }
            String name = localVariable.getName();

            // there could be case that the variable used in method (ResourceUpdate or ResourceRefresh) is different from the one defined in class (by ResourceCreate)
            LocalVariable localVariableDefinedInClass = resourceLocalVariablesDefinedInClass == null
                    ? null
                    : resourceLocalVariablesDefinedInClass.getLocalVariablesMap().values().stream()
                    .filter(var -> localVariable.getName().equals(var.getName())).findFirst().orElse(null);
            if (localVariableDefinedInClass != null
                    && !Objects.equals(localVariableDefinedInClass.getVariableType().toString(), localVariable.getVariableType().toString())) {
                if (localVariableDefinedInClass.getVariableType() == ClassType.STRING) {
                    name = String.format("%1$s.fromString(%2$s)", localVariable.getVariableType().toString(), name);
                } else if (localVariable.getVariableType() == ClassType.STRING) {
                    name = String.format("%1$s.toString()", name);
                }
            }
            return name;
        }
    }

    public static boolean modelHasLocationProperty(FluentResourceModel resourceModel) {
        return resourceModel.hasProperty(ResourceTypeName.FIELD_LOCATION)
                && resourceModel.getProperty(ResourceTypeName.FIELD_LOCATION).getFluentType() == ClassType.STRING;
    }

    public static boolean modelHasLocationProperty(List<ModelProperty> properties) {
        return properties.stream()
                .anyMatch(p -> ResourceTypeName.FIELD_LOCATION.equals(p.getName()) && p.getClientType() == ClassType.STRING);
    }

    public static boolean isResponseType(IType clientType) {
        boolean ret = false;
        if (clientType instanceof GenericType) {
            // Response<>
            GenericType type = (GenericType) clientType;
            if (Response.class.getSimpleName().equals(type.getName())) {
                ret = true;
            } else {
                ret = TypeUtil.isGenericTypeClassSubclassOf(type, Response.class);
            }
        } else if (clientType instanceof ClassType) {
            // ClientResponse is type of a subclass of Response<>
            ClassType type = (ClassType) clientType;
            Optional<ClientResponse> clientResponse = FluentStatic.getClient().getResponseModels().stream()
                    .filter(r -> r.getName().equals(type.getName()))
                    .findAny();
            ret = clientResponse.isPresent();
        }
        return ret;
    }

    public static IType getValueTypeFromResponseType(IType clientType) {
        IType bodyType = null;
        if (clientType instanceof GenericType) {
            GenericType type = (GenericType) clientType;
            if (Response.class.getSimpleName().equals(type.getName())) {
                bodyType = type.getTypeArguments()[0];
            } else if (TypeUtil.isGenericTypeClassSubclassOf(type, Response.class)) {
                bodyType = getValueTypeFromResponseTypeSubType(type);
            }
        } else if (clientType instanceof ClassType) {
            ClassType type = (ClassType) clientType;
            Optional<ClientResponse> clientResponse = FluentStatic.getClient().getResponseModels().stream()
                    .filter(r -> r.getName().equals(type.getName()))
                    .findFirst();
            if (clientResponse.isPresent()) {
                bodyType = clientResponse.get().getBodyType();
            }
        }
        return bodyType;
    }

    private static IType getValueTypeFromResponseTypeSubType(GenericType type) {
        IType bodyType;
        if (ResponseBase.class.getSimpleName().equals(type.getName())) {
            bodyType = type.getTypeArguments()[1];
        } else if (SimpleResponse.class.getSimpleName().equals(type.getName())) {
            bodyType = type.getTypeArguments()[0];
        } else if (StreamResponse.class.getSimpleName().equals(type.getName())) {
            bodyType = GenericType.FLUX_BYTE_BUFFER;
        } else {
            log("Unable to determine value type for Response subtype: %s, fallback to typeArguments[0].", type);
            bodyType = type.getTypeArguments()[0];
        }
        return bodyType;
    }

    public static List<String> splitFlattenedSerializedName(String serializedName) {
        return ClientModelUtil.splitFlattenedSerializedName(serializedName);
    }

    public static boolean exampleIsUpdate(String name) {
        name = name.toLowerCase(Locale.ROOT);
        return name.contains("update") && !name.contains("create");
    }

    public static boolean validRequestContentTypeToGenerateExample(ClientMethod clientMethod) {
        // for now, only accept JSON as request body

        String requestContentType = clientMethod.getProxyMethod().getRequestContentType();
        return clientMethod.getProxyMethod().getExamples() != null
                && requiresExample(clientMethod)
                // currently only generate for json payload, i.e. "text/json", "application/json"
                && requestContentType != null && requestContentType.contains("json");
    }

    public static boolean validResponseContentTypeToGenerateExample(ClientMethod clientMethod) {
        // for now, avoid binary as response body

        IType responseBodyType = clientMethod.getProxyMethod().getResponseBodyType();
        return !(responseBodyType == ClassType.BINARY_DATA || responseBodyType == GenericType.FLUX_BYTE_BUFFER);
    }

    public static boolean requiresExample(ClientMethod clientMethod) {
        if (clientMethod.getType() == ClientMethodType.SimpleSync
                || clientMethod.getType() == ClientMethodType.SimpleSyncRestResponse
                || clientMethod.getType() == ClientMethodType.PagingSync
                || clientMethod.getType() == ClientMethodType.LongRunningSync) {
            // generate example for the method with full parameters
            return clientMethod.getParameters().stream().anyMatch(p -> ClassType.CONTEXT.equals(p.getClientType()));
        }
        return false;
    }
}
