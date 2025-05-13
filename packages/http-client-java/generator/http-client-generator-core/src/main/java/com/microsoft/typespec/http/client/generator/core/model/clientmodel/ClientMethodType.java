// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.HashMap;
import java.util.Map;

/**
 * The different types of ClientMethod overloads that can exist in a client.
 */
public enum ClientMethodType {
    /**
     * represents a method that returns PagedIterable&lt;T&gt;.
     */
    PagingSync(0, true, false, true),
    /**
     * represents a method that returns PagedFlux&lt;T&gt;.
     */
    PagingAsync(1, true, false, false),
    /**
     * represents a '[Operation]SinglePageAsync' method that returns Mono&lt;PagedResponse&lt;T&gt;&gt; or
     * Mono&lt;PagedResponseBase&lt;H,T&gt;&gt;.
     */
    PagingAsyncSinglePage(2, true, false, false),
    SimulatedPagingSync(3, false, false, true), // unused
    SimulatedPagingAsync(4, false, false, false), // unused
    /**
     * represents long-running method that returns T where T is the final result of the LRO.
     */
    LongRunningSync(5, false, true, true),
    /**
     * represents long-running method that returns Mono&lt;T&gt; where T is the final result of the LRO.
     */
    LongRunningAsync(6, false, true, false),
    /**
     * represents a long-running 'begin[Operation]' method that returns SyncPoller.
     */
    LongRunningBeginSync(7, false, true, true),
    /**
     * represents a long-running 'begin[Operation]' method that returns PollerFlux.
     */
    LongRunningBeginAsync(8, false, true, false),
    /**
     * represents a method that returns T, e.g. 'Foo getFoo(...)'.
     */
    SimpleSync(9, false, false, true),
    /**
     * represents a method that returns Mono&lt;T&gt;, e.g. 'Mono&lt;Foo&gt; getFooAsync(...)'.
     * <p>
     * will not generate when sync-methods=none, will generate when sync-methods=essential,
     * </p>
     */
    SimpleAsync(10, false, false, false),
    /**
     * represents a '[Operation]WithResponseAsync' method that returns Mono&lt;Response&lt;T&gt;&gt; or
     * Mono&lt;ResponseBase&lt;H,T&gt;&gt;.
     */
    SimpleAsyncRestResponse(11, false, false, false),
    /**
     * represents a '[Operation]WithResponse' method that returns Response&lt;T&gt; or ResponseBase&lt;H,T&gt;.
     */
    SimpleSyncRestResponse(12, false, false, true),
    /**
     * represents a method that resumes LRO polling.
     */
    Resumable(13, false, false, false),
    /**
     * represents 'sendRequest' method that returns Response&lt;BinaryData&gt;
     */
    SendRequestSync(14, false, false, true),
    /**
     * represents 'sendRequestAsync' method that returns Mono&lt;Response&lt;BinaryData&gt;&gt;
     */
    SendRequestAsync(15, false, false, false),
    /**
     * represents a '[Operation]SinglePage' method that returns PagedResponse&lt;T&gt; or PagedResponseBase&lt;H,T&gt;.
     */
    PagingSyncSinglePage(16, true, false, true),;

    private static final Map<Integer, ClientMethodType> MAPPINGS;

    static {
        MAPPINGS = new HashMap<>();
        for (ClientMethodType methodType : ClientMethodType.values()) {
            MAPPINGS.put(methodType.intValue, methodType);
        }
    }

    private final int intValue;
    private final boolean isPaging;
    private final boolean isLongRunning;
    private final boolean isSync;

    ClientMethodType(int value, boolean isPaging, boolean isLongRunning, boolean isSync) {
        intValue = value;
        this.isPaging = isPaging;
        this.isLongRunning = isLongRunning;
        this.isSync = isSync;
    }

    public static ClientMethodType forValue(int value) {
        return MAPPINGS.get(value);
    }

    public int getValue() {
        return intValue;
    }

    public boolean isPaging() {
        return isPaging;
    }

    public boolean isLongRunning() {
        return isLongRunning;
    }

    public boolean isSync() {
        return isSync;
    }
}
