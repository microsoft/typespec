// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt;

import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.ExtensionContext;

public class BeforeAllTestsExtension implements BeforeAllCallback, ExtensionContext.Store.CloseableResource {

    private static final Lock LOCK = new ReentrantLock();
    private static volatile boolean started = false;

    @Override
    public void beforeAll(final ExtensionContext context) throws Exception {
        // lock the access so only one Thread has access to it
        LOCK.lock();
        try {
            if (!started) {
                started = true;
                // Your "before all tests" startup logic goes here
                // The following line registers a callback hook when the root test context is
                // shut down
                context.getRoot().getStore(ExtensionContext.Namespace.GLOBAL).put("any unique name", this);

                FluentGen fluentgen = new TestUtils.MockFluentGen();
            }
        } finally {
            // free the access
            LOCK.unlock();
        }
    }

    @Override
    public void close() throws Throwable {

    }
}
