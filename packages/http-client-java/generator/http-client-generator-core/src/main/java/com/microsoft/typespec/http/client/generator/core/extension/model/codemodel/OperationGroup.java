// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents an operation group, a container around set of operations.
 */
public class OperationGroup extends Metadata {
    private String $key;
    private List<Operation> operations = new ArrayList<Operation>();
    private Client codeModel;

    /**
     * Creates a new instance of the OperationGroup class.
     */
    public OperationGroup() {
    }

    /**
     * Gets the key of the operation group. (Required)
     *
     * @return The key of the operation group.
     */
    public String get$key() {
        return $key;
    }

    /**
     * Sets the key of the operation group. (Required)
     *
     * @param $key The key of the operation group.
     */
    public void set$key(String $key) {
        this.$key = $key;
    }

    /**
     * Gets the operations that are in this operation group. (Required)
     *
     * @return The operations that are in this operation group.
     */
    public List<Operation> getOperations() {
        return operations;
    }

    /**
     * Sets the operations that are in this operation group. (Required)
     *
     * @param operations The operations that are in this operation group.
     */
    public void setOperations(List<Operation> operations) {
        this.operations = operations;
    }

    /**
     * Gets the client which contains the operation group.
     *
     * @return The client which contains the operation group.
     */
    public Client getCodeModel() {
        return codeModel;
    }

    /**
     * Sets the client which contains the operation group.
     *
     * @param codeModel The client which contains the operation group.
     */
    public void setCodeModel(Client codeModel) {
        this.codeModel = codeModel;
    }
}
