// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SchemaContext;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * An instance on implementation details of method or model.
 */
public class ImplementationDetails {

    /**
     * Usage of the model or method. See {@link SchemaContext}.
     */
    public enum Usage {
        /**
         * Model used in input of operation.
         */
        INPUT("input"),

        /**
         * Model used in output of operation.
         */
        OUTPUT("output"),

        /**
         * Model used in error output of operation.
         */
        EXCEPTION("exception"),

        /**
         * Public model.
         * <p>
         * Usually it means that the model is used in input or output of methods marked as convenience API (and that API
         * is not marked as internal). Codegen should generate the class in models package.
         */
        PUBLIC("public"),

        /**
         * Model used in paged response.
         * <p>
         * Codegen may choose to not generate class for it, or generate class in implementation package.
         */
        PAGED("paged"),

        /**
         * Anonymous model.
         * <p>
         * Codegen may choose to not generate class for it, or generate class in implementation package.
         */
        ANONYMOUS("anonymous"),

        /**
         * External model.
         * <p>
         * Codegen should not generate the class. Javadoc or test/sample generation will still need to process the
         * model. Codegen likely need to have additional "require" clause in module-info.java, and additional dependency
         * in pom.xml.
         */
        EXTERNAL("external"),

        /**
         * Internal model.
         * <p>
         * Codegen should generate the class in implementation package.
         */
        INTERNAL("internal"),

        /**
         * Model used in json-merge-patch operation
         * <p>
         * Codegen should handle serialization and deserialization specially for json-merge-patch model
         */
        JSON_MERGE_PATCH("json-merge-patch"),

        /**
         * Model used in options group
         * <p>
         * Serialization code will not be generated
         */
        OPTIONS_GROUP("options-group");

        private final static Map<String, Usage> CONSTANTS = new HashMap<>();

        static {
            for (Usage c : values()) {
                CONSTANTS.put(c.value, c);
            }
        }

        private final String value;

        Usage(String value) {
            this.value = value;
        }

        /**
         * Get the string value of the usage.
         *
         * @return the string value of the usage.
         */
        public String value() {
            return this.value;
        }

        /**
         * Get the Usage instance from the string value.
         *
         * @param value the string value.
         * @return the Usage instance.
         * @throws IllegalArgumentException thrown if the string value doesn't match any Usage.
         */
        public static Usage fromValue(String value) {
            Usage constant = CONSTANTS.get(value);
            if (constant == null) {
                throw new IllegalArgumentException(value);
            } else {
                return constant;
            }
        }

        /**
         * Get the Usage instance from the SchemaContext.
         *
         * @param schemaContext the SchemaContext.
         * @return the Usage instance.
         * @throws IllegalArgumentException thrown if the SchemaContext doesn't match any Usage.
         */
        public static Usage fromSchemaContext(SchemaContext schemaContext) {
            switch (schemaContext) {
                case INPUT:
                    return INPUT;
                case OUTPUT:
                    return OUTPUT;
                case EXCEPTION:
                    return EXCEPTION;
                case PUBLIC:
                    return PUBLIC;
                case PAGED:
                    return PAGED;
                case ANONYMOUS:
                    return ANONYMOUS;
                case INTERNAL:
                    return INTERNAL;
                case JSON_MERGE_PATCH:
                    return JSON_MERGE_PATCH;
                case OPTIONS_GROUP:
                    return OPTIONS_GROUP;
                default:
                    throw new IllegalArgumentException(schemaContext.toString());
            }
        }
    }

    private final boolean implementationOnly;

    private final Set<Usage> usages;

    private final String comment;

    /**
     * Usually on a method, that it is only required in implementation class (FooClientImpl), but not in public class
     * (FooClient).
     *
     * @return whether only required in implementation class.
     */
    public boolean isImplementationOnly() {
        return implementationOnly;
    }

    /**
     * Usage of the model or method. See {@link SchemaContext}.
     *
     * @return the usage of the model or method.
     */
    public Set<Usage> getUsages() {
        return usages;
    }

    /**
     * Whether the model need to be generated for public use.
     *
     * @return whether the model need to be generated for public use.
     */
    public boolean isPublic() {
        return usages.contains(Usage.PUBLIC);
    }

    /**
     * Whether the model need to be generated for internal use.
     *
     * @return whether the model need to be generated for internal use.
     */
    public boolean isInternal() {
        return usages.contains(Usage.INTERNAL);
    }

    /**
     * Whether the model need to be generated for input use.
     *
     * @return whether the model need to be generated for input use.
     */
    public boolean isInput() {
        return usages.contains(Usage.INPUT);
    }

    /**
     * Whether the model need to be generated for output use.
     *
     * @return whether the model need to be generated for output use.
     */
    public boolean isOutput() {
        return usages.contains(Usage.OUTPUT);
    }

    /**
     * Whether the model need to be generated for exception use.
     *
     * @return whether the model need to be generated for exception use.
     */
    public boolean isException() {
        return usages.contains(Usage.EXCEPTION);
    }

    /**
     * Get the API comment.
     *
     * @return API comment.
     */
    public String getComment() {
        return comment;
    }

    /**
     * Creates an instance of ImplementationDetails class.
     *
     * @param implementationOnly whether only required in implementation class.
     * @param usages usage of the model or method.
     * @param comment API comment.
     */
    protected ImplementationDetails(boolean implementationOnly, Set<Usage> usages, String comment) {
        this.implementationOnly = implementationOnly;
        this.usages = usages;
        this.comment = comment;
    }

    /**
     * Builder for {@link ImplementationDetails}.
     */
    public static final class Builder {
        private boolean implementationOnly = false;
        private Set<Usage> usages = new HashSet<>();
        private String comment;

        /**
         * Creates an instance of Builder class.
         */
        public Builder() {
        }

        /**
         * Set whether only required in implementation class.
         *
         * @param implementationOnly whether only required in implementation class.
         * @return the Builder itself.
         */
        public Builder implementationOnly(boolean implementationOnly) {
            this.implementationOnly = implementationOnly;
            return this;
        }

        /**
         * Sets usage of the model or method.
         *
         * @param usages usage of the model or method.
         * @return the Builder itself.
         */
        public Builder usages(Set<Usage> usages) {
            this.usages = usages;
            return this;
        }

        /**
         * Sets API comment.
         *
         * @param comment API comment.
         * @return the Builder itself.
         */
        public Builder comment(String comment) {
            this.comment = comment;
            return this;
        }

        /**
         * Builds an instance of ImplementationDetails class.
         *
         * @return the ImplementationDetails instance.
         */
        public ImplementationDetails build() {
            return new ImplementationDetails(implementationOnly, usages, comment);
        }
    }
}
