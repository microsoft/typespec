// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ClientMethodTemplateBaseTests {

    // https://github.com/Azure/typespec-azure/issues/5288
    // a table cell value containing "*/" must not be able to prematurely close the
    // generated "/** ... */" Javadoc block.
    @Test
    public void javadocTableEscapesCommentTerminator() {
        JavaFileContents contents = new JavaFileContents();
        JavaJavadocComment commentBlock = new JavaJavadocComment(contents);

        ClientMethodTemplateBase.javadocTable("Optional Parameters", List.of("Name", "Type", "Required", "Description"),
            List.of(List.of("contentType", "String", "No", "Body parameter's content type. Known values are */*")),
            commentBlock);

        String result = contents.toString();
        Assertions.assertFalse(result.contains("*/*"),
            "generated Javadoc table must not contain a literal comment-closing sequence");
        Assertions.assertTrue(result.contains("*&#47;*"));
    }
}
