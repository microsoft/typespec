package com.microsoft.typespec.http.client.generator.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.mapper.ProxyParameterMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

public class TypeSpecProxyParameterMapper extends ProxyParameterMapper {
    private static final ProxyParameterMapper INSTANCE = new TypeSpecProxyParameterMapper();

    public static ProxyParameterMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected boolean isRemoveModelFromParameter(Parameter parameter, IType type) {
        // if it is typespec and enum type client parameter, do not remove model from parameter
        boolean isEnumType = type instanceof EnumType;
        boolean isClientParameter = Parameter.ImplementationLocation.CLIENT.equals(parameter.getImplementation());
        return super.isRemoveModelFromParameter(parameter, type) && !(isEnumType && isClientParameter);
    }
}
