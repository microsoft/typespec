// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method;

import com.microsoft.typespec.http.client.generator.mgmt.model.arm.UrlPathSegments;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceLocalVariables;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class FluentConstructorByInner extends FluentMethod {

    private final List<MethodParameter> pathParameters;
    private final ClassType managerType;

    public FluentConstructorByInner(FluentResourceModel model, FluentMethodType type,
                                    List<MethodParameter> pathParameters, ResourceLocalVariables resourceLocalVariables,
                                    ClassType managerType, UrlPathSegments urlPathSegments) {
        super(model, type);

        this.pathParameters = pathParameters;
        this.managerType = managerType;

        this.implementationReturnValue = new ReturnValue("", model.getImplementationType());

        this.implementationMethodTemplate = MethodTemplate.builder()
                .visibility(JavaVisibility.PackagePrivate)
                .methodSignature(this.getImplementationMethodSignature())
                .method(block -> {
                    block.line(String.format("this.%1$s = %2$s;", ModelNaming.MODEL_PROPERTY_INNER, ModelNaming.MODEL_PROPERTY_INNER));
                    block.line(String.format("this.%1$s = %2$s;", ModelNaming.MODEL_PROPERTY_MANAGER, ModelNaming.MODEL_PROPERTY_MANAGER));

                    List<UrlPathSegments.ParameterSegment> segments = urlPathSegments.getReverseParameterSegments();
                    Collections.reverse(segments);
                    Map<String, String> urlSegmentNameByParameterName = urlPathSegments.getReverseParameterSegments().stream()
                            .collect(Collectors.toMap(UrlPathSegments.ParameterSegment::getParameterName, UrlPathSegments.ParameterSegment::getSegmentName));

                    // init from resource id
                    pathParameters.forEach(p -> {
                        String valueFromIdText;
                        if (urlPathSegments.hasScope()) {
                            valueFromIdText = String.format("%1$s.getValueFromIdByParameterName(%2$s.id(), \"%3$s\", \"%4$s\")",
                                    ModelNaming.CLASS_RESOURCE_MANAGER_UTILS, ModelNaming.MODEL_PROPERTY_INNER, urlPathSegments.getPath(), p.getSerializedName());
                        } else {
                            valueFromIdText = String.format("%1$s.getValueFromIdByName(%2$s.id(), \"%3$s\")",
                                    ModelNaming.CLASS_RESOURCE_MANAGER_UTILS, ModelNaming.MODEL_PROPERTY_INNER, urlSegmentNameByParameterName.get(p.getSerializedName()));
                        }
                        if (p.getClientMethodParameter().getClientType() != ClassType.STRING) {
                            valueFromIdText = String.format("%1$s.fromString(%2$s)", p.getClientMethodParameter().getClientType().toString(), valueFromIdText);
                        }
                        block.line(String.format("this.%1$s = %2$s;", resourceLocalVariables.getLocalVariableByMethodParameter(p.getClientMethodParameter()).getName(), valueFromIdText));
                    });
                })
                .build();
    }

    @Override
    public String getImplementationMethodSignature() {
        return String.format("%1$s(%2$s %3$s, %4$s %5$s)",
                implementationReturnValue.getType().toString(),
                fluentResourceModel.getInnerModel().getName(), ModelNaming.MODEL_PROPERTY_INNER,
                managerType.getFullName(), ModelNaming.MODEL_PROPERTY_MANAGER);
    }

    @Override
    protected String getBaseMethodSignature() {
        throw new UnsupportedOperationException();
    }

    @Override
    public void writeJavadoc(JavaJavadocComment commentBlock) {
        // NOOP
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        if (includeImplementationImports) {
            pathParameters.forEach(p -> p.getClientMethodParameter().addImportsTo(imports, false));
            /* use full name for FooManager, to avoid naming conflict
            managerType.addImportsTo(imports, false);
             */
        }
    }
}
