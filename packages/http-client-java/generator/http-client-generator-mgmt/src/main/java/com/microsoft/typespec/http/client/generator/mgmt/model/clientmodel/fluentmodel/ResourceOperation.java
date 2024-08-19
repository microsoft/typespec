// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.ResourceTypeName;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.UrlPathSegments;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentModelProperty;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelProperty;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.azure.core.util.CoreUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

public abstract class ResourceOperation {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), ResourceOperation.class);

    protected final FluentResourceModel resourceModel;
    protected final FluentResourceCollection resourceCollection;

    protected final UrlPathSegments urlPathSegments;

    protected final String methodName;

    protected final ClientModel requestBodyParameterModel;

    protected final List<FluentCollectionMethod> methodReferences = new ArrayList<>();

    public ResourceOperation(FluentResourceModel resourceModel, FluentResourceCollection resourceCollection,
                             UrlPathSegments urlPathSegments, String methodName, ClientModel requestBodyParameterModel) {
        this.resourceModel = resourceModel;
        this.resourceCollection = resourceCollection;
        this.urlPathSegments = urlPathSegments;
        this.methodName = methodName;
        this.requestBodyParameterModel = requestBodyParameterModel;
    }

    public FluentResourceModel getResourceModel() {
        return resourceModel;
    }

    public FluentResourceCollection getResourceCollection() {
        return resourceCollection;
    }

    public UrlPathSegments getUrlPathSegments() {
        return urlPathSegments;
    }

    public String getMethodName() {
        return methodName;
    }

    public List<FluentCollectionMethod> getMethodReferences() {
        return methodReferences;
    }

    public ClientModel getRequestBodyParameterModel() {
        return requestBodyParameterModel;
    }

    abstract public List<FluentMethod> getFluentMethods();

    abstract public String getLocalVariablePrefix();

    // properties on model inner object, or request body model
    protected List<ModelProperty> getProperties() {
        List<ModelProperty> properties = new ArrayList<>();

        List<String> commonPropertyNames = Arrays.asList(ResourceTypeName.FIELD_LOCATION, ResourceTypeName.FIELD_TAGS);

        if (this.isBodyParameterSameAsFluentModel()) {
            for (String commonPropertyName : commonPropertyNames) {
                if (resourceModel.hasProperty(commonPropertyName)) {
                    FluentModelProperty property = resourceModel.getProperty(commonPropertyName);
                    properties.add(property.getModelProperty());
                }
            }
            for (FluentModelProperty property : resourceModel.getProperties()) {
                if (!commonPropertyNames.contains(property.getName())) {
                    properties.add(property.getModelProperty());
                }
            }
        } else {
            Map<String, ModelProperty> propertyMap = this.getRequestBodyModelPropertiesMap();
            for (String commonPropertyName : commonPropertyNames) {
                if (propertyMap.containsKey(commonPropertyName)) {
                    ModelProperty property = propertyMap.get(commonPropertyName);
                    properties.add(property);
                }
            }
            for (ModelProperty property : this.getRequestBodyModelProperties()) {
                if (!commonPropertyNames.contains(property.getName())) {
                    properties.add(property);
                }
            }
        }

        return properties.stream()
                .filter(p -> !p.isReadOnly() && !p.isConstant())
                .collect(Collectors.toList());
    }

    // method parameters
    private List<MethodParameter> getParametersByLocation(RequestParameterLocation parameterLocation) {
        return getParametersByLocation(new HashSet<>(Collections.singletonList(parameterLocation)));
    }

    private List<MethodParameter> getParametersByLocation(Set<RequestParameterLocation> parameterLocations) {
        ClientMethod clientMethod = getMethodReferencesOfFullParameters().iterator().next().getInnerClientMethod();
        Map<String, ProxyMethodParameter> proxyMethodParameterByClientParameterName = clientMethod.getProxyMethod().getParameters().stream()
                .filter(p -> parameterLocations.contains(p.getRequestParameterLocation()))
                .collect(Collectors.toMap(p -> CodeNamer.getEscapedReservedClientMethodParameterName(p.getName()), Function.identity()));
        return clientMethod.getMethodParameters().stream()
                .filter(p -> proxyMethodParameterByClientParameterName.containsKey(p.getName()))
                .map(p -> new MethodParameter(proxyMethodParameterByClientParameterName.get(p.getName()), p))
                .collect(Collectors.toList());
    }

    public ClientMethodParameter getBodyParameter() {
        List<MethodParameter> parameters = getParametersByLocation(RequestParameterLocation.BODY);
        return parameters.isEmpty() ? null : parameters.iterator().next().getClientMethodParameter();
    }

    public List<MethodParameter> getPathParameters() {
        return getParametersByLocation(RequestParameterLocation.PATH);
    }

    public List<ClientMethodParameter> getMiscParameters() {
        // header or query
        return getParametersByLocation(new HashSet<>(Arrays.asList(RequestParameterLocation.HEADER, RequestParameterLocation.QUERY)))
                .stream().map(MethodParameter::getClientMethodParameter).collect(Collectors.toList());
    }

    public Collection<LocalVariable> getLocalVariables() {
        return this.getResourceLocalVariables().getLocalVariablesMap().values();
    }

    protected List<FluentCollectionMethod> getMethodReferencesOfFullParameters() {
        // method references of full parameters (include optional parameters)
        return this.getMethodReferences().stream()
                .filter(m -> !m.getInnerClientMethod().getOnlyRequiredParameters())
                .collect(Collectors.toList());
    }

    protected Optional<FluentCollectionMethod> findMethod(boolean hasContextParameter, List<ClientMethodParameter> parameters) {
        Optional<FluentCollectionMethod> methodOpt = this.getMethodReferencesOfFullParameters().stream()
                .filter(m -> hasContextParameter
                        ? m.getInnerClientMethod().getParameters().stream().anyMatch(FluentUtils::isContextParameter)
                        : m.getInnerClientMethod().getParameters().stream().noneMatch(FluentUtils::isContextParameter))
                .findFirst();
        if (methodOpt.isPresent() && hasContextParameter) {
            ClientMethodParameter contextParameter = methodOpt.get()
                    .getInnerClientMethod().getParameters().stream()
                    .filter(FluentUtils::isContextParameter)
                    .findFirst().get();
            parameters.add(contextParameter);
        }
        return methodOpt;
    }

    // local variables
    private ResourceLocalVariables resourceLocalVariables;

    public ResourceLocalVariables getResourceLocalVariables() {
        if (resourceLocalVariables == null) {
            resourceLocalVariables = new ResourceLocalVariables(this);
        }
        return resourceLocalVariables;
    }

    protected LocalVariable getLocalVariableByMethodParameter(ClientMethodParameter methodParameter) {
        return this.getResourceLocalVariables().getLocalVariablesMap().get(methodParameter);
    }

    // request body model and properties, used when request body is not fluent model inner object
    private Map<String, ModelProperty> requestBodyModelPropertiesMap;
    private List<ModelProperty> requestBodyModelProperties;

    protected boolean isBodyParameterSameAsFluentModel() {
        return requestBodyParameterModel == resourceModel.getInnerModel();
    }

    private void initRequestBodyClientModel() {
        if (requestBodyModelPropertiesMap == null) {
            requestBodyModelPropertiesMap = new LinkedHashMap<>();
            requestBodyModelProperties = new ArrayList<>();

            List<ClientModel> parentModels = new ArrayList<>();
            String parentModelName = requestBodyParameterModel.getParentModelName();
            while (!CoreUtils.isNullOrEmpty(parentModelName)) {
                ClientModel parentModel = FluentUtils.getClientModel(parentModelName);
                if (parentModel != null) {
                    parentModels.add(parentModel);
                }
                parentModelName = parentModel == null ? null :parentModel.getParentModelName();
            }

            List<List<ModelProperty>> propertiesFromTypeAndParents = new ArrayList<>();
            propertiesFromTypeAndParents.add(new ArrayList<>());
            requestBodyParameterModel.getAccessibleProperties().forEach(p -> {
                ModelProperty property = ModelProperty.ofClientModelProperty(p);
                if (requestBodyModelPropertiesMap.putIfAbsent(property.getName(), property) == null) {
                    propertiesFromTypeAndParents.get(propertiesFromTypeAndParents.size() - 1).add(property);
                }
            });

            for (ClientModel parent : parentModels) {
                propertiesFromTypeAndParents.add(new ArrayList<>());

                parent.getAccessibleProperties().forEach(p -> {
                    ModelProperty property = ModelProperty.ofClientModelProperty(p);
                    if (requestBodyModelPropertiesMap.putIfAbsent(property.getName(), property) == null) {
                        propertiesFromTypeAndParents.get(propertiesFromTypeAndParents.size() - 1).add(property);
                    }
                });
            }

            Collections.reverse(propertiesFromTypeAndParents);
            for (List<ModelProperty> properties1 : propertiesFromTypeAndParents) {
                requestBodyModelProperties.addAll(properties1);
            }
        }
    }

    private List<ModelProperty> getRequestBodyModelProperties() {
        initRequestBodyClientModel();
        return this.requestBodyModelProperties;
    }

    private Map<String, ModelProperty> getRequestBodyModelPropertiesMap() {
        initRequestBodyClientModel();
        return this.requestBodyModelPropertiesMap;
    }

    protected boolean isIdProperty(ModelProperty property) {
        return property.getName().equals(ResourceTypeName.FIELD_ID);
    }

    protected boolean isLocationProperty(ModelProperty property) {
        return FluentUtils.modelHasLocationProperty(resourceModel) && property.getName().equals(ResourceTypeName.FIELD_LOCATION);
    }

    protected boolean hasConflictingMethod(String name) {
        return resourceCollection.getMethods().stream()
                .anyMatch(m -> name.equals(m.getInnerClientMethod().getName()));
    }
}
