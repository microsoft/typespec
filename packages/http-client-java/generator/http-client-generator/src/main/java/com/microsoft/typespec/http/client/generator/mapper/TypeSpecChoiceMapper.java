package com.microsoft.typespec.http.client.generator.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.mapper.ChoiceMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.MapperUtils;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

public class TypeSpecChoiceMapper extends ChoiceMapper {
    private static TypeSpecChoiceMapper INSTANCE = new TypeSpecChoiceMapper();

    public static TypeSpecChoiceMapper getInstance() {
        return INSTANCE;
    }
    private TypeSpecChoiceMapper() {
    }

    @Override
    public IType map(ChoiceSchema enumType) {
        IType elementType = Mappers.getSchemaMapper().map(enumType.getChoiceType());
        boolean isStringEnum = elementType == ClassType.STRING;
        if (isStringEnum) {
            return MapperUtils.createEnumType(enumType, true, true);
        } else {
            return MapperUtils.createEnumType(enumType, true, true, "getValue", "fromValue", null);
        }
    }
}
