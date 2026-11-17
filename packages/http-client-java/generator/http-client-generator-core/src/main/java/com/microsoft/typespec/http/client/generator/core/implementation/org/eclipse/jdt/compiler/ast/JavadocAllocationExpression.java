// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class JavadocAllocationExpression extends AllocationExpression {

    public JavadocAllocationExpression(int start, int end) {
        this.sourceStart = start;
        this.sourceEnd = end;
        this.bits |= 32768;
    }

    public JavadocAllocationExpression(long pos) {
        this((int) (pos >>> 32), (int) pos);
    }

}
