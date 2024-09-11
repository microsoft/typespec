// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.implementation;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;

/**
 * A {@link ClientModelProperty} with additional metadata specific to a given {@link ClientModel}.
 * <p>
 * For example this class could contain information such as whether the {@link ClientModelProperty} is from a super
 * type of the given {@link ClientModel}.
 */
public final class ClientModelPropertyWithMetadata {
    private final ClientModel model;
    private final ClientModelProperty property;
    private final boolean fromSuperClass;

    /**
     * Creates a new instance of {@link ClientModelPropertyWithMetadata}.
     *
     * @param model The {@link ClientModel}.
     * @param property The {@link ClientModelProperty}.
     * @param fromSuperClass Whether the property is from a super class of the specific {@link ClientModel}.
     */
    public ClientModelPropertyWithMetadata(ClientModel model, ClientModelProperty property, boolean fromSuperClass) {
        this.model = model;
        this.property = property;
        this.fromSuperClass = fromSuperClass;
    }

    /**
     * Gets the {@link ClientModel} that the {@link #getProperty() ClientModelProperty} is from.
     *
     * @return The containing {@link ClientModel}.
     */
    public ClientModel getModel() {
        return model;
    }

    /**
     * Gets the {@link ClientModelProperty} that the metadata is based on.
     *
     * @return The {@link ClientModelProperty} that the metadata is based on.
     */
    public ClientModelProperty getProperty() {
        return property;
    }

    /**
     * Whether the {@link ClientModelProperty} is from a super class of the {@link ClientModel}.
     *
     * @return Whether the {@link ClientModelProperty} is from a super class of the {@link ClientModel}.
     */
    public boolean isFromSuperClass() {
        return fromSuperClass;
    }
}
