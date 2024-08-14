// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.template;

import com.azure.autorest.model.projectmodel.Project;
import com.azure.autorest.util.TemplateUtil;

public class ChangelogTemplate {

    public String write(Project project) {
        return TemplateUtil.loadTextFromResource("Changelog_protocol.txt",
                TemplateUtil.SERVICE_NAME, project.getServiceName(),
                TemplateUtil.SERVICE_DESCRIPTION, project.getServiceDescriptionForMarkdown(),
                TemplateUtil.ARTIFACT_VERSION, project.getVersion(),
                TemplateUtil.DATE_UTC, "Unreleased"
        );
    }
}
