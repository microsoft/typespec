// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.model.javamodel;

import java.util.function.Consumer;

public interface JavaContext {
    void javadocComment(Consumer<JavaJavadocComment> commentAction);

    void annotation(String... annotations);
}
