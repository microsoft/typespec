// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent.template;

import com.microsoft.typespec.http.client.generator.fluent.model.projectmodel.Changelog;

public class ChangelogTemplate extends com.azure.autorest.template.ChangelogTemplate {

    public String write(Changelog changelog) {
        return changelog.getContent();
    }
}
