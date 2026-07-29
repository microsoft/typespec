// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import com.github.javaparser.javadoc.description.JavadocSnippet;
import com.microsoft.typespec.http.client.generator.core.customization.Customization;
import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;
import org.slf4j.Logger;

public class JavaParserCustomizationTest extends Customization {
    @Override
    public void customize(LibraryCustomization customization, Logger logger) {
        logger.info("Customizing the NamingClient javadoc");
        customization.getClass("tsptest.namingjavaparser", "NamingJavaParserClient")
            .customizeAst(ast -> ast.getClassByName("NamingJavaParserClient")
                .ifPresent(cu -> cu.getMethodsByName("postWithResponse")
                    .forEach(m -> m.getJavadoc().ifPresent(javadoc -> {
                        javadoc.getDescription().getElements().clear();
                        javadoc.getDescription().addElement(new JavadocSnippet("Protocol method for POST operation."));
                    }))));
    }
}
