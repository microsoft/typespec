// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.delete;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.UrlPathSegments;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceOperation;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.CollectionMethodOperationByIdTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;

public class ResourceDelete extends ResourceOperation {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), ResourceDelete.class);

    public ResourceDelete(FluentResourceModel resourceModel, FluentResourceCollection resourceCollection,
        UrlPathSegments urlPathSegments, String methodName) {
        super(resourceModel, resourceCollection, urlPathSegments, methodName, null);

        LOGGER.info("ResourceDelete: Fluent model '{}', method reference '{}'", resourceModel.getName(), methodName);
    }

    @Override
    public List<FluentMethod> getFluentMethods() {
        return Collections.emptyList();
    }

    @Override
    public String getLocalVariablePrefix() {
        return "local";
    }

    public List<MethodTemplate> getDeleteByIdCollectionMethods() {
        List<MethodTemplate> methods = new ArrayList<>();
        List<FluentCollectionMethod> collectionMethods = this.findMethodsWithContext();
        if (!collectionMethods.isEmpty()) {
            FluentCollectionMethod oneCollectionMethod = collectionMethods.iterator().next();

            String name = getDeleteByIdMethodName(oneCollectionMethod.getMethodName());
            if (!hasConflictingMethod(name)) {
                // deleteById without Context
                List<MethodParameter> pathParameters = this.getPathParameters();
                methods.add(new CollectionMethodOperationByIdTemplate(resourceModel, name, pathParameters,
                    urlPathSegments, false, getResourceLocalVariables(), oneCollectionMethod).getMethodTemplate());

                for (FluentCollectionMethod collectionMethod : collectionMethods) {
                    // deleteByIdWithResponse with Context
                    // There can be multiple such methods, due to overload from versioning (optional parameter @added)
                    methods.add(new CollectionMethodOperationByIdTemplate(resourceModel, name, pathParameters,
                        urlPathSegments, true, getResourceLocalVariables(), collectionMethod).getMethodTemplate());
                }
            }
        }
        return methods;
    }

    protected List<FluentCollectionMethod> findMethodsWithContext() {
        return this.getMethodReferencesOfFullParameters()
            .stream()
            .filter(m -> m.getInnerClientMethod().getParameters().stream().anyMatch(FluentUtils::isContextParameter))
            // fluent method implementation calls client interface API, thus we need the method to be public
            .filter(method -> JavaVisibility.Public == method.getInnerClientMethod().getMethodVisibility())
            .collect(Collectors.toList());
    }

    private static String getDeleteByIdMethodName(String methodName) {
        String getByIdMethodName = methodName;
        int indexOfBy = methodName.indexOf("By");
        if (indexOfBy > 0) {
            getByIdMethodName = methodName.substring(0, indexOfBy);
        } else if (methodName.endsWith(Utils.METHOD_POSTFIX_WITH_RESPONSE)) {
            getByIdMethodName
                = methodName.substring(0, methodName.length() - Utils.METHOD_POSTFIX_WITH_RESPONSE.length());
        }
        getByIdMethodName += "ById";
        return getByIdMethodName;
    }
}
