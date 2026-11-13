// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2024 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.batch;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.env.ICompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;
import java.io.File;
import java.io.IOException;

public class CompilationUnit implements ICompilationUnit {
    public char[] contents;
    public char[] fileName;
    public char[] mainTypeName;
    String encoding;

    public CompilationUnit(char[] contents, String encoding) {

        this.contents = contents;

        char[] fileNameCharArray = "".toCharArray();
        switch (File.separatorChar) {
            case '/':
                if (CharOperation.indexOf('\\', fileNameCharArray) != -1) {
                    CharOperation.replace(fileNameCharArray, '\\', '/');
                }
                break;

            case '\\':
                if (CharOperation.indexOf('/', fileNameCharArray) != -1) {
                    CharOperation.replace(fileNameCharArray, '/', '\\');
                }
        }
        this.fileName = fileNameCharArray;
        int start = CharOperation.lastIndexOf(File.separatorChar, fileNameCharArray) + 1;

        int end = CharOperation.lastIndexOf('.', fileNameCharArray);
        if (end == -1) {
            end = fileNameCharArray.length;
        }

        this.mainTypeName = CharOperation.subarray(fileNameCharArray, start, end);
        this.encoding = encoding;

    }

    @Override
    public char[] getContents() {
        if (this.contents != null)
            return this.contents;   // answer the cached source

        // otherwise retrieve it
        try {
            return Util.getFileCharContent(new File(new String(this.fileName)), this.encoding);
        } catch (IOException e) {
            this.contents = CharOperation.NO_CHAR; // assume no source if asked again
            throw new AbortCompilationUnit(e, this.encoding);
        }
    }

    /**
     */
    @Override
    public char[] getFileName() {
        return this.fileName;
    }

    @Override
    public char[] getMainTypeName() {
        return this.mainTypeName;
    }

    @Override
    public boolean ignoreOptionalProblems() {
        return false;
    }

    @Override
    public String toString() {
        return "CompilationUnit[" + new String(this.fileName) + "]";  //$NON-NLS-2$ //$NON-NLS-1$
    }

}
