// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.base.util;

/**
 * Represents exception types for HTTP requests and responses.
 */
public enum HttpExceptionType {
    /**
     * The exception thrown when failing to authenticate the HTTP request with status code of {@code 4XX}, typically
     * {@code 401 Unauthorized}.
     *
     * <p>A runtime exception indicating request authorization failure caused by one of the following scenarios:</p>
     * <ul>
     *     <li>A client did not send the required authorization credentials to access the requested resource, i.e.
     *     Authorization HTTP header is missing in the request</li>
     *     <li>If the request contains the HTTP Authorization header, then the exception indicates that authorization
     *     has been refused for the credentials contained in the request header.</li>
     * </ul>
     */
    CLIENT_AUTHENTICATION,

    /**
     * The exception thrown when the HTTP request tried to create an already existing resource and received a status
     * code {@code 4XX}, typically {@code 412 Conflict}.
     */
    RESOURCE_EXISTS,

    /**
     * The exception thrown for invalid resource modification with status code of {@code 4XX}, typically
     * {@code 409 Conflict}.
     */
    RESOURCE_MODIFIED,

    /**
     * The exception thrown when receiving an error response with status code {@code 412 response} (for update) or
     * {@code 404 Not Found} (for get/post).
     */
    RESOURCE_NOT_FOUND,

    /**
     * This exception thrown when an HTTP request has reached the maximum number of redirect attempts with a status code
     * of {@code 3XX}.
     */
    TOO_MANY_REDIRECTS
}
