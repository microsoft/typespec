// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ByteArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DateTimeSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DurationSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.NumberSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.PrimitiveSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;

import java.util.HashMap;
import java.util.Map;

public class PrimitiveMapper implements IMapper<PrimitiveSchema, IType> {
  private static final PrimitiveMapper INSTANCE = new PrimitiveMapper();
  protected Map<PrimitiveSchema, IType> parsed = new HashMap<>();

  protected PrimitiveMapper() {
  }

  public static PrimitiveMapper getInstance() {
    return INSTANCE;
  }

  @Override
  public IType map(PrimitiveSchema primaryType) {
    if (primaryType == null) {
      return null;
    }

    return parsed.computeIfAbsent(primaryType, this::createPrimitiveType);
  }

  /**
   * Extension.
   *
   * @param primaryType the primitive schema.
   * @return the client model type.
   */
  protected IType createPrimitiveType(PrimitiveSchema primaryType) {
    boolean isLowLevelClient = JavaSettings.getInstance().isDataPlaneClient();
    boolean urlAsString = JavaSettings.getInstance().urlAsString();
    boolean uuidAsString = JavaSettings.getInstance().uuidAsString();

    switch (primaryType.getType()) {
//            case null:
//                iType = PrimitiveType.Void;
//                break;
      case BOOLEAN: return PrimitiveType.BOOLEAN;
      case BYTE_ARRAY:
        ByteArraySchema byteArraySchema = (ByteArraySchema) primaryType;
        return (byteArraySchema.getFormat() == ByteArraySchema.Format.BASE_64_URL)
          ? ClassType.BASE_64_URL
          : ArrayType.BYTE_ARRAY;
      case CHAR: return PrimitiveType.CHAR;
      case DATE: return isLowLevelClient ? ClassType.STRING : ClassType.LOCAL_DATE;
      case DATE_TIME:
        DateTimeSchema dateTimeSchema = (DateTimeSchema) primaryType;
        return (dateTimeSchema.getFormat() == DateTimeSchema.Format.DATE_TIME_RFC_1123)
          ? ClassType.DATE_TIME_RFC_1123
          : ClassType.DATE_TIME;
      case TIME:
//                TimeSchema timeSchema = (TimeSchema) primaryType;
        return ClassType.STRING;
//            case KnownPrimaryType.DateTimeRfc1123:
//                iType = ClassType.DateTimeRfc1123;
//                break;
      case NUMBER:
        NumberSchema numberSchema = (NumberSchema) primaryType;
        if (numberSchema.getPrecision() == 64) {
          return PrimitiveType.DOUBLE;
        } else if (numberSchema.getPrecision() == 32) {
          return PrimitiveType.FLOAT;
        } else {
          return ClassType.BIG_DECIMAL;
        }
      case INTEGER:
        NumberSchema intSchema = (NumberSchema) primaryType;
        if ("string".equals(intSchema.getEncode())) {
          return (intSchema.getPrecision() == 64)
            ? PrimitiveType.LONG_AS_STRING
            : PrimitiveType.INT_AS_STRING;
        } else {
          return (intSchema.getPrecision() == 64)
            ? PrimitiveType.LONG
            : PrimitiveType.INT;
        }
      case STRING: return ClassType.STRING;
      case ARM_ID: return ClassType.STRING;
      case URI: return isLowLevelClient || urlAsString ? ClassType.STRING : ClassType.URL;
      case DURATION:
        DurationSchema durationSchema = (DurationSchema) primaryType;
        IType durationType = ClassType.DURATION;
        if (durationSchema.getFormat() != null) {
          switch (durationSchema.getFormat()) {
            case SECONDS_INTEGER:
              return PrimitiveType.DURATION_LONG;
            case SECONDS_NUMBER:
              return PrimitiveType.DURATION_DOUBLE;
          }
        }
        return durationType;
      case UNIXTIME: return isLowLevelClient ? PrimitiveType.LONG : PrimitiveType.UNIX_TIME_LONG;
      case UUID: return isLowLevelClient || uuidAsString ? ClassType.STRING : ClassType.UUID;
      case OBJECT: return ClassType.OBJECT;
      case CREDENTIAL: return ClassType.TOKEN_CREDENTIAL;
      default:
        throw new UnsupportedOperationException(String.format("Unrecognized AutoRest Primitive Type: %s",
          primaryType.getType()));
    }
  }
}
