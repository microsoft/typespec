// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class FluentServiceClientTemplateTests {

    @BeforeAll
    public static void ensurePlugin() {
        new TestUtils.MockFluentGen();
    }

    @Test
    public void writesEmptyByteArrayForNullLroErrorBody() {
        JavaFile javaFile = new JavaFile("ProgramEnrollmentManagementClientImpl.java");

        javaFile.publicFinalClass("ProgramEnrollmentManagementClientImpl",
            classBlock -> FluentServiceClientTemplate.getInstance().writeAdditionalClassBlock(classBlock));

        String output = javaFile.getContents().toString();

        Assertions.assertTrue(output.contains(
            "this.responseBody = responseBody == null ? new byte[0] : responseBody.getBytes(StandardCharsets.UTF_8);"));
        Assertions.assertFalse(output.contains(
            "this.responseBody = responseBody == null ? null : responseBody.getBytes(StandardCharsets.UTF_8);"));
    }
}
