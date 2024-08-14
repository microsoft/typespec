// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Versioning;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;

import java.util.ArrayList;

/**
 * A mapper that maps an {@link Parameter} to a {@link ClientMethodParameter}.
 */
public class ClientParameterMapper implements IMapper<Parameter, ClientMethodParameter> {
    private static final ClientParameterMapper INSTANCE = new ClientParameterMapper();

    private ClientParameterMapper() {
    }

    /**
     * Gets the global {@link ClientParameterMapper} instance.
     *
     * @return The global {@link ClientParameterMapper} instance.
     */
    public static ClientParameterMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public ClientMethodParameter map(Parameter parameter) {
        return map(parameter, JavaSettings.getInstance().isDataPlaneClient());
    }

    /**
     * Maps an {@link Parameter} to a {@link ClientMethodParameter}.
     *
     * @param parameter The {@link Parameter} being mapped.
     * @param isProtocolMethod Whether the parameter is being used in a protocol method.
     * @return The {@link ClientMethodParameter}.
     */
    public ClientMethodParameter map(Parameter parameter, boolean isProtocolMethod) {
        String name = parameter.getOriginalParameter() != null && parameter.getLanguage().getJava().getName().equals(parameter.getOriginalParameter().getLanguage().getJava().getName())
                ? CodeNamer.toCamelCase(parameter.getOriginalParameter().getSchema().getLanguage().getJava().getName()) + CodeNamer.toPascalCase(parameter.getLanguage().getJava().getName())
                : parameter.getLanguage().getJava().getName();
        name = CodeNamer.getEscapedReservedClientMethodParameterName(name);

        ClientMethodParameter.Builder builder = new ClientMethodParameter.Builder()
                .name(name)
                .required(parameter.isRequired())
                .fromClient(parameter.getImplementation() == Parameter.ImplementationLocation.CLIENT);
        if (parameter.getProtocol() != null && parameter.getProtocol().getHttp() != null) {
            builder.requestParameterLocation(parameter.getProtocol().getHttp().getIn());
        }

        IType wireType = Mappers.getSchemaMapper().map(parameter.getSchema());
        if (parameter.isNullable() || !parameter.isRequired()) {
            wireType = wireType.asNullable();
        }
        builder.rawType(wireType);

        if (isProtocolMethod) {
            wireType = SchemaUtil.removeModelFromParameter(parameter.getProtocol().getHttp().getIn(), wireType);
        }

        builder.wireType(wireType)
            .annotations(new ArrayList<>());

        boolean isConstant = false;
        String defaultValue = null;
        if (parameter.getSchema() instanceof ConstantSchema) {
            isConstant = true;
            Object objValue = ((ConstantSchema) parameter.getSchema()).getValue().getValue();
            defaultValue = objValue == null ? null : String.valueOf(objValue);
        }
        builder.constant(isConstant).defaultValue(defaultValue);

        builder.description(MethodUtil.getMethodParameterDescription(parameter, name, isProtocolMethod));

        if (parameter.getExtensions() != null) {
            if (parameter.getExtensions().getXmsVersioningAdded() != null) {
                builder.versioning(new Versioning.Builder()
                        .added(parameter.getExtensions().getXmsVersioningAdded())
                        .build());
            }
        }

        return builder.build();
    }
}
