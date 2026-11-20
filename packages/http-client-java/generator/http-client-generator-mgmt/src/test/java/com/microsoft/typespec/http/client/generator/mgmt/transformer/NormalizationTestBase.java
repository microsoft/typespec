// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Metadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;

abstract class NormalizationTestBase {
    @BeforeAll
    public static void initializeNamer() {
        new FluentNamer(FluentGen.getPluginInstance(), new TestUtils.MockConnection(), "normalization",
            "normalization");
    }

    protected static CodeModel model(Operation... operations) {
        CodeModel model = new CodeModel();
        OperationGroup group = named(new OperationGroup(), "Widgets");
        group.setCodeModel(model);
        group.getOperations().addAll(Arrays.asList(operations));
        for (Operation operation : operations) {
            operation.setOperationGroup(group);
        }
        model.getOperationGroups().add(group);
        return model;
    }

    protected static Operation operation(String name, String method, String path) {
        Operation operation = named(new Operation(), name);
        operation.setRequests(new ArrayList<>(List.of(request(method, path))));
        return operation;
    }

    protected static Request request(String method, String path) {
        Protocol http = new Protocol();
        http.setMethod(method);
        http.setPath(path);
        Request request = new Request();
        request.setProtocol(protocol(http));
        return request;
    }

    protected static Protocols protocol(Protocol http) {
        Protocols protocols = new Protocols();
        protocols.setHttp(http);
        return protocols;
    }

    protected static <T extends Metadata> T named(T metadata, String name) {
        Language defaultLanguage = new Language();
        defaultLanguage.setName(name);
        Language javaLanguage = new Language();
        javaLanguage.setName(name);
        Languages languages = new Languages();
        languages.setDefault(defaultLanguage);
        languages.setJava(javaLanguage);
        metadata.setLanguage(languages);
        return metadata;
    }
}
