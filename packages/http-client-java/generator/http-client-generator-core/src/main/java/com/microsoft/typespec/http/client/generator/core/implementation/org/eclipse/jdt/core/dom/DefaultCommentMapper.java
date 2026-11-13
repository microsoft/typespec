// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2011 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;

/**
 * Internal class for associating comments with AST nodes.
 *
 * @since 3.0
 */
class DefaultCommentMapper {
    Comment[] comments;
    Scanner scanner;

    // extended nodes storage
    int leadingPtr;
    ASTNode[] leadingNodes;
    long[] leadingIndexes;
    int trailingPtr, lastTrailingPtr;
    ASTNode[] trailingNodes;
    long[] trailingIndexes;

    /**
     * @param table the given table of comments
     */
    DefaultCommentMapper(Comment[] table) {
        this.comments = table;
    }

    boolean hasSameTable(Comment[] table) {
        return this.comments == table;
    }

    /**
     * Get comment of the list which includes a given position
     *
     * @param position The position belonging to the looked up comment
     * @return comment which includes the given position or null if none was found
     */
    Comment getComment(int position) {
        if (this.comments == null) {
            return null;
        }
        int size = this.comments.length;
        if (size == 0) {
            return null;
        }
        int index = getCommentIndex(position, 0);
        if (index < 0) {
            return null;
        }
        return this.comments[index];
    }

    /*
     * Get the index of comment which contains given position. If there's no matching comment, then return depends on
     * exact parameter: = 0: return -1 < 0: return index of the comment before the given position > 0: return index of
     * the comment after the given position
     */
    private int getCommentIndex(int position, int exact) {

        if (position == 0) {
            if (this.comments.length > 0 && this.comments[0].getStartPosition() == 0) {
                return 0;
            }
            return -1;
        }
        int bottom = 0, top = this.comments.length - 1;
        int i = 0, index = -1;
        Comment comment = null;
        while (bottom <= top) {
            i = bottom + (top - bottom) / 2;
            comment = this.comments[i];
            int commentStart = comment.getStartPosition();
            if (position < commentStart) {
                top = i - 1;
            } else if (position >= (commentStart + comment.getLength())) {
                bottom = i + 1;
            } else {
                index = i;
                break;
            }
        }
        if (index < 0 && exact != 0) {
            comment = this.comments[i];
            if (position < comment.getStartPosition()) {
                return exact < 0 ? i - 1 : i;
            } else {
                return exact < 0 ? i : i + 1;
            }
        }
        return index;
    }

    /*
     * Search the line number corresponding to a specific position between the given line range (inclusive)
     *
     * @param position int
     *
     * @parem lineRange size-2 int[]
     *
     * @return int
     */
    public final int getLineNumber(int position, int[] lineRange) {
        int[] lineEnds = this.scanner.lineEnds;
        int length = lineEnds.length;
        return Util.getLineNumber(position, lineEnds, (lineRange[0] > length ? length : lineRange[0]) - 1,
            (lineRange[1] > length ? length : lineRange[1]) - 1);
    }

