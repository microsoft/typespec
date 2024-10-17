// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package org.utils;

import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;

import java.util.Map;

public class BinaryDataUtils {

  public static void assertMapEquals(Map<String, BinaryData> left, Map<String, BinaryData> right) {
    Assertions.assertEquals(left.size(), right.size());
    for (String key : left.keySet()) {
      BinaryData leftValue = left.get(key);
      BinaryData rightValue = right.get(key);
      Assertions.assertArrayEquals(leftValue.toBytes(), rightValue.toBytes());
    }
  }
}
