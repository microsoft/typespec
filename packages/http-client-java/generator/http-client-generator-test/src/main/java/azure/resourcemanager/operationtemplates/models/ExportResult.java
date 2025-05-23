// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package azure.resourcemanager.operationtemplates.models;

import azure.resourcemanager.operationtemplates.fluent.models.ExportResultInner;

/**
 * An immutable client-side representation of ExportResult.
 */
public interface ExportResult {
    /**
     * Gets the content property: Content of the exported order.
     * 
     * @return the content value.
     */
    String content();

    /**
     * Gets the inner azure.resourcemanager.operationtemplates.fluent.models.ExportResultInner object.
     * 
     * @return the inner object.
     */
    ExportResultInner innerModel();
}
