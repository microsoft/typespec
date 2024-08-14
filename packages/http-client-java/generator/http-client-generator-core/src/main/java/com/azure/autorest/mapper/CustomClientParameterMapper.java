// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.mapper;

import com.azure.autorest.extension.base.model.codemodel.AnySchema;
import com.azure.autorest.extension.base.model.codemodel.ArraySchema;
import com.azure.autorest.extension.base.model.codemodel.ConstantSchema;
import com.azure.autorest.extension.base.model.codemodel.Parameter;
import com.azure.autorest.model.clientmodel.ClassType;
import com.azure.autorest.model.clientmodel.ClientMethodParameter;
import com.azure.autorest.model.clientmodel.IType;
import com.azure.autorest.util.CodeNamer;
import com.azure.autorest.util.MethodUtil;
import com.azure.autorest.util.SchemaUtil;

import java.util.ArrayList;

public class CustomClientParameterMapper implements IMapper<Parameter, ClientMethodParameter> {

    private static final CustomClientParameterMapper INSTANCE = new CustomClientParameterMapper();

    private CustomClientParameterMapper() {
    }

    public static CustomClientParameterMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public ClientMethodParameter map(Parameter parameter) {
        return map(parameter, false);
    }

    public ClientMethodParameter map(Parameter parameter, boolean isProtocolMethod) {
        String name = parameter.getOriginalParameter() != null && parameter.getLanguage().getJava().getName().equals(parameter.getOriginalParameter().getLanguage().getJava().getName())
                ? CodeNamer.toCamelCase(parameter.getOriginalParameter().getSchema().getLanguage().getJava().getName()) + CodeNamer.toPascalCase(parameter.getLanguage().getJava().getName())
                : parameter.getLanguage().getJava().getName();

        ClientMethodParameter.Builder builder = new ClientMethodParameter.Builder()
                .name(name)
                .required(parameter.isRequired())
                .fromClient(parameter.getImplementation() == Parameter.ImplementationLocation.CLIENT);

        IType wireType = Mappers.getSchemaMapper().map(parameter.getSchema());
        if (parameter.getSchema() instanceof ArraySchema) {
            ArraySchema arraySchema = (ArraySchema) parameter.getSchema();
            if (arraySchema.getElementType() instanceof AnySchema) {
                wireType = ClassType.JSON_PATCH_DOCUMENT;
            }
        }

        if (isProtocolMethod) {
            wireType = SchemaUtil.removeModelFromParameter(parameter.getProtocol().getHttp().getIn(), wireType);
        }

        if (parameter.isNullable() || !parameter.isRequired()) {
            wireType = wireType.asNullable();
        }
        builder.wireType(wireType);

        builder.annotations(new ArrayList<>());

        boolean isConstant = false;
        String defaultValue = null;
        if (parameter.getSchema() instanceof ConstantSchema) {
            isConstant = true;
            Object objValue = ((ConstantSchema) parameter.getSchema()).getValue().getValue();
            defaultValue = objValue == null ? null : String.valueOf(objValue);
        }
        builder.constant(isConstant).defaultValue(defaultValue);

        builder.description(MethodUtil.getMethodParameterDescription(parameter, name, isProtocolMethod));

        return builder.build();
    }
}
