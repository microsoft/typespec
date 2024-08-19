// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.ResourceTypeName;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.ModelCategory;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.UrlPathSegments;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentClient;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceLocalVariables;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.action.ResourceActions;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.ResourceCreate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.delete.ResourceDelete;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.get.ResourceRefresh;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.ResourceUpdate;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.azure.core.http.HttpMethod;
import com.azure.core.management.Region;
import com.azure.core.util.CoreUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

public class ResourceParser {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), ResourceParser.class);

    public static void parseResourcesCategory(FluentResourceCollection collection,
                                              List<FluentResourceModel> availableFluentModels,
                                              List<ClientModel> availableModels) {
        // resource create
        List<ResourceCreate> resourceCreates = ResourceParser.resolveResourceCreate(collection, availableFluentModels, availableModels);

        // resource update
        resourceCreates.forEach(rc -> ResourceParser.resolveResourceUpdate(collection, rc, availableModels));

        // resource refresh (and get in collection)
        resourceCreates.forEach(rc -> ResourceParser.resolveResourceRefresh(collection, rc));

        // delete in collection
        resourceCreates.forEach(rc -> ResourceParser.resolveResourceDelete(collection, rc));

        // resource actions
        resourceCreates.forEach(rc -> ResourceParser.resourceResourceActions(collection, rc));
    }

    static void processAdditionalMethods(FluentClient fluentClient) {
        fluentClient.getResourceModels().forEach(ResourceParser::processAdditionalProperties);

        fluentClient.getResourceCollections().forEach(ResourceParser::processAdditionalCollectionMethods);
    }

    private static void processAdditionalProperties(FluentResourceModel model) {
        List<MethodTemplate> methods = model.getAdditionalMethods();

        // region() from location()
        if (model.getCategory() != ModelCategory.IMMUTABLE) {
            if (FluentUtils.modelHasLocationProperty(model) && !model.hasProperty("region")) {
                // if resource instance has location property, add region() method
                methods.add(MethodTemplate.builder()
                        .imports(Collections.singletonList(Region.class.getName()))
                        .comment(commentBlock -> {
                            commentBlock.description("Gets the region of the resource.");
                            commentBlock.methodReturns("the region of the resource.");
                        })
                        .methodSignature("Region region()")
                        .method(methodBlock -> {
                            methodBlock.methodReturn("Region.fromName(this.regionName())");
                        })
                        .build());
                methods.add(MethodTemplate.builder()
                        .comment(commentBlock -> {
                            commentBlock.description("Gets the name of the resource region.");
                            commentBlock.methodReturns("the name of the resource region.");
                        })
                        .methodSignature("String regionName()")
                        .method(methodBlock -> {
                            methodBlock.methodReturn("this.location()");
                        })
                        .build());
            }
        }

        // resourceGroupName() from class variable
        if ((model.getCategory() == ModelCategory.RESOURCE_GROUP_AS_PARENT || model.getCategory() == ModelCategory.NESTED_CHILD)
                && model.getResourceCreate() != null
                // here we use class variable "resourceGroupName", and hence we need the FluentConstructorByInner that parses the resource ID to resourceGroupName
                // for a create-only resource, "resourceGroupName" variable would be null, if the resource is retrieved via Get or List from collection
                // alternatively, we can parse resourceGroupName from resource ID in method implementation
                && model.getResourceUpdate() != null
                && !model.hasProperty("resourceGroupName")) {
            UrlPathSegments urlPathSegments = model.getResourceCreate().getUrlPathSegments();
            urlPathSegments.getReverseParameterSegments().stream()
                    .filter(s -> s.getType() == UrlPathSegments.ParameterSegmentType.RESOURCE_GROUP)
                    .findFirst().ifPresent(segment -> {
                        ResourceLocalVariables localVariables = model.getResourceCreate().getResourceLocalVariables();

                        Map<String, MethodParameter> pathParametersMap = model.getResourceCreate().getPathParameters().stream()
                                .collect(Collectors.toMap(p -> p.getClientMethodParameter().getName(), Function.identity()));
                        localVariables.getLocalVariablesMap().entrySet().stream()
                                .filter(e -> e.getKey().getClientType() == ClassType.STRING)
                                // match url path segment to method parameter to local variable
                                .filter(e -> {
                                    MethodParameter pathParameter = pathParametersMap.get(e.getKey().getName());
                                    return pathParameter != null && pathParameter.getProxyMethodParameter() != null
                                            && segment.getParameterName().equalsIgnoreCase(pathParameter.getSerializedName());
                                })
                                .map(Map.Entry::getValue)
                                .findFirst().ifPresent(var -> {
                                    methods.add(MethodTemplate.builder()
                                            .comment(commentBlock -> {
                                                commentBlock.description("Gets the name of the resource group.");
                                                commentBlock.methodReturns("the name of the resource group.");
                                            })
                                            .methodSignature("String resourceGroupName()")
                                            .method(methodBlock -> methodBlock.methodReturn(var.getName()))
                                            .build());
                                });
                    });
        }
    }

    private static void processAdditionalCollectionMethods(FluentResourceCollection collection) {
        // getById method
        collection.getAdditionalMethods().addAll(
                collection.getResourceGets().stream()
                        .flatMap(rg -> rg.getGetByIdCollectionMethods().stream())
                        .collect(Collectors.toList()));

        // deleteById method
        collection.getAdditionalMethods().addAll(
                collection.getResourceDeletes().stream()
                        .flatMap(rg -> rg.getDeleteByIdCollectionMethods().stream())
                        .collect(Collectors.toList()));
    }

    static List<ResourceCreate> resolveResourceCreate(
            FluentResourceCollection collection,
            List<FluentResourceModel> availableFluentModels,
            List<ClientModel> availableModels) {

        List<ModelCategory> categories = Arrays.asList(
                ModelCategory.RESOURCE_GROUP_AS_PARENT,
                ModelCategory.SUBSCRIPTION_AS_PARENT,
                ModelCategory.NESTED_CHILD,
                ModelCategory.SCOPE_AS_PARENT,
                ModelCategory.SCOPE_NESTED_CHILD);

        return resolveResourceCreate(collection, availableFluentModels, availableModels, categories);
    }

    // for unit test purpose
    static List<ResourceCreate> resolveResourceCreate(
            FluentResourceCollection collection,
            List<FluentResourceModel> availableFluentModels,
            List<ClientModel> availableModels,
            List<ModelCategory> categories) {

        // reference https://github.com/Azure/azure-resource-manager-rpc/blob/master/v1.0/resource-api-reference.md

        Map<String, FluentResourceModel> fluentModelMapByName = availableFluentModels.stream()
                .collect(Collectors.toMap(m -> m.getInterfaceType().toString(), Function.identity()));

        List<ResourceCreate> supportsCreateList = new ArrayList<>();
        Set<FluentResourceModel> foundModels = new HashSet<>();

        for (ModelCategory category : categories) {
            Map<FluentResourceModel, ResourceCreate> modelResourceCreateMap =
                    findResourceCreateForCategory(collection, fluentModelMapByName, availableModels, foundModels, category);

            foundModels.addAll(modelResourceCreateMap.keySet());

            for (Map.Entry<FluentResourceModel, ResourceCreate> entry : modelResourceCreateMap.entrySet()) {
                FluentResourceModel fluentModel = entry.getKey();
                ResourceCreate resourceCreate = entry.getValue();

                fluentModel.setCategory(category);
                fluentModel.setResourceCreate(resourceCreate);
                collection.getResourceCreates().add(resourceCreate);

                supportsCreateList.add(resourceCreate);

                LOGGER.info("Fluent model '{}' as category {}", fluentModel.getName(), category);
            }
        }

        supportsCreateList.forEach(rc -> {
            rc.getMethodReferences().addAll(collectMethodReferences(collection, rc.getMethodName()));
        });

        return supportsCreateList;
    }

    static Optional<ResourceUpdate> resolveResourceUpdate(
            FluentResourceCollection collection,
            ResourceCreate resourceCreate,
            List<ClientModel> availableModels) {

        ResourceUpdate resourceUpdate = null;

        Predicate<String> nameMatcher = name -> !(name.contains("create") && !name.contains("update"));
        // PATCH takes priority
        FluentCollectionMethod method = findCollectionMethod(collection, resourceCreate, HttpMethod.PATCH, nameMatcher);
        if (method == null) {
            // fallback to PUT
            method = findCollectionMethod(collection, resourceCreate, HttpMethod.PUT, nameMatcher);
        }
        if (method != null) {
            ClientModel bodyClientModel = getBodyClientModel(method, availableModels);
            if (bodyClientModel == null) {
                LOGGER.warn("client model not found for collection '{}', method '{}'", collection.getInterfaceType().getName(), method.getInnerClientMethod().getName());
            } else {
                resourceUpdate = new ResourceUpdate(resourceCreate.getResourceModel(), collection,
                        resourceCreate.getUrlPathSegments(), method.getInnerClientMethod().getName(),
                        bodyClientModel);

                resourceCreate.getResourceModel().setResourceUpdate(resourceUpdate);
                collection.getResourceUpdates().add(resourceUpdate);

                resourceUpdate.getMethodReferences().addAll(collectMethodReferences(collection, resourceUpdate.getMethodName()));
            }
        }

        return Optional.ofNullable(resourceUpdate);
    }

    static Optional<ResourceRefresh> resolveResourceRefresh(
            FluentResourceCollection collection,
            ResourceCreate resourceCreate) {

        ResourceRefresh resourceRefresh = null;

        FluentCollectionMethod method = findCollectionMethod(collection, resourceCreate, HttpMethod.GET, name -> name.contains("get"));
        if (method != null) {
            resourceRefresh = new ResourceRefresh(resourceCreate.getResourceModel(), collection,
                    resourceCreate.getUrlPathSegments(), method.getInnerClientMethod().getName());

            resourceCreate.getResourceModel().setResourceRefresh(resourceRefresh);
            collection.getResourceGets().add(resourceRefresh);

            resourceRefresh.getMethodReferences().addAll(collectMethodReferences(collection, resourceRefresh.getMethodName()));
        }

        return Optional.ofNullable(resourceRefresh);
    }

    static Optional<ResourceDelete> resolveResourceDelete(
            FluentResourceCollection collection,
            ResourceCreate resourceCreate) {

        ResourceDelete resourceDelete = null;

        FluentCollectionMethod method = findCollectionMethod(collection, resourceCreate, HttpMethod.DELETE, name -> name.contains("delete"));
        if (method != null) {
            resourceDelete = new ResourceDelete(resourceCreate.getResourceModel(), collection,
                    resourceCreate.getUrlPathSegments(), method.getInnerClientMethod().getName());

            collection.getResourceDeletes().add(resourceDelete);

            resourceDelete.getMethodReferences().addAll(collectMethodReferences(collection, resourceDelete.getMethodName()));
        }

        return Optional.ofNullable(resourceDelete);
    }

    static Optional<ResourceActions> resourceResourceActions(
            FluentResourceCollection collection,
            ResourceCreate resourceCreate) {

        // reference https://github.com/Azure/azure-resource-manager-rpc/blob/master/v1.0/proxy-api-reference.md#resource-action-requests

        ResourceActions resourceActions = null;
        List<FluentCollectionMethod> actionMethods = new ArrayList<>();

        for (FluentCollectionMethod method : collection.getMethods()) {
            HttpMethod httpMethod = method.getInnerProxyMethod().getHttpMethod();
            // POST
            if (httpMethod == HttpMethod.POST) {
                String url = method.getInnerProxyMethod().getUrlPath();
                // except last literal segment, same url as create
                if (url.startsWith(resourceCreate.getUrlPathSegments().getPath())
                        && url.substring(0, url.lastIndexOf("/")).equals(resourceCreate.getUrlPathSegments().getPath())
                        && !new UrlPathSegments(url).getReverseSegments().iterator().next().isParameterSegment()) {
                    // parameter from request body
                    if (method.getInnerProxyMethod().getParameters().stream()
                            .allMatch(p -> p.isFromClient()
                                    || !p.isRequired()
                                    || (p.getRequestParameterLocation() == RequestParameterLocation.QUERY && p.isConstant())     // usually 'api-version' query parameter
                                    || (p.getRequestParameterLocation() == RequestParameterLocation.HEADER && p.isConstant())    // usually 'accept' header
                                    || p.getRequestParameterLocation() == RequestParameterLocation.PATH
                                    || p.getRequestParameterLocation() == RequestParameterLocation.BODY)) {
                        actionMethods.add(method);
                    }
                }
            }
        }

        if (!actionMethods.isEmpty()) {
            resourceActions = new ResourceActions(resourceCreate.getResourceModel(), collection, actionMethods);

            resourceCreate.getResourceModel().setResourceActions(resourceActions);
        }

        return Optional.ofNullable(resourceActions);
    }

    static Map<FluentResourceModel, ResourceCreate> findResourceCreateForCategory(
            FluentResourceCollection collection,
            Map<String, FluentResourceModel> fluentModelMapByName,
            List<ClientModel> availableModels,
            Set<FluentResourceModel> excludeModels,
            ModelCategory category) {

        Map<FluentResourceModel, ResourceCreate> foundModels = new LinkedHashMap<>();

        collection.getMethods().forEach(m -> {
            HttpMethod method = m.getInnerProxyMethod().getHttpMethod();

            // PUT
            if (method == HttpMethod.PUT) {
                // not only "update", usually "createOrUpdate" or "create", sometimes "put"
                String methodNameLowerCase = m.getInnerClientMethod().getName().toLowerCase(Locale.ROOT);
                if (!(methodNameLowerCase.contains("update") && !methodNameLowerCase.contains("create"))) {
                    // body in request
                    if (m.getInnerProxyMethod().getParameters().stream().anyMatch(p -> p.getRequestParameterLocation() == RequestParameterLocation.BODY)) {
                        String returnTypeName = m.getFluentReturnType().toString();
                        FluentResourceModel fluentModel = fluentModelMapByName.get(returnTypeName);
                        // at present, cannot handle derived models
                        if (fluentModel != null && fluentModel.getInnerModel().getDerivedModels().isEmpty()) {
                            // "id", "name", "type" in resource instance
                            if (fluentModel != null && fluentModel.getResourceCreate() == null
                                    && !foundModels.containsKey(fluentModel) && !excludeModels.contains(fluentModel)
                                    && fluentModel.hasProperty(ResourceTypeName.FIELD_ID)
                                    && fluentModel.hasProperty(ResourceTypeName.FIELD_NAME)
                                    && fluentModel.hasProperty(ResourceTypeName.FIELD_TYPE)) {
                                String url = m.getInnerProxyMethod().getUrlPath();
                                UrlPathSegments urlPathSegments = new UrlPathSegments(url);

                                //logger.info("Candidate fluent model '{}', hasSubscription '{}', hasResourceGroup '{}', isNested '{}', method name '{}'", fluentModel.getName(), urlPathSegments.hasSubscription(), urlPathSegments.hasResourceGroup(), urlPathSegments.isNested(), m.getInnerClientMethod().getName());

                                // has "subscriptions" segment, and last segment should be resource name
                                if (!urlPathSegments.getReverseSegments().isEmpty() && urlPathSegments.getReverseSegments().iterator().next().isParameterSegment()) {

                                    // requires named parameters in URL
                                    boolean urlParameterSegmentsNamed = urlPathSegments.getReverseParameterSegments().stream()
                                            .noneMatch(s -> CoreUtils.isNullOrEmpty(s.getSegmentName()));

                                    boolean categoryMatch = false;
                                    if (urlParameterSegmentsNamed && urlPathSegments.hasSubscription()) {
                                        switch (category) {
                                            case RESOURCE_GROUP_AS_PARENT:
                                                if (urlPathSegments.hasResourceGroup() && !urlPathSegments.isNested()) {
                                                    categoryMatch = true;
                                                }
                                                break;

                                            case SUBSCRIPTION_AS_PARENT:
                                                if (!urlPathSegments.hasResourceGroup() && !urlPathSegments.isNested()) {
                                                    categoryMatch = true;
                                                }
                                                break;

                                            case NESTED_CHILD:
                                                if (urlPathSegments.isNested()) {
                                                    categoryMatch = true;
                                                }
                                                break;
                                        }
                                    }
                                    if (!categoryMatch && (category == ModelCategory.SCOPE_AS_PARENT || category == ModelCategory.SCOPE_NESTED_CHILD)) {
                                        // check for scope, required named parameters except scope
                                        boolean urlParameterSegmentsNamedExceptScope = urlPathSegments.getReverseParameterSegments().stream()
                                                .noneMatch(s -> s.getType() != UrlPathSegments.ParameterSegmentType.SCOPE && CoreUtils.isNullOrEmpty(s.getSegmentName()));

                                        if (urlParameterSegmentsNamedExceptScope && urlPathSegments.hasScope()
                                                && !urlPathSegments.hasSubscription() && !urlPathSegments.hasResourceGroup()) {
                                            switch (category) {
                                                case SCOPE_AS_PARENT:
                                                    if (!urlPathSegments.isNested()) {
                                                        categoryMatch = true;
                                                    }
                                                    break;

                                                case SCOPE_NESTED_CHILD:
                                                    if (urlPathSegments.isNested()) {
                                                        categoryMatch = true;
                                                    }
                                                    break;
                                            }
                                        }
                                    }

                                    if (categoryMatch) {
                                        ClientModel bodyClientModel = getBodyClientModel(m, availableModels);
                                        if (bodyClientModel == null) {
                                            LOGGER.warn("client model not found for collection '{}', method '{}'", collection.getInterfaceType().getName(), m.getInnerClientMethod().getName());
                                        } else {
                                            ResourceCreate resourceCreate = new ResourceCreate(fluentModel, collection, urlPathSegments,
                                                    m.getInnerClientMethod().getName(), bodyClientModel);

                                            foundModels.put(fluentModel, resourceCreate);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return foundModels;
    }

    private static ClientModel getBodyClientModel(FluentCollectionMethod method, List<ClientModel> availableModels) {
        Optional<String> bodyTypeNameOpt = method.getInnerClientMethod().getProxyMethod().getParameters()
                .stream()
                .filter(p -> p.getRequestParameterLocation() == RequestParameterLocation.BODY)
                .map(p -> p.getClientType().toString())
                .findAny();

        if (!bodyTypeNameOpt.isPresent()) {
            throw new IllegalStateException("Body type not found for method " + method.getInnerClientMethod().getName());
        }

        Optional<ClientModel> clientModelOpt = availableModels.stream()
                .filter(model -> model.getName().equals(bodyTypeNameOpt.get()))
                .findAny();

        if (!clientModelOpt.isPresent()) {
            LOGGER.warn("Client model not found for type name '{}', method '{}'", bodyTypeNameOpt.get(), method.getInnerClientMethod().getName());
        }
        return clientModelOpt.orElse(null);
    }

    private static FluentCollectionMethod findCollectionMethod(FluentResourceCollection collection,
                                                               ResourceCreate resourceCreate,
                                                               HttpMethod matchingMethod, Predicate<String> nameMatcher) {
        boolean isGetOrDelete = matchingMethod == HttpMethod.GET || matchingMethod == HttpMethod.DELETE;
        boolean isDelete = matchingMethod == HttpMethod.DELETE;

        for (FluentCollectionMethod method : collection.getMethods()) {
            HttpMethod httpMethod = method.getInnerProxyMethod().getHttpMethod();
            // match http method
            if (httpMethod == matchingMethod) {
                String methodNameLowerCase = method.getInnerClientMethod().getName().toLowerCase(Locale.ROOT);
                // match name
                if (nameMatcher.test(methodNameLowerCase)) {
                    String returnTypeName = method.getFluentReturnType().toString();
                    // same model as create
                    if (isDelete || returnTypeName.equals(resourceCreate.getResourceModel().getInterfaceType().getName())) {
                        String url = method.getInnerProxyMethod().getUrlPath();
                        // same url as create
                        if (url.equals(resourceCreate.getUrlPathSegments().getPath())) {
                            boolean hasBodyParam = methodHasBodyParameter(method);
                            boolean hasRequiredQueryParam = method.getInnerProxyMethod().getParameters().stream()
                                    .anyMatch(p -> p.getRequestParameterLocation() == RequestParameterLocation.QUERY
                                            && p.isRequired()
                                            && !p.isFromClient() && !p.isConstant());
                            boolean hasNewNonConstantPathParam = method.getInnerProxyMethod().getParameters().stream()
                                    .anyMatch(p -> p.getRequestParameterLocation() == RequestParameterLocation.PATH
                                            && !p.isConstant() && !p.isFromClient()
                                            && resourceCreate.getMethodReferences().stream().allMatch(
                                                    m -> m.getInnerProxyMethod().getParameters().stream().anyMatch(
                                                            p1 -> p1.getRequestParameterLocation() == RequestParameterLocation.PATH
                                                                    && p1.getRequestParameterName().equals(p.getRequestParameterName())
                                                                    && p1.isConstant() && !p1.isFromClient())));
                            // if for update, need a body parameter
                            // if for get or delete, do not allow required query parameter (that not from client, and not constant), since it cannot be deduced from resource id
                            if ((isGetOrDelete && !hasRequiredQueryParam && !hasNewNonConstantPathParam)
                                    || (!isGetOrDelete && hasBodyParam)) {
                                return method;
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    private static List<FluentCollectionMethod> collectMethodReferences(FluentResourceCollection collection, String methodName) {
        // The matching method could already contain the postfix, so we need to create both the WithResponse and
        // non-WithResponse matches.
        String nonWithResponseMatch;
        String withResponseMatch;
        if (methodName.endsWith(Utils.METHOD_POSTFIX_WITH_RESPONSE)) {
            withResponseMatch = methodName;
            nonWithResponseMatch = methodName.substring(0, methodName.length() - Utils.METHOD_POSTFIX_WITH_RESPONSE.length());
        } else {
            nonWithResponseMatch = methodName;
            withResponseMatch = methodName + Utils.METHOD_POSTFIX_WITH_RESPONSE;
        }

        List<FluentCollectionMethod> collectionMethods = new ArrayList<>();
        for (FluentCollectionMethod fluentMethod : collection.getMethods()) {
            ClientMethod innerMethod = fluentMethod.getInnerClientMethod();
            String innerName = innerMethod.getName();
            HttpMethod httpMethod = fluentMethod.getInnerProxyMethod().getHttpMethod();

            // Check for the method name matching the non-WithResponse match or the method being a WithResponse method
            // and matching the WithResponse match.
            if (!innerName.equals(nonWithResponseMatch)
                && !(innerMethod.getType() == ClientMethodType.SimpleSyncRestResponse && innerName.equals(withResponseMatch))) {
                continue;
            }

            // Check for the HTTP method being either GET or DELETE and the method having a body parameter.
            if (httpMethod != HttpMethod.GET && httpMethod != HttpMethod.DELETE && !methodHasBodyParameter(fluentMethod)) {
                continue;
            }

            collectionMethods.add(fluentMethod);
        }

        return collectionMethods;
    }

    private static boolean methodHasBodyParameter(FluentCollectionMethod method) {
        // Previous it filtered on isClientModel but filter on parameter location as that's the cheaper check.
        return method.getInnerProxyMethod().getParameters().stream()
            .filter(p -> p.getRequestParameterLocation() == RequestParameterLocation.BODY)
            .anyMatch(p -> ClientModelUtil.isClientModel(p.getClientType()));
    }
}
