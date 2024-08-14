// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;

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
