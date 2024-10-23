// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

/**
 * Interface for mapping from a value to another value.
 *
 * @param <FromT> The from type.
 * @param <ToT> The to type.
 */
public interface IMapper<FromT, ToT> {
    /**
     * Maps the from value.
     *
     * @param fromT The from value.
     * @return The mapped to value.
     */
    ToT map(FromT fromT);
}
