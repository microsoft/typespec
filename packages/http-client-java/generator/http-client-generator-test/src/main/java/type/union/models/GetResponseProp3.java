// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package type.union.models;

import com.azure.core.annotation.Generated;
import com.azure.core.util.ExpandableStringEnum;
import java.util.Collection;

/**
 * Defines values for GetResponseProp3.
 */
public final class GetResponseProp3 extends ExpandableStringEnum<GetResponseProp3> {
    /**
     * Static value b for GetResponseProp3.
     */
    @Generated
    public static final GetResponseProp3 B = fromString("b");

    /**
     * Static value c for GetResponseProp3.
     */
    @Generated
    public static final GetResponseProp3 C = fromString("c");

    /**
     * Creates a new instance of GetResponseProp3 value.
     * 
     * @deprecated Use the {@link #fromString(String)} factory method.
     */
    @Generated
    @Deprecated
    public GetResponseProp3() {
    }

    /**
     * Creates or finds a GetResponseProp3 from its string representation.
     * 
     * @param name a name to look for.
     * @return the corresponding GetResponseProp3.
     */
    @Generated
    public static GetResponseProp3 fromString(String name) {
        return fromString(name, GetResponseProp3.class);
    }

    /**
     * Gets known GetResponseProp3 values.
     * 
     * @return known GetResponseProp3 values.
     */
    @Generated
    public static Collection<GetResponseProp3> values() {
        return values(GetResponseProp3.class);
    }
}
