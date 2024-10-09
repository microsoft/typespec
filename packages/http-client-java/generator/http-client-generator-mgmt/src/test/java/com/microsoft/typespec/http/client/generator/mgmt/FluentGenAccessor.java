// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.mgmt.mapper.FluentMapper;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentClient;
import com.microsoft.typespec.http.client.generator.mgmt.model.javamodel.FluentJavaPackage;

public class FluentGenAccessor {

    private final FluentGen fluentgen;

    public FluentGenAccessor(FluentGen fluentgen) {
        this.fluentgen = fluentgen;
    }

    public CodeModel handleYaml(String yamlContent) {
        return fluentgen.handleYaml(yamlContent);
    }

    public Client handleMap(CodeModel codeModel) {
        return fluentgen.handleMap(codeModel);
    }

    public FluentJavaPackage handleTemplate(Client client) {
        return fluentgen.handleTemplate(client);
    }

    public FluentClient handleFluentLite(CodeModel codeModel, Client client, FluentJavaPackage javaPackage) {
        return fluentgen.handleFluentLite(codeModel, client, javaPackage);
    }

    public FluentMapper getFluentMapper() {
        return fluentgen.getFluentMapper();
    }

    public void clear() {
        fluentgen.clear();
    }
}