    /*
     * Initialize leading and trailing comments tables in whole nodes hierarchy of a compilation unit. Scanner is
     * necessary to scan between nodes and comments and verify if there's nothing else than white spaces.
     */
    void initialize(CompilationUnit unit, Scanner sc) {

        // Init array pointers
        this.leadingPtr = -1;
        this.trailingPtr = -1;

        // Init comments
        this.comments = unit.optionalCommentTable;
        if (this.comments == null) {
            return;
        }
        int size = this.comments.length;
        if (size == 0) {
            return;
        }

        // Init scanner and start ranges computing
        this.scanner = sc;
        this.scanner.tokenizeWhiteSpace = true;

        // Start unit visit
        DefaultASTVisitor commentVisitor = new CommentMapperVisitor();
        unit.accept(commentVisitor);

        // Reduce leading arrays if necessary
        int leadingCount = this.leadingPtr + 1;
        if (leadingCount > 0 && leadingCount < this.leadingIndexes.length) {
            System.arraycopy(this.leadingNodes, 0, this.leadingNodes = new ASTNode[leadingCount], 0, leadingCount);
            System.arraycopy(this.leadingIndexes, 0, this.leadingIndexes = new long[leadingCount], 0, leadingCount);
        }

        // Reduce trailing arrays if necessary
        if (this.trailingPtr >= 0) {
            // remove last remaining unresolved nodes
            while (this.trailingIndexes[this.trailingPtr] == -1) {
                this.trailingPtr--;
                if (this.trailingPtr < 0) {
                    this.trailingIndexes = null;
                    this.trailingNodes = null;
                    break;
                }
            }

            // reduce array size
            int trailingCount = this.trailingPtr + 1;
            if (trailingCount > 0 && trailingCount < this.trailingIndexes.length) {
                System.arraycopy(this.trailingNodes, 0, this.trailingNodes = new ASTNode[trailingCount], 0,
                    trailingCount);
                System.arraycopy(this.trailingIndexes, 0, this.trailingIndexes = new long[trailingCount], 0,
                    trailingCount);
            }
        }

        // Release scanner as it's only used during unit visit
        this.scanner = null;
    }

    /**
     * Search and store node leading comments. Comments are searched in position range from previous extended position
     * to node start position. If one or several comment are found, returns first comment start position, otherwise
     * returns node start position. <p> Starts to search for first comment before node start position and return if none
     * was found... </p><p> When first comment is found before node, goes up in comment list until one of following
     * conditions becomes true: <ol> <li>comment end is before previous end</li> <li>comment start and previous end is
     * on the same line but not on same line of node start</li> <li>there's other than white characters between current
     * node and comment</li> <li>there's more than 1 line between current node and comment</li> </ol> If some comment
     * have been found, then no token should be on on the same line before, so remove all comments which do not verify
     * this assumption. </p><p> If finally there's leading still comments, then stores indexes of the first and last one
     * in leading comments table.
     */
    int storeLeadingComments(ASTNode node, int previousEnd, int[] parentLineRange) {
        // Init extended position
        int nodeStart = node.getStartPosition();
        int extended = nodeStart;

        // Get line of node start position
        int previousEndLine = getLineNumber(previousEnd, parentLineRange);
        int nodeStartLine = getLineNumber(nodeStart, parentLineRange);

        // Find first comment index
        int idx = getCommentIndex(nodeStart, -1);
        if (idx == -1) {
            return nodeStart;
        }

        // Look after potential comments
        int startIdx = -1;
        int endIdx = idx;
        int previousStart = nodeStart;
        while (idx >= 0 && previousStart >= previousEnd) {
            // Verify for each comment that there's only white spaces between end and start of {following comment|node}
            Comment comment = this.comments[idx];
            int commentStart = comment.getStartPosition();
            int end = commentStart + comment.getLength() - 1;
            int commentLine = getLineNumber(commentStart, parentLineRange);
            if (end <= previousEnd || (commentLine == previousEndLine && commentLine != nodeStartLine)) {
                // stop search on condition 1) and 2)
                break;
            } else if ((end + 1) < previousStart) { // may be equals => then no scan is necessary
                this.scanner.resetTo(end + 1, previousStart);
                try {
                    TerminalToken token = this.scanner.getNextToken();
                    if (token != TerminalToken.TokenNameWHITESPACE || this.scanner.currentPosition != previousStart) {
                        // stop search on condition 3)
                        // if first comment fails, then there's no extended position in fact
                        if (idx == endIdx) {
                            return nodeStart;
                        }
                        break;
                    }
                } catch (InvalidInputException e) {
                    // Should not happen, but return no extended position...
                    return nodeStart;
                }
                // verify that there's no more than one line between node/comments
                char[] gap = this.scanner.getCurrentIdentifierSource();
                int nbrLine = 0;
                int pos = -1;
                while ((pos = CharOperation.indexOf('\n', gap, pos + 1)) >= 0) {
                    nbrLine++;
                }
                if (nbrLine > 1) {
                    // stop search on condition 4)
                    break;
                }
            }
            // Store previous infos
            previousStart = commentStart;
            startIdx = idx--;
        }
        if (startIdx != -1) {
            // Verify that there's no token on the same line before first leading comment
            int commentStart = this.comments[startIdx].getStartPosition();
            if (previousEnd < commentStart && previousEndLine != nodeStartLine) {
                int lastTokenEnd = previousEnd;
                this.scanner.resetTo(previousEnd, commentStart);
                try {
                    while (this.scanner.currentPosition < commentStart) {
                        if (this.scanner.getNextToken() != TerminalToken.TokenNameWHITESPACE) {
                            lastTokenEnd = this.scanner.getCurrentTokenEndPosition();
                        }
                    }
                } catch (InvalidInputException e) {
                    // do nothing
                }
                int lastTokenLine = getLineNumber(lastTokenEnd, parentLineRange);
                int length = this.comments.length;
                while (startIdx < length
                    && lastTokenLine == getLineNumber(this.comments[startIdx].getStartPosition(), parentLineRange)
                    && nodeStartLine != lastTokenLine) {
                    startIdx++;
                }
            }
            // Store leading comments indexes
            if (startIdx <= endIdx) {
                if (++this.leadingPtr == 0) {
                    this.leadingNodes = new ASTNode[16];
                    this.leadingIndexes = new long[16];
                } else if (this.leadingPtr == this.leadingNodes.length) {
                    int newLength = (this.leadingPtr * 3 / 2) + 16;
                    System.arraycopy(this.leadingNodes, 0, this.leadingNodes = new ASTNode[newLength], 0,
                        this.leadingPtr);
                    System.arraycopy(this.leadingIndexes, 0, this.leadingIndexes = new long[newLength], 0,
                        this.leadingPtr);
                }
                this.leadingNodes[this.leadingPtr] = node;
                this.leadingIndexes[this.leadingPtr] = (((long) startIdx) << 32) + endIdx;
                extended = this.comments[endIdx].getStartPosition();
            }
        }
        return extended;
    }

