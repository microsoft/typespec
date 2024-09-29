// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.util;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.policy.ExponentialBackoff;
import com.azure.core.http.policy.ExponentialBackoffOptions;
import com.azure.core.http.policy.FixedDelay;
import com.azure.core.http.policy.FixedDelayOptions;
import com.azure.core.http.policy.RetryOptions;
import com.azure.core.http.policy.RetryPolicy;
import com.azure.core.http.policy.RetryStrategy;
import java.lang.reflect.Field;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class RetryOptionsTests {

    public static class Configurable {
        // see Manager_Configurable.txt

        private RetryPolicy retryPolicy;
        private RetryOptions retryOptions;

        /**
         * Sets the retry policy to the HTTP pipeline.
         *
         * @param retryPolicy the HTTP pipeline retry policy.
         * @return the configurable object itself.
         */
        public Configurable withRetryPolicy(RetryPolicy retryPolicy) {
            this.retryPolicy = Objects.requireNonNull(retryPolicy, "'retryPolicy' cannot be null.");
            return this;
        }

        /**
         * Sets the retry options for the HTTP pipeline retry policy.
         * <p>
         * This setting has no effect, if retry policy is set via {@link #withRetryPolicy(RetryPolicy)}.
         *
         * @param retryOptions the retry options for the HTTP pipeline retry policy.
         * @return the configurable object itself.
         */
        public Configurable withRetryOptions(RetryOptions retryOptions) {
            this.retryOptions = Objects.requireNonNull(retryOptions, "'retryOptions' cannot be null.");
            return this;
        }

        public RetryPolicy getRetryPolicy() {
            if (retryPolicy == null) {
                if (retryOptions != null) {
                    retryPolicy = new RetryPolicy(retryOptions);
                } else {
                    retryPolicy = new RetryPolicy("Retry-After", ChronoUnit.SECONDS);
                }
            }
            return retryPolicy;
        }
    }

    @Test
    public void testManagerConfigurableRetryOptions() throws Exception {
        // not configured
        Configurable configurable = new Configurable();
        validateRetryPolicy(configurable.getRetryPolicy(), false);

        // configured as FixedDelayOptions
        configurable
            = new Configurable().withRetryOptions(new RetryOptions(new FixedDelayOptions(3, Duration.ofSeconds(10))));
        validateRetryPolicy(configurable.getRetryPolicy(), true, FixedDelay.class);

        // configured as ExponentialBackoffOptions
        configurable = new Configurable().withRetryOptions(new RetryOptions(new ExponentialBackoffOptions()));
        validateRetryPolicy(configurable.getRetryPolicy(), true);

        // RetryPolicy override RetryOptions
        configurable = new Configurable().withRetryPolicy(new RetryPolicy())
            .withRetryOptions(new RetryOptions(new FixedDelayOptions(3, Duration.ofSeconds(10))));
        validateRetryPolicy(configurable.getRetryPolicy(), true, ExponentialBackoff.class);
    }

    private static void validateRetryPolicy(RetryPolicy retryPolicy, boolean retryAfterHeaderAsNull)
        throws NoSuchFieldException, IllegalAccessException {
        validateRetryPolicy(retryPolicy, retryAfterHeaderAsNull, null);
    }

    private static void validateRetryPolicy(RetryPolicy retryPolicy, boolean retryAfterHeaderAsNull,
        Class<?> retryStrategyClass) throws NoSuchFieldException, IllegalAccessException {
        Assertions.assertNotNull(retryPolicy);

        Field retryAfterHeaderField = RetryPolicy.class.getDeclaredField("retryAfterHeader");
        Field retryAfterTimeUnitField = RetryPolicy.class.getDeclaredField("retryAfterTimeUnit");
        Field retryStrategyField = RetryPolicy.class.getDeclaredField("retryStrategy");

        retryAfterHeaderField.setAccessible(true);
        retryAfterTimeUnitField.setAccessible(true);
        retryStrategyField.setAccessible(true);
        HttpHeaderName retryAfterHeader = (HttpHeaderName) retryAfterHeaderField.get(retryPolicy);
        ChronoUnit retryAfterTimeUnit = (ChronoUnit) retryAfterTimeUnitField.get(retryPolicy);
        if (retryAfterHeaderAsNull) {
            Assertions.assertNull(retryAfterHeader);
        } else {
            Assertions.assertEquals("retry-after", retryAfterHeader.getCaseInsensitiveName());
            Assertions.assertEquals(ChronoUnit.SECONDS, retryAfterTimeUnit);
        }

        if (retryStrategyClass != null) {
            RetryStrategy retryStrategy = (RetryStrategy) retryStrategyField.get(retryPolicy);
            Assertions.assertTrue(retryStrategyClass.isAssignableFrom(retryStrategy.getClass()));
        }
    }
}
