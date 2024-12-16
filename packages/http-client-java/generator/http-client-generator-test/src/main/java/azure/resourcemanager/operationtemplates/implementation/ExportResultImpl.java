// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package azure.resourcemanager.operationtemplates.implementation;

import azure.resourcemanager.operationtemplates.fluent.models.ExportResultInner;
import azure.resourcemanager.operationtemplates.models.ExportResult;

public final class ExportResultImpl implements ExportResult {
    private ExportResultInner innerObject;

    private final azure.resourcemanager.operationtemplates.OperationTemplatesManager serviceManager;

    ExportResultImpl(ExportResultInner innerObject,
        azure.resourcemanager.operationtemplates.OperationTemplatesManager serviceManager) {
        this.innerObject = innerObject;
        this.serviceManager = serviceManager;
    }

    public String content() {
        return this.innerModel().content();
    }

    public ExportResultInner innerModel() {
        return this.innerObject;
    }

    private azure.resourcemanager.operationtemplates.OperationTemplatesManager manager() {
        return this.serviceManager;
    }
}