    /**
     * Search and store node trailing comments. Comments are searched in position range from node end position to
     * specified next start. If one or several comment are found, returns last comment end position, otherwise returns
     * node end position. <p> Starts to search for first comment after node end position and return if none was found...
     * </p><p> When first comment is found after node, goes down in comment list until one of following conditions
     * becomes true: <ol> <li>comment start is after next start</li> <li>there's other than white characters between
     * current node and comment</li> <li>there's more than 1 line between current node and comment</li> </ol> If at
     * least potential comments have been found, then all of them has to be separated from following node. So, remove
     * all comments which do not verify this assumption. Note that this verification is not applicable on last node.
     * </p><p> If finally there's still trailing comments, then stores indexes of the first and last one in trailing
     * comments table.
     */
    int storeTrailingComments(ASTNode node, int nextStart, boolean lastChild, int[] parentLineRange) {

        // Init extended position
        int nodeEnd = node.getStartPosition() + node.getLength() - 1;
        if (nodeEnd == nextStart) {
            // special case for last child of its parent
            if (++this.trailingPtr == 0) {
                this.trailingNodes = new ASTNode[16];
                this.trailingIndexes = new long[16];
                this.lastTrailingPtr = -1;
            } else if (this.trailingPtr == this.trailingNodes.length) {
                int newLength = (this.trailingPtr * 3 / 2) + 16;
                System.arraycopy(this.trailingNodes, 0, this.trailingNodes = new ASTNode[newLength], 0,
                    this.trailingPtr);
                System.arraycopy(this.trailingIndexes, 0, this.trailingIndexes = new long[newLength], 0,
                    this.trailingPtr);
            }
            this.trailingNodes[this.trailingPtr] = node;
            this.trailingIndexes[this.trailingPtr] = -1;
            return nodeEnd;
        }
        int extended = nodeEnd;

        // Get line number
        int nodeEndLine = getLineNumber(nodeEnd, parentLineRange);

        // Find comments range index
        int idx = getCommentIndex(nodeEnd, 1);
        if (idx == -1) {
            return nodeEnd;
        }

        // Look after potential comments
        int startIdx = idx;
        int endIdx = -1;
        int length = this.comments.length;
        int commentStart = extended + 1;
        int previousEnd = nodeEnd + 1;
        int sameLineIdx = -1;
        while (idx < length && commentStart < nextStart) {
            // get comment and leave if next starting position has been reached
            Comment comment = this.comments[idx];
            commentStart = comment.getStartPosition();
            // verify that there's nothing else than white spaces between node/comments
            if (commentStart >= nextStart) {
                // stop search on condition 1)
                break;
            } else if (previousEnd < commentStart) {
                this.scanner.resetTo(previousEnd, commentStart);
                try {
                    TerminalToken token = this.scanner.getNextToken();
                    if (token != TerminalToken.TokenNameWHITESPACE || this.scanner.currentPosition != commentStart) {
                        // stop search on condition 2)
                        // if first index fails, then there's no extended position in fact...
                        if (idx == startIdx) {
                            return nodeEnd;
                        }
                        // otherwise we get the last index of trailing comment => break
                        break;
                    }
                } catch (InvalidInputException e) {
                    // Should not happen, but return no extended position...
                    return nodeEnd;
                }
                // verify that there's no more than one line between node/comments
                char[] gap = this.scanner.getCurrentIdentifierSource();
                int nbrLine = 0;
                int pos = -1;
                while ((pos = CharOperation.indexOf('\n', gap, pos + 1)) >= 0) {
                    nbrLine++;
                }
                if (nbrLine > 1) {
                    // stop search on condition 3)
                    break;
                }
            }
            // Store index if we're on the same line than node end
            int commentLine = getLineNumber(commentStart, parentLineRange);
            if (commentLine == nodeEndLine) {
                sameLineIdx = idx;
            }
            // Store previous infos
            previousEnd = commentStart + comment.getLength();
            endIdx = idx++;
        }
        if (endIdx != -1) {
            // Verify that following node start is separated
            if (!lastChild) {
                int nextLine = getLineNumber(nextStart, parentLineRange);
                int previousLine = getLineNumber(previousEnd, parentLineRange);
                if ((nextLine - previousLine) <= 1) {
                    if (sameLineIdx == -1)
                        return nodeEnd;
                    endIdx = sameLineIdx;
                }
            }
            // Store trailing comments indexes
            if (++this.trailingPtr == 0) {
                this.trailingNodes = new ASTNode[16];
                this.trailingIndexes = new long[16];
                this.lastTrailingPtr = -1;
            } else if (this.trailingPtr == this.trailingNodes.length) {
                int newLength = (this.trailingPtr * 3 / 2) + 16;
                System.arraycopy(this.trailingNodes, 0, this.trailingNodes = new ASTNode[newLength], 0,
                    this.trailingPtr);
                System.arraycopy(this.trailingIndexes, 0, this.trailingIndexes = new long[newLength], 0,
                    this.trailingPtr);
            }
            this.trailingNodes[this.trailingPtr] = node;
            long nodeRange = (((long) startIdx) << 32) + endIdx;
            this.trailingIndexes[this.trailingPtr] = nodeRange;
            // Compute new extended end
            extended = this.comments[endIdx].getStartPosition() + this.comments[endIdx].getLength() - 1;
            // Look for children unresolved extended end
            ASTNode previousNode = node;
            int ptr = this.trailingPtr - 1; // children extended end were stored before
            while (ptr >= 0) {
                long range = this.trailingIndexes[ptr];
                if (range != -1)
                    break; // there's no more unresolved nodes
                ASTNode unresolved = this.trailingNodes[ptr];
                if (previousNode != unresolved.getParent())
                    break; // we're no longer in node ancestor hierarchy
                this.trailingIndexes[ptr] = nodeRange;
                previousNode = unresolved;
                ptr--; // get previous node
            }
            // Remove remaining unresolved nodes
            if (ptr > this.lastTrailingPtr) {
                int offset = ptr - this.lastTrailingPtr;
                for (int i = ptr + 1; i <= this.trailingPtr; i++) {
                    this.trailingNodes[i - offset] = this.trailingNodes[i];
                    this.trailingIndexes[i - offset] = this.trailingIndexes[i];
                }
                this.trailingPtr -= offset;
            }
            this.lastTrailingPtr = this.trailingPtr;
        }
        return extended;
    }

