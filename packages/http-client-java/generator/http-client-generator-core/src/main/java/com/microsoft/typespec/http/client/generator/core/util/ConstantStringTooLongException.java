// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

public class ConstantStringTooLongException extends RuntimeException {

    public ConstantStringTooLongException() {
        super("Constant string too long.");
    }
}
