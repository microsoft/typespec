// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.util;

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