    class CommentMapperVisitor extends DefaultASTVisitor {

        ASTNode topSiblingParent = null;
        ASTNode[] siblings = new ASTNode[10];
        int[][] parentLineRange = new int[10][];
        int siblingPtr = -1;

        @Override
        protected boolean visitNode(ASTNode node) {

            // Get default previous end
            ASTNode parent = node.getParent();
            int previousEnd = parent.getStartPosition();

            // Look for sibling node
            ASTNode sibling = parent == this.topSiblingParent ? (ASTNode) this.siblings[this.siblingPtr] : null;
            if (sibling != null) {
                // Found one previous sibling, so compute its trailing comments using current node start position
                try {
                    previousEnd = storeTrailingComments(sibling, node.getStartPosition(), false,
                        this.parentLineRange[this.siblingPtr]);
                } catch (Exception ex) {
                    // Give up extended ranges at this level if unexpected exception happens...
                }
            }

            // Stop visit for malformed node (see bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=84049)
            if ((node.typeAndFlags & 1) != 0) {
                return false;
            }

            // Compute leading comments for current node
            int[] previousLineRange = this.siblingPtr > -1
                ? this.parentLineRange[this.siblingPtr]
                : new int[] { 1, DefaultCommentMapper.this.scanner.linePtr + 1 };
            try {
                storeLeadingComments(node, previousEnd, previousLineRange);
            } catch (Exception ex) {
                // Give up extended ranges at this level if unexpected exception happens...
            }

            // Store current node as waiting sibling for its parent
            if (this.topSiblingParent != parent) {
                if (this.siblings.length == ++this.siblingPtr) {
                    System.arraycopy(this.siblings, 0, this.siblings = new ASTNode[this.siblingPtr * 2], 0,
                        this.siblingPtr);
                    System.arraycopy(this.parentLineRange, 0, this.parentLineRange = new int[this.siblingPtr * 2][], 0,
                        this.siblingPtr);
                }
                if (this.topSiblingParent == null) {
                    // node is a CompilationUnit
                    this.parentLineRange[this.siblingPtr] = previousLineRange;
                } else {
                    int parentStart = parent.getStartPosition();
                    int firstLine = getLineNumber(parentStart, previousLineRange);
                    int lastLine = getLineNumber(parentStart + parent.getLength() - 1, previousLineRange);
                    if (this.parentLineRange[this.siblingPtr] == null) {
                        this.parentLineRange[this.siblingPtr] = new int[] { firstLine, lastLine };
                    } else {
                        int[] lineRange = this.parentLineRange[this.siblingPtr];
                        lineRange[0] = firstLine;
                        lineRange[1] = lastLine;
                    }
                }
                this.topSiblingParent = parent;
            }
            this.siblings[this.siblingPtr] = node;

            // We're always ok to visit sub-levels
            return true;
        }

        @Override
        protected void endVisitNode(ASTNode node) {

            // Look if a child node is waiting for trailing comments computing
            ASTNode sibling = this.topSiblingParent == node ? (ASTNode) this.siblings[this.siblingPtr] : null;
            if (sibling != null) {
                try {
                    storeTrailingComments(sibling, node.getStartPosition() + node.getLength() - 1, true,
                        this.parentLineRange[this.siblingPtr]);
                } catch (Exception ex) {
                    // Give up extended ranges at this level if unexpected exception happens...
                }
            }
            // Remove sibling if needed
            if (this.topSiblingParent != null /* not a CompilationUnit */
                && this.topSiblingParent == node) {
                this.siblingPtr--;
                this.topSiblingParent = node.getParent();
            }
        }

        @Override
        public boolean visit(Modifier modifier) {
            // we don't want to map comment to the modifier
            return false;
        }

        @Override
        public boolean visit(CompilationUnit node) {
            // do nothing special, just go down in sub-levels
            return true;
        }
    }
}
