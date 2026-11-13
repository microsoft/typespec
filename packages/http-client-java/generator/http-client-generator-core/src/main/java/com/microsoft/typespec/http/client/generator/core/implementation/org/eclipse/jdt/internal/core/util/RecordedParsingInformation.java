// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2002, 2009 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.util;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;

/**
 * Use to keep track of recorded information during the parsing like comment positions, line ends or problems.
 */
public class RecordedParsingInformation {
    public IProblem[] problems;
    public int problemsCount;
    public int[] lineEnds;
    public int[][] commentPositions;

    public RecordedParsingInformation(IProblem[] problems, int[] lineEnds, int[][] commentPositions) {
        this.problems = problems;
        this.lineEnds = lineEnds;
        this.commentPositions = commentPositions;
        this.problemsCount = problems != null ? problems.length : 0;
    }
}
