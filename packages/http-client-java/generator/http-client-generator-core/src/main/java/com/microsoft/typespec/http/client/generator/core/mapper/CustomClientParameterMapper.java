// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.AnySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
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
        final String name = getParameterName(parameter);

        ClientMethodParameter.Builder builder = new ClientMethodParameter.Builder().name(name)
            .required(parameter.isRequired())
            .fromClient(parameter.getImplementation() == Parameter.ImplementationLocation.CLIENT)
            .annotations(new ArrayList<>());

        IType wireType;
        if (isJsonPatchDocument(parameter.getSchema())) {
            wireType = ClassType.JSON_PATCH_DOCUMENT;
        } else {
            wireType = Mappers.getSchemaMapper().map(parameter.getSchema());
        }
        if (isProtocolMethod) {
            wireType = SchemaUtil.removeModelFromParameter(parameter.getProtocol().getHttp().getIn(), wireType);
        }
        if (parameter.isNullable() || !parameter.isRequired()) {
            builder.wireType(wireType.asNullable());
        } else {
            builder.wireType(wireType);
        }

        if (parameter.isConstant()) {
            builder.constant(true);
            final Object constValue = ((ConstantSchema) parameter.getSchema()).getValue().getValue();
            if (constValue != null) {
                builder.defaultValue(String.valueOf(constValue));
            }
        }

        builder.description(MethodUtil.getMethodParameterDescription(parameter, name, isProtocolMethod));

        return builder.build();
    }

    private static String getParameterName(Parameter parameter) {
        final String parameterName = parameter.getLanguage().getJava().getName();
        final Parameter originalParameter = parameter.getOriginalParameter();
        if (originalParameter == null) {
            return parameterName;
        }
        if (parameterName.equals(originalParameter.getLanguage().getJava().getName())) {
            final String originalParameterSchemaName = originalParameter.getSchema().getLanguage().getJava().getName();
            return CodeNamer.toCamelCase(originalParameterSchemaName) + CodeNamer.toPascalCase(parameterName);
        }
        return parameterName;
    }

    private static boolean isJsonPatchDocument(Schema schema) {
        if (schema instanceof ArraySchema) {
            final ArraySchema arraySchema = (ArraySchema) schema;
            return arraySchema.getElementType() instanceof AnySchema;
        }
        return false;
    }
}
