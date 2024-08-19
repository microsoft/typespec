// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import java.util.function.Consumer;

public interface JavaType extends JavaContext {
    void publicMethod(String methodSignature, Consumer<JavaBlock> functionBlock);
}
