// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.Set;

/**
 * Access to the client model property.
 */
public interface ClientModelPropertyAccess {

    String getName();

    String getDescription();

    String getGetterName();

    String getSetterName();

    IType getClientType();

    IType getWireType();

    boolean isReadOnly();

    boolean isReadOnlyForCreate();

    boolean isReadOnlyForUpdate();

    boolean isRequired();
    boolean isRequiredForCreate();

    boolean isConstant();

    void addImportsTo(Set<String> imports, boolean shouldGenerateXmlSerialization);
}
