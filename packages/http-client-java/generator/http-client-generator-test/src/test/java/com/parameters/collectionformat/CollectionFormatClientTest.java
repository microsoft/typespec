// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.parameters.collectionformat;

import org.junit.jupiter.api.Test;

import java.util.Arrays;

class CollectionFormatClientTest {

    private final QueryClient client = new CollectionFormatClientBuilder().buildQueryClient();
    private final HeaderClient headerClient = new CollectionFormatClientBuilder().buildHeaderClient();

    @Test
    void testMulti() {
        client.multi(Arrays.asList("blue", "red", "green"));
    }

    @Test
    void testCsv() {
        client.csv(Arrays.asList("blue", "red", "green"));
    }

    @Test
    void testSsv() {
        client.ssv(Arrays.asList("blue", "red", "green"));
    }

    @Test
    void testTsv() {
        client.tsv(Arrays.asList("blue", "red", "green"));
    }

    @Test
    void testPipe() {
        client.pipes(Arrays.asList("blue", "red", "green"));
    }

    @Test
    void testCsvHeader() {
        headerClient.csv(Arrays.asList("blue", "red", "green"));
    }

}
