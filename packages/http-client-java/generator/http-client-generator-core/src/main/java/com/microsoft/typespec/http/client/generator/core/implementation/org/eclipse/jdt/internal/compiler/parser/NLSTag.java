// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2009 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser;

public class NLSTag {

    public int start;
    public int end;
    public int lineNumber;

    public NLSTag(int start, int end, int lineNumber, int index) {
        this.start = start;
        this.end = end;
        this.lineNumber = lineNumber;

    }

    @Override
    public String toString() {
        return "NLSTag(" + this.start + "," + this.end + "," + this.lineNumber + ")"; //$NON-NLS-1$//$NON-NLS-2$//$NON-NLS-3$//$NON-NLS-4$
    }
}
