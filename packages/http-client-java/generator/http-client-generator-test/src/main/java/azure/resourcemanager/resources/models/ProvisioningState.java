// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package azure.resourcemanager.resources.models;

import com.azure.core.util.ExpandableStringEnum;
import java.util.Collection;

/**
 * Defines values for ProvisioningState.
 */
public final class ProvisioningState extends ExpandableStringEnum<ProvisioningState> {
    /**
     * Resource has been created.
     */
    public static final ProvisioningState SUCCEEDED = fromString("Succeeded");

    /**
     * Resource creation failed.
     */
    public static final ProvisioningState FAILED = fromString("Failed");

    /**
     * Resource creation was canceled.
     */
    public static final ProvisioningState CANCELED = fromString("Canceled");

    /**
     * Static value Provisioning for ProvisioningState.
     */
    public static final ProvisioningState PROVISIONING = fromString("Provisioning");

    /**
     * Static value Updating for ProvisioningState.
     */
    public static final ProvisioningState UPDATING = fromString("Updating");

    /**
     * Static value Deleting for ProvisioningState.
     */
    public static final ProvisioningState DELETING = fromString("Deleting");

    /**
     * Static value Accepted for ProvisioningState.
     */
    public static final ProvisioningState ACCEPTED = fromString("Accepted");

    /**
     * Creates a new instance of ProvisioningState value.
     * 
     * @deprecated Use the {@link #fromString(String)} factory method.
     */
    @Deprecated
    public ProvisioningState() {
    }

    /**
     * Creates or finds a ProvisioningState from its string representation.
     * 
     * @param name a name to look for.
     * @return the corresponding ProvisioningState.
     */
    public static ProvisioningState fromString(String name) {
        return fromString(name, ProvisioningState.class);
    }

    /**
     * Gets known ProvisioningState values.
     * 
     * @return known ProvisioningState values.
     */
    public static Collection<ProvisioningState> values() {
        return values(ProvisioningState.class);
    }
}
