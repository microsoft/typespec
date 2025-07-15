// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Represents a security scheme.
 */
public class Scheme {
    private Scheme.SecuritySchemeType type;
    // OAuth2
    private Set<String> scopes = new HashSet<>();
    private List<OAuth2Flow> flows = new ArrayList<>();
    // Key
    private String name;
    private String in;
    private String prefix;

    /**
     * Creates a new instance of the Scheme class.
     */
    public Scheme() {
    }

    /**
     * Gets the type of the security scheme.
     *
     * @return The type of the security scheme.
     */
    public Scheme.SecuritySchemeType getType() {
        return type;
    }

    /**
     * Sets the type of the security scheme.
     *
     * @param type The type of the security scheme.
     */
    public void setType(Scheme.SecuritySchemeType type) {
        this.type = type;
    }

    /**
     * Gets the scopes of the security scheme.
     *
     * @return The scopes of the security scheme.
     */
    public Set<String> getScopes() {
        return scopes;
    }

    /**
     * Sets the scopes of the security scheme.
     *
     * @param scopes The scopes of the security scheme.
     */
    public void setScopes(Set<String> scopes) {
        this.scopes = scopes;
    }

    /**
     * Gets the flows of the OAuth2 security scheme.
     *
     * @return The flows of the security scheme.
     */
    public List<OAuth2Flow> getFlows() {
        return flows;
    }

    public void setFlows(List<OAuth2Flow> flows) {
        this.flows = flows;
    }

    /**
     * Gets the name of the security scheme.
     *
     * @return The name of the security scheme.
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the name of the security scheme.
     *
     * @param name The name of the security scheme.
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the location of the security scheme.
     *
     * @return The location of the security scheme.
     */
    public String getIn() {
        return in;
    }

    /**
     * Sets the location of the security scheme.
     *
     * @param in The location of the security scheme.
     */
    public void setIn(String in) {
        this.in = in;
    }

    /**
     * Gets the prefix of the security scheme.
     *
     * @return The prefix of the security scheme.
     */
    public String getPrefix() {
        return prefix;
    }

    /**
     * Sets the prefix of the security scheme.
     *
     * @param prefix The prefix of the security scheme.
     */
    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    /**
     * The type of the security scheme.
     */
    public enum SecuritySchemeType {
        /**
         * OAuth2 security scheme.
         */
        OAUTH2("OAuth2"),

        /**
         * Key security scheme.
         */
        KEY("Key");

        private final String value;

        SecuritySchemeType(String value) {
            this.value = value;
        }

        @Override
        public String toString() {
            return this.value;
        }

        /**
         * Get the value of the security scheme type.
         *
         * @return The value of the security scheme type.
         */
        public String value() {
            return this.value;
        }

        /**
         * Get the security scheme type from the value.
         *
         * @param value The value of the security scheme type.
         * @return The security scheme type.
         * @throws IllegalArgumentException thrown if the value does not match any of the security scheme types.
         */
        public static Scheme.SecuritySchemeType fromValue(String value) {
            if ("OAuth2".equals(value)) {
                return OAUTH2;
            } else if ("Key".equals(value)) {
                return KEY;
            } else {
                throw new IllegalArgumentException(value);
            }
        }
    }
}
