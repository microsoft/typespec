// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentManager;

import java.util.List;

/**
 * Basic info for Fluent samples.
 */
public interface FluentExample {

    /**
     * @return the name of the sample.
     */
    String getName();

    /**
     * @return the file name of the original example in JSON.
     */
    String getOriginalFileName();

    /**
     * @return the type of the entry (usually a {@link FluentManager}).
     */
    ClassType getEntryType();

    /**
     * @return the name of the entry.
     */
    String getEntryName();

    /**
     * @return the description of the entry.
     */
    String getEntryDescription();

    /**
     * @return the list of parameters used in the sample.
     */
    List<ParameterExample> getParameters();
}
