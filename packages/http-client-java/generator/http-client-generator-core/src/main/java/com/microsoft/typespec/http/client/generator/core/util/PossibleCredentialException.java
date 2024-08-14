// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

public class PossibleCredentialException extends RuntimeException {

    private final String keyName;

    public PossibleCredentialException(String keyName) {
        super("Possible credential in value of key: " + keyName);
        this.keyName = keyName;
    }

    public String getKeyName() {
        return keyName;
    }
}
