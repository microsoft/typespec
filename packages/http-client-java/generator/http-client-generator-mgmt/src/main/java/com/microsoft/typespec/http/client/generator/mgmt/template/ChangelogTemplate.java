// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel.Changelog;

public class ChangelogTemplate extends com.microsoft.typespec.http.client.generator.core.template.ChangelogTemplate {

    public String write(Changelog changelog) {
        return changelog.getContent();
    }
}
