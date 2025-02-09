package com.microsoft.provisioning.http.client.generator.provisioning.model;

/**
 * Represents a well-known RBAC role for an Azure service.
 */
public class Role {
    private final String name;
    private final String value;
    private final String description;

    /**
     * Constructs a new Role.
     *
     * @param name Friendly name of the role.
     * @param value GUID value of the role.
     * @param description Description of the role.
     */
    public Role(String name, String value, String description) {
        this.name = name;
        this.value = value;
        this.description = description;
    }

    /**
     * Gets the friendly name of the role.
     *
     * @return the name of the role.
     */
    public String getName() {
        return name;
    }

    /**
     * Gets the GUID value of the role.
     *
     * @return the value of the role.
     */
    public String getValue() {
        return value;
    }

    /**
     * Gets the description of the role.
     *
     * @return the description of the role.
     */
    public String getDescription() {
        return description;
    }
}
