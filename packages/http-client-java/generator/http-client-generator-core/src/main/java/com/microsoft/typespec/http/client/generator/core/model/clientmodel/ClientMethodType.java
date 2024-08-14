// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.HashMap;
import java.util.Map;

/**
 * The different types of ClientMethod overloads that can exist in a client.
 */
public enum ClientMethodType {
    PagingSync(0, true, false, true),
    PagingAsync(1, true, false, false),
    PagingAsyncSinglePage(2, true, false, false),

    SimulatedPagingSync(3, false, false, true),
    SimulatedPagingAsync(4, false, false, false),

    LongRunningSync(5, false, true, true),
    LongRunningAsync(6, false, true, false),
    LongRunningBeginSync(7, false, true, true),
    LongRunningBeginAsync(8, false, true, false),

    SimpleSync(9, false, false, true),
    // will not generate when sync-methods=none, will generate when sync-methods=essential,
    SimpleAsync(10, false, false, false),
    SimpleAsyncRestResponse(11, false, false, false),
    SimpleSyncRestResponse(12, false, false, true),

    Resumable(13, false, false, false),

    SendRequestSync(14, false, false, true),
    SendRequestAsync(15, false, false, false),
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
