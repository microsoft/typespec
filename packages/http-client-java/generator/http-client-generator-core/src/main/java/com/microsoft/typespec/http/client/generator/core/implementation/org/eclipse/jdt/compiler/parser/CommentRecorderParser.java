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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ProblemHandler;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CompilationUnitDeclaration;

/**
 * Internal parser used for parsing source to create DOM AST nodes.
 *
 * @since 3.0
 */
public class CommentRecorderParser extends Parser {

    // support for comments
    int[] commentStops = new int[10];
    int[] commentStarts = new int[10];
    int commentPtr = -1; // no comment test with commentPtr value -1

    public CommentRecorderParser(ProblemHandler problemReporter) {
        super(problemReporter);
    }

    // old javadoc style check which doesn't include all leading comments into declaration
    // for backward compatibility with 2.1 DOM
    @Override
    public void checkComment() {

        // discard obsolete comments while inside methods or fields initializer (see bug 74369)
        if (!(this.diet && this.dietInt == 0) && this.scanner.commentPtr >= 0) {
            flushCommentsDefinedPriorTo(this.endStatementPosition);
        }
        boolean deprecated = false;
        int lastCommentIndex;

        // since jdk1.2 look only in the last java doc comment...
        for (lastCommentIndex = this.scanner.commentPtr; lastCommentIndex >= 0; lastCommentIndex--) {
            // look for @deprecated into the first javadoc comment preceeding the declaration
            int commentSourceStart = this.scanner.commentStarts[lastCommentIndex];
            // javadoc only (non javadoc comment have negative start and/or end positions.)
            if ((commentSourceStart < 0)
                || (this.modifiersSourceStart != -1 && this.modifiersSourceStart < commentSourceStart)
                || (this.scanner.commentStops[lastCommentIndex] < 0)) {
                continue;
            }
            int commentSourceEnd = this.scanner.commentStops[lastCommentIndex] - 1; // stop is one over
            // do not report problem before last parsed comment while recovering code...
            this.javadocParser.reportProblems = this.currentElement == null || commentSourceEnd > this.lastJavadocEnd;
            deprecated = this.javadocParser.checkDeprecation(lastCommentIndex);
            this.javadoc = this.javadocParser.docComment;
            if (this.currentElement == null)
                this.lastJavadocEnd = commentSourceEnd;
            break;
        }
        if (deprecated) {
            checkAndSetModifiers(1048576);
        }
        // modify the modifier source start to point at the first comment
        if (lastCommentIndex >= 0) {
            int lastCommentStart = this.scanner.commentStarts[lastCommentIndex];
            if (lastCommentStart < 0)
                lastCommentStart = -lastCommentStart;
            if (this.forStartPosition == 0 || this.forStartPosition < lastCommentStart) {// only if there is no "for" in
                                                                                         // between
                this.modifiersSourceStart = lastCommentStart;
            }
        }
    }

    @Override
    protected void consumeAnnotationTypeDeclarationHeader() {
        pushOnCommentsStack(this.scanner.commentPtr);
        super.consumeAnnotationTypeDeclarationHeader();
    }

    @Override
    protected void consumeClassHeader() {
        pushOnCommentsStack(this.scanner.commentPtr);
        super.consumeClassHeader();
    }

    @Override
    protected void consumeEmptyTypeDeclaration() {
        pushOnCommentsStack(this.scanner.commentPtr);
        super.consumeEmptyTypeDeclaration();
    }

    @Override
    protected void consumeEnterAnonymousClassBody(boolean qualified) {
        pushOnCommentsStack(this.scanner.commentPtr);
        super.consumeEnterAnonymousClassBody(qualified);
    }

    @Override
    protected void consumeEnumHeader() {
        pushOnCommentsStack(this.scanner.commentPtr);
        super.consumeEnumHeader();
    }

    @Override
    protected void consumeInterfaceHeader() {
        pushOnCommentsStack(this.scanner.commentPtr);
        super.consumeInterfaceHeader();
    }

    @Override
    protected CompilationUnitDeclaration endParse(int act) {
        CompilationUnitDeclaration unit = super.endParse(act);
        if (unit.comments == null) {
            pushOnCommentsStack(this.scanner.commentPtr);
            unit.comments = getCommentsPositions();
        }
        return unit;
    }

