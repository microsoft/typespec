// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2005 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text;

/**
 * A region describes a certain range in an indexed text store. Text stores are for example documents or strings. A
 * region is defined by its offset into the text store and its length. <p> A region is considered a value object. Its
 * offset and length do not change over time. <p> Clients may implement this interface or use the standard
 * implementation
 * {@link com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.Region}. </p>
 */
public interface IRegion {

    /**
     * Returns the length of the region.
     *
     * @return the length of the region
     */
    int getLength();

    /**
     * Returns the offset of the region.
     *
     * @return the offset of the region
     */
    int getOffset();
}
