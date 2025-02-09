package com.microsoft.provisioning.http.client.generator.provisioning.model;

/**
 * Represents name requirements for a resource in the Azure provisioning model.
 */
public class NameRequirements {
    private final boolean required;
    private final boolean unique;

    /**
     * Constructs a new NameRequirements.
     *
     * @param required Indicates if the name is required.
     * @param unique Indicates if the name must be unique.
     */
    public NameRequirements(boolean required, boolean unique) {
        this.required = required;
        this.unique = unique;
    }

    /**
     * Indicates if the name is required.
     *
     * @return true if the name is required, false otherwise.
     */
    public boolean isRequired() {
        return required;
    }

    /**
     * Indicates if the name must be unique.
     *
     * @return true if the name must be unique, false otherwise.
     */
    public boolean isUnique() {
        return unique;
    }
}
