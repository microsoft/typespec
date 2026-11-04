// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import com.github.javaparser.ast.expr.StringLiteralExpr;
import com.microsoft.typespec.http.client.generator.core.customization.Customization;
import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;
import org.slf4j.Logger;

public class ExperimentalCustomization extends Customization {
    @Override
    public void customize(LibraryCustomization customization, Logger logger) {
        logger.info("Customizing the generated experimental warning text");
        customization.getClass("tsptest.experimental.models", "CustomizedModel").customizeAst(ast -> ast
            .getClassByName("CustomizedModel")
            .orElseThrow()
            .getAnnotationByName("Preview")
            .orElseThrow()
            .asNormalAnnotationExpr()
            .getPairs()
            .stream()
            .filter(pair -> pair.getNameAsString().equals("warningText"))
            .findFirst()
            .orElseThrow()
            .setValue(new StringLiteralExpr("Customized preview")));
    }
}
