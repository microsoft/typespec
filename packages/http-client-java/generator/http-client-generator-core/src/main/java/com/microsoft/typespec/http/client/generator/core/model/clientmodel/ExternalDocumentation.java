// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.net.MalformedURLException;
import java.net.URL;

/**
 *  External documentation, can be used to link to rest API documentation
 */
public class ExternalDocumentation {
    private String description;
    private String url;

    protected ExternalDocumentation(String description, String url) {
        this.description = description;
        this.url = url;
    }

    public String getDescription() {
        return description;
    }

    public String getUrl() {
        return url;
    }


    @Override
    public String toString() {
        return "ExternalDocumentation{" +
                "description='" + description + '\'' +
                ", url='" + url + '\'' +
                '}';
    }

    public static class Builder {

        private String description;

        private String url;

        /**
         * Sets the description of this ExternalDocumentation.
         * @param description the description of this ExternalDocumentation
         * @return the Builder itself
         */
        public ExternalDocumentation.Builder description(String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the url of this ExternalDocumentation.
         * @param url of this ExternalDocumentation
         * @return the Builder itself
         */
        public ExternalDocumentation.Builder url(String url) {
            try {
                new URL(url);
                this.url = url;
            } catch (MalformedURLException e) {
                throw new RuntimeException(e);
            }
            return this;
        }

        public ExternalDocumentation build() {
            return new ExternalDocumentation(
                    description,
                    url);
        }

    }
}
