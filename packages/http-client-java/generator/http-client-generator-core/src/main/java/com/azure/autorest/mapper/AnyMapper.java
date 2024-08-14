// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.mapper;

import com.azure.autorest.extension.base.model.codemodel.AnySchema;
import com.azure.autorest.model.clientmodel.ClassType;
import com.azure.autorest.model.clientmodel.IType;

/**
 * A mapper that maps an {@link AnySchema} to {@link ClassType#OBJECT}, always.
 */
public class AnyMapper implements IMapper<AnySchema, IType> {

  private static final AnyMapper INSTANCE = new AnyMapper();

  private AnyMapper() {
    // private constructor
  }

  /**
   * Gets the global {@link AnyMapper} instance.
   *
   * @return The global {@link AnyMapper} instance.
   */
  public static AnyMapper getInstance() {
    return INSTANCE;
  }

  @Override
  public IType map(AnySchema anySchema) {
    return ClassType.OBJECT;
  }
}
