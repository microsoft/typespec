// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method;

public enum FluentMethodType {
    CREATE_WITH,
    CREATE_PARENT,
    UPDATE_WITH,
    UPDATE_WITHOUT,

    CONSTRUCTOR,
    CREATE,
    DEFINE,

    UPDATE,
    APPLY,

    REFRESH,

    OTHER
}