    /*
     * Save all source comments currently stored before flushing them.
     */
    @Override
    public int flushCommentsDefinedPriorTo(int position) {
        int lastCommentIndex = getCommentPtr();
        if (lastCommentIndex < 0)
            return position; // no comment

        // compute the index of the first obsolete comment
        int index = lastCommentIndex;
        int validCount = 0;
        while (index >= 0) {
            int commentEnd = this.scanner.commentStops[index];
            if (commentEnd < 0)
                commentEnd = -commentEnd; // negative end position for non-javadoc comments
            if (commentEnd <= position) {
                break;
            }
            index--;
            validCount++;
        }
        // if the source at <position> is immediately followed by a line comment, then
        // flush this comment and shift <position> to the comment end.
        if (validCount > 0) {
            int immediateCommentEnd;
            while (index < lastCommentIndex && (immediateCommentEnd = -this.scanner.commentStops[index + 1]) > 0) {
                // is there any line break until the end of the immediate comment ? (thus only tolerating line comment)
                immediateCommentEnd--; // comment end in one char too far
                if (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.Util
                    .getLineNumber(position, this.scanner.lineEnds, this.scanner.linePtr)
                    != com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.Util
                        .getLineNumber(immediateCommentEnd, this.scanner.lineEnds, this.scanner.linePtr))
                    break;
                position = immediateCommentEnd;
                validCount--; // flush this comment
                index++;
            }
        }

        if (index < 0)
            return position; // no obsolete comment
        pushOnCommentsStack(index); // store comment before flushing them

        switch (validCount) {
            case 0:
                // do nothing
                break;

            // move valid comment infos, overriding obsolete comment infos
            case 2:
                this.scanner.copyCommentInfo(0, index + 1);
                this.scanner.copyCommentInfo(1, index + 2);
                break;

            case 1:
                this.scanner.copyCommentInfo(0, index + 1);
                break;

            default:
                this.scanner.copyAllCommentInfo(index + 1, validCount);
        }
        this.scanner.commentPtr = validCount - 1;
        return position;
    }

    @Override
    protected void consumeExitTryBlock() {
        flushCommentsDefinedPriorTo(this.scanner.currentPosition);
        super.consumeExitTryBlock();
    }

    protected int getCommentPtr() {
        int lastComment = this.scanner.commentPtr;
        if (lastComment == -1 && this.currentElement != null) {
            // during recovery reuse comments from initial scan ...
            lastComment = this.commentPtr;
            if (lastComment >= 0) {
                // ... but ignore if not suitable ...
                if (lastComment >= this.scanner.commentStarts.length) {
                    return -1;
                } else {
                    int start = this.scanner.commentStarts[lastComment];
                    // ... unsuitable if:
                    // - unknown to the scanner (start == 0)
                    // - line comment (start < 0)
                    if (start <= 0)
                        return -1;
                    // - past the current position, or start of previous recovered element
                    int currentStart = this.currentElement.getLastStart();
                    if (currentStart == -1)
                        currentStart = this.scanner.currentPosition;
                    if (start > currentStart)
                        return -1;
                }
            }
        }
        return lastComment;
    }

    /*
     * Build a n*2 matrix of comments positions. For each position, 0 is for start position and 1 for end position of
     * the comment.
     */
    public int[][] getCommentsPositions() {
        int[][] positions = new int[this.commentPtr + 1][2];
        for (int i = 0, max = this.commentPtr; i <= max; i++) {
            positions[i][0] = this.commentStarts[i];
            positions[i][1] = this.commentStops[i];
        }
        return positions;
    }

    @Override
    public void initialize(boolean parsingCompilationUnit) {
        super.initialize(parsingCompilationUnit);
        this.commentPtr = -1;
    }

    @Override
    public void initialize() {
        super.initialize();
        this.commentPtr = -1;
    }

    /*
     * Create and store a specific comment recorder scanner.
     */
    @Override
    public void initializeScanner() {
        this.scanner = new Scanner(false /* comment */);
    }

    /*
     * Push all stored comments in stack.
     */
    private void pushOnCommentsStack(int end) {

        for (int i = 0; i <= end; i++) {
            if (this.scanner.commentPtr < i)
                break;
            // First see if comment hasn't been already stored
            int scannerStart
                = this.scanner.commentStarts[i] < 0 ? -this.scanner.commentStarts[i] : this.scanner.commentStarts[i];
            int commentStart = this.commentPtr == -1
                ? -1
                : (this.commentStarts[this.commentPtr] < 0
                    ? -this.commentStarts[this.commentPtr]
                    : this.commentStarts[this.commentPtr]);
            if (commentStart == -1 || scannerStart > commentStart) {
                int stackLength = this.commentStarts.length;
                if (++this.commentPtr >= stackLength) {
                    System.arraycopy(this.commentStarts, 0, this.commentStarts = new int[stackLength + 100], 0,
                        stackLength);
                    System.arraycopy(this.commentStops, 0, this.commentStops = new int[stackLength + 100], 0,
                        stackLength);
                }
                this.commentStarts[this.commentPtr] = this.scanner.commentStarts[i];
                this.commentStops[this.commentPtr] = this.scanner.commentStops[i];
            }
        }
    }

    /*
     * Save all source comments currently stored before flushing them. this.scanner.commentPtr is expected
     * *not* yet being reset before calling this method.
     */
    @Override
    protected void resetModifiers() {
        pushOnCommentsStack(this.scanner.commentPtr);
        super.resetModifiers();
    }
}
