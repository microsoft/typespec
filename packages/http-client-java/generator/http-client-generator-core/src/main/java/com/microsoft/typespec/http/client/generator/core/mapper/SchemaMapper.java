// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.AnySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.BinarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OrSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.PrimitiveSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SealedChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class SchemaMapper implements IMapper<Schema, IType> {
    private static final SchemaMapper INSTANCE = new SchemaMapper();
    Map<Schema, IType> parsed = new ConcurrentHashMap<>();

    private SchemaMapper() {
    }

    public static SchemaMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public IType map(Schema value) {
        if (value == null) {
            return null;
        }

        IType schemaType = parsed.get(value);
        if (schemaType != null) {
            return schemaType;
        }

        schemaType = createSchemaType(value);
        parsed.put(value, schemaType);

        return schemaType;
    }

    private IType createSchemaType(Schema value) {
        if (value instanceof PrimitiveSchema) {
            return Mappers.getPrimitiveMapper().map((PrimitiveSchema) value);
        } else if (value instanceof ChoiceSchema) {
            return Mappers.getChoiceMapper().map((ChoiceSchema) value);
        } else if (value instanceof SealedChoiceSchema) {
            return Mappers.getSealedChoiceMapper().map((SealedChoiceSchema) value);
        } else if (value instanceof ArraySchema) {
            return Mappers.getArrayMapper().map((ArraySchema) value);
        } else if (value instanceof DictionarySchema) {
            return Mappers.getDictionaryMapper().map((DictionarySchema) value);
        } else if (value instanceof ObjectSchema) {
            return Mappers.getObjectMapper().map((ObjectSchema) value);
        } else if (value instanceof ConstantSchema) {
            return Mappers.getConstantMapper().map((ConstantSchema) value);
        } else if(value instanceof AnySchema) {
            return Mappers.getAnyMapper().map((AnySchema) value);
        } else if(value instanceof BinarySchema) {
            return Mappers.getBinaryMapper().map((BinarySchema) value);
        } else if(value instanceof OrSchema) {
            return Mappers.getUnionMapper().map((OrSchema) value);
        } else {
            throw new UnsupportedOperationException("Cannot find a mapper for schema type " + value.getClass()
                + ". Key: " + value.get$key());
        }
    }
}
