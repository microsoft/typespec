// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2008 IBM Corporation and others.
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

/*******************************************************************************
 * Copyright (c) 2000, 2015 IBM Corporation and others.
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

/*******************************************************************************
 * Copyright (c) 2005, 2015 IBM Corporation and others.
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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ILineTrackerExtension.DelimiterInfo;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import java.util.ListIterator;
import java.util.Objects;

/**
 * Abstract implementation of <code>ILineTracker</code>. It lets the definition of line delimiters to subclasses.
 * Assuming that '\n' is the only line delimiter, this abstract implementation defines the following line scheme: <ul>
 * <li> "" -&gt; [0,0] <li> "a" -&gt; [0,1] <li> "\n" -&gt; [0,1], [1,0] <li> "a\n" -&gt; [0,2], [2,0] <li> "a\nb" -&gt;
 * [0,2], [2,1] <li> "a\nbc\n" -&gt; [0,2], [2,3], [5,0] </ul> <p> This class must be subclassed. </p> <p>
 * <strong>Performance:</strong> The query operations perform in <i>O(log n)</i> where <var>n</var> is the number of
 * lines in the document. The modification operations roughly perform in <i>O(l * log n)</i> where <var>n</var> is the
 * number of lines in the document and <var>l</var> is the sum of the number of removed, added or modified lines. </p>
 *
 * @since 3.2
 */
public class TreeLineTracker implements ILineTracker {
    private final com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ILineTrackerExtension _typespecOuter;

    /**
     * Package visible constructor for creating a tree tracker from a list tracker.
     *
     * @param tracker the list line tracker
     */
    public TreeLineTracker(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ILineTrackerExtension _typespecOuter,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ListLineTracker tracker) {
        super();
        this._typespecOuter = _typespecOuter;

        final List<Line> lines = tracker.getLines();
        final int n = lines.size();
        if (n == 0) {
            return;
        }

        Line line = lines.get(0);
        String delim = line.delimiter;
        if (delim == null) {
            delim = "";
        }
        int length = line.length;
        fRoot = new Node(length, delim);
        Node node = fRoot;

        for (int i = 1; i < n; i++) {
            line = lines.get(i);
            delim = line.delimiter;
            if (delim == null) {
                delim = "";
            }
            length = line.length;
            node = insertAfter(node, length, delim);
        }

        if (node.delimiter != "") {
            insertAfter(node, 0, "");
        }
    }

    /**
     * A node represents one line. Its character and line offsets are 0-based and relative to the subtree covered by the
     * node. All nodes under the left subtree represent lines before, all nodes under the right subtree lines after the
     * current node.
     */
    private static final class Node {
        Node(int length, String delimiter) {
            this.length = length;
            this.delimiter = delimiter;
        }

        /**
         * The line index in this node's line tree, or equivalently, the number of lines in the left subtree.
         */
        int line;
        /**
         * The line offset in this node's line tree, or equivalently, the number of characters in the left subtree.
         */
        int offset;
        /** The number of characters in this line. */
        int length;
        /** The line delimiter of this line, needed to answer the delimiter query. */
        String delimiter;
        /** The parent node, <code>null</code> if this is the root node. */
        Node parent;
        /** The left subtree, possibly <code>null</code>. */
        Node left;
        /** The right subtree, possibly <code>null</code>. */
        Node right;
        /** The balance factor. */
        byte balance;

        @Override
        public String toString() {
            String bal = switch (balance) {
                case 0 -> "="; //$NON-NLS-1$
                case 1 -> "+"; //$NON-NLS-1$
                case 2 -> "++"; //$NON-NLS-1$
                case -1 -> "-"; //$NON-NLS-1$
                case -2 -> "--"; //$NON-NLS-1$
                default -> Byte.toString(balance);
            };
            return "[" + offset + "+" + pureLength() + "+" + delimiter.length() + "|" + line + "|" + bal + "]"; //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$ //$NON-NLS-5$ //$NON-NLS-6$
        }

        /**
         * Returns the pure (without the line delimiter) length of this line.
         *
         * @return the pure line length
         */
        int pureLength() {
            return length - delimiter.length();
        }
    }

    /**
     * The root node of the tree, never <code>null</code>.
     */
    private Node fRoot = new Node(0, "");

    /**
     * Returns the node (line) including a certain offset. If the offset is between two lines, the line starting at
     * <code>offset</code> is returned. <p> This means that for offsets smaller than the length, the following holds:
     * </p> <p> <code>line.offset &lt;= offset &lt; line.offset + offset.length</code>. </p> <p> If <code>offset</code>
     * is the document length, then this is true: </p> <p> <code>offset= line.offset + line.length</code>. </p>
     *
     * @param offset a document offset
     * @return the line starting at or containing <code>offset</code>
     * @throws BadLocationException if the offset is invalid
     */
    private Node nodeByOffset(final int offset) throws BadLocationException {
        /*
         * Works for any binary search tree.
         */
        int remaining = offset;
        Node node = fRoot;
        while (true) {
            if (node == null) {
                throw new BadLocationException(Integer.toString(offset));
            }

            if (remaining < node.offset) {
                node = node.left;
            } else {
                remaining -= node.offset;
                if (remaining < node.length || remaining == node.length && node.right == null) { // last line
                    break;
                }
                remaining -= node.length;
                node = node.right;
            }
        }

        return node;
    }

    /**
     * Left rotation - the given node is rotated down, its right child is rotated up, taking the previous structural
     * position of <code>node</code>.
     *
     * @param node the node to rotate around
     */
    private void rotateLeft(Node node) {
        Node child = node.right;
        boolean leftChild = node.parent == null || node == node.parent.left;

        // restructure
        setChild(node.parent, child, leftChild);

        setChild(node, child.left, false);
        setChild(child, node, true);

        // update relative info
        // child becomes the new parent, its line and offset counts increase as the former parent
        // moves under child's left subtree
        child.line += node.line + 1;
        child.offset += node.offset + node.length;
    }

    /**
     * Right rotation - the given node is rotated down, its left child is rotated up, taking the previous structural
     * position of <code>node</code>.
     *
     * @param node the node to rotate around
     */
    private void rotateRight(Node node) {
        Node child = node.left;
        boolean leftChild = node.parent == null || node == node.parent.left;

        setChild(node.parent, child, leftChild);

        setChild(node, child.right, true);
        setChild(child, node, false);

        // update relative info
        // node loses its left subtree, except for what it keeps in its new subtree
        // this is exactly the amount in child
        node.line -= child.line + 1;
        node.offset -= child.offset + child.length;
    }

    /**
     * Helper method for moving a child, ensuring that parent pointers are set correctly.
     *
     * @param parent the new parent of <code>child</code>, <code>null</code> to replace the root node
     * @param child the new child of <code>parent</code>, may be <code>null</code>
     * @param isLeftChild <code>true</code> if <code>child</code> shall become <code>parent</code>'s left child,
     * <code>false</code> if it shall become <code>parent</code>'s right child
     */
    private void setChild(Node parent, Node child, boolean isLeftChild) {
        if (parent == null) {
            fRoot = Objects.requireNonNullElseGet(child, () -> new Node(0, ""));
        } else {
            if (isLeftChild) {
                parent.left = child;
            } else {
                parent.right = child;
            }
        }
        if (child != null) {
            child.parent = parent;
        }
    }

    /**
     * A left rotation around <code>parent</code>, whose structural position is replaced by <code>node</code>.
     *
     * @param node the node moving up and left
     * @param parent the node moving left and down
     */
    private void singleLeftRotation(Node node, Node parent) {
        rotateLeft(parent);
        node.balance = 0;
        parent.balance = 0;
    }

    /**
     * A right rotation around <code>parent</code>, whose structural position is replaced by <code>node</code>.
     *
     * @param node the node moving up and right
     * @param parent the node moving right and down
     */
    private void singleRightRotation(Node node, Node parent) {
        rotateRight(parent);
        node.balance = 0;
        parent.balance = 0;
    }

    /**
     * A double left rotation, first rotating right around <code>node</code>, then left around <code>parent</code>.
     *
     * @param node the node that will be rotated right
     * @param parent the node moving left and down
     */
    private void rightLeftRotation(Node node, Node parent) {
        Node child = node.left;
        rotateRight(node);
        rotateLeft(parent);
        if (child.balance == 1) {
            node.balance = 0;
            parent.balance = -1;
            child.balance = 0;
        } else if (child.balance == 0) {
            node.balance = 0;
            parent.balance = 0;
        } else if (child.balance == -1) {
            node.balance = 1;
            parent.balance = 0;
            child.balance = 0;
        }
    }

    /**
     * A double right rotation, first rotating left around <code>node</code>, then right around <code>parent</code>.
     *
     * @param node the node that will be rotated left
     * @param parent the node moving right and down
     */
    private void leftRightRotation(Node node, Node parent) {
        Node child = node.right;
        rotateLeft(node);
        rotateRight(parent);
        if (child.balance == -1) {
            node.balance = 0;
            parent.balance = 1;
            child.balance = 0;
        } else if (child.balance == 0) {
            node.balance = 0;
            parent.balance = 0;
        } else if (child.balance == 1) {
            node.balance = -1;
            parent.balance = 0;
            child.balance = 0;
        }
    }

    /**
     * Inserts a line with the given length and delimiter after <code>node</code>.
     *
     * @param node the predecessor of the inserted node
     * @param length the line length of the inserted node
     * @param delimiter the delimiter of the inserted node
     * @return the inserted node
     */
    private Node insertAfter(Node node, int length, String delimiter) {
        /*
         * An insertion really shifts the key of all succeeding nodes. Hence we insert the added node between node and
         * the successor of node. The added node becomes either the right child of the predecessor node, or the left
         * child of the successor node.
         */
        Node added = new Node(length, delimiter);

        if (node.right == null) {
            setChild(node, added, false);
        } else {
            setChild(successorDown(node.right), added, true);
        }

        // parent chain update
        updateParentChain(added, length, 1);
        updateParentBalanceAfterInsertion(added);

        return added;
    }

    /**
     * Updates the balance information in the parent chain of node until it reaches the root or finds a node whose
     * balance violates the AVL constraint, which is the re-balanced.
     *
     * @param node the child of the first node that needs balance updating
     */
    private void updateParentBalanceAfterInsertion(Node node) {
        Node parent = node.parent;
        while (parent != null) {
            if (node == parent.left) {
                parent.balance--;
            } else {
                parent.balance++;
            }

            switch (parent.balance) {
                case 1:
                case -1:
                    node = parent;
                    parent = node.parent;
                    continue;

                case -2:
                    rebalanceAfterInsertionLeft(node);
                    break;

                case 2:
                    rebalanceAfterInsertionRight(node);
                    break;

                case 0:
                    break;

                default:
            }
            return;
        }
    }

    /**
     * Re-balances a node whose parent has a double positive balance.
     *
     * @param node the node to re-balance
     */
    private void rebalanceAfterInsertionRight(Node node) {
        Node parent = node.parent;
        if (node.balance == 1) {
            singleLeftRotation(node, parent);
        } else if (node.balance == -1) {
            rightLeftRotation(node, parent);
        }
    }

    /**
     * Re-balances a node whose parent has a double negative balance.
     *
     * @param node the node to re-balance
     */
    private void rebalanceAfterInsertionLeft(Node node) {
        Node parent = node.parent;
        if (node.balance == -1) {
            singleRightRotation(node, parent);
        } else if (node.balance == 1) {
            leftRightRotation(node, parent);
        }
    }

    @Override
    public final void replace(int offset, int length, String text) throws BadLocationException {

        // Inlined nodeByOffset as we need both node and offset
        int remaining = offset;
        Node first = fRoot;
        final int firstNodeOffset;

        while (true) {
            if (first == null) {
                throw new BadLocationException(Integer.toString(offset));
            }

            if (remaining < first.offset) {
                first = first.left;
            } else {
                remaining -= first.offset;
                if (remaining < first.length || remaining == first.length && first.right == null) { // last line
                    firstNodeOffset = offset - remaining;
                    break;
                }
                remaining -= first.length;
                first = first.right;
            }
        }
        // Inline nodeByOffset end

        Node last;
        if (offset + length < firstNodeOffset + first.length) {
            last = first;
        } else {
            last = nodeByOffset(offset + length);
        }

        int firstLineDelta = firstNodeOffset + first.length - offset;
        if (first == last) {
            replaceInternal(first, text, length, firstLineDelta);
        } else {
            replaceFromTo(first, last, text, length, firstLineDelta);
        }
    }

    /**
     * Replace happening inside a single line.
     *
     * @param node the affected node
     * @param text the added text
     * @param length the replace length, &lt; <code>firstLineDelta</code>
     * @param firstLineDelta the number of characters from the replacement offset to the end of <code>node</code> &gt;
     * <code>length</code>
     */
    private void replaceInternal(Node node, String text, int length, int firstLineDelta) {
        // 1) modification on a single line

        DelimiterInfo info = text == null ? null : nextDelimiterInfo(text, 0);

        if (info == null || info.delimiter == null) {
            // a) trivial case: insert into a single node, no line mangling
            int added = text == null ? 0 : text.length();
            updateLength(node, added - length);
        } else {
            // b) more lines to add between two chunks of the first node
            // remember what we split off the first line
            int remainder = firstLineDelta - length;
            String remDelim = node.delimiter;

            // join the first line with the first added
            int consumed = info.delimiterIndex + info.delimiterLength;
            int delta = consumed - firstLineDelta;
            updateLength(node, delta);
            node.delimiter = info.delimiter;

            // Inline addlines start
            info = nextDelimiterInfo(text, consumed);
            while (info != null) {
                int lineLen = info.delimiterIndex - consumed + info.delimiterLength;
                node = insertAfter(node, lineLen, info.delimiter);
                consumed += lineLen;
                info = nextDelimiterInfo(text, consumed);
            }
            // Inline addlines end

            // add remaining chunk merged with last (incomplete) additional line
            insertAfter(node, remainder + text.length() - consumed, remDelim);
        }
    }

    /**
     * Replace spanning from one node to another.
     *
     * @param node the first affected node
     * @param last the last affected node
     * @param text the added text
     * @param length the replace length, &gt;= <code>firstLineDelta</code>
     * @param firstLineDelta the number of characters removed from the replacement offset to the end of
     * <code>node</code>, &lt;= <code>length</code>
     */
    private void replaceFromTo(Node node, Node last, String text, int length, int firstLineDelta) {
        // 2) modification covers several lines

        // delete intermediate nodes
        // TODO could be further optimized: replace intermediate lines with intermediate added lines
        // to reduce re-balancing
        Node successor = successor(node);
        while (successor != last) {
            length -= successor.length;
            Node toDelete = successor;
            successor = successor(successor);
            updateLength(toDelete, -toDelete.length);
        }

        DelimiterInfo info = text == null ? null : nextDelimiterInfo(text, 0);

        if (info == null || info.delimiter == null) {
            int added = text == null ? 0 : text.length();

            // join the two lines if there are no lines added
            join(node, last, added - length);
        } else {

            // join the first line with the first added
            int consumed = info.delimiterIndex + info.delimiterLength;
            updateLength(node, consumed - firstLineDelta);
            node.delimiter = info.delimiter;
            length -= firstLineDelta;

            // Inline addLines start
            info = nextDelimiterInfo(text, consumed);
            while (info != null) {
                int lineLen = info.delimiterIndex - consumed + info.delimiterLength;
                node = insertAfter(node, lineLen, info.delimiter);
                consumed += lineLen;
                info = nextDelimiterInfo(text, consumed);
            }
            // Inline addLines end

            updateLength(last, text.length() - consumed - length);
        }
    }

    /**
     * Joins two consecutive node lines, additionally adjusting the resulting length of the combined line by
     * <code>delta</code>. The first node gets deleted.
     *
     * @param one the first node to join
     * @param two the second node to join
     * @param delta the delta to apply to the remaining single node
     */
    private void join(Node one, Node two, int delta) {
        int oneLength = one.length;
        updateLength(one, -oneLength);
        updateLength(two, oneLength + delta);
    }

    /**
     * Adjusts the length of a node by <code>delta</code>, also adjusting the parent chain of <code>node</code>. If the
     * node's length becomes zero and is not the last (incomplete) node, it is deleted after the update.
     *
     * @param node the node to adjust
     * @param delta the character delta to add to the node's length
     */
    private void updateLength(Node node, int delta) {

        // update the node itself
        node.length += delta;

        // check deletion
        final int lineDelta;
        boolean delete = node.length == 0 && node.delimiter != "";
        if (delete) {
            lineDelta = -1;
        } else {
            lineDelta = 0;
        }

        // update parent chain
        if (delta != 0 || lineDelta != 0) {
            updateParentChain(node, delta, lineDelta);
        }

        if (delete) {
            delete(node);
        }
    }

    /**
     * Updates the differential indices following the parent chain. All nodes from <code>from.parent</code> to the root
     * are updated.
     *
     * @param node the child of the first node to update
     * @param deltaLength the character delta
     * @param deltaLines the line delta
     */
    private void updateParentChain(Node node, int deltaLength, int deltaLines) {
        updateParentChain(node, null, deltaLength, deltaLines);
    }

    /**
     * Updates the differential indices following the parent chain. All nodes from <code>from.parent</code> to
     * <code>to</code> (exclusive) are updated.
     *
     * @param from the child of the first node to update
     * @param to the first node not to update
     * @param deltaLength the character delta
     * @param deltaLines the line delta
     */
    private void updateParentChain(Node from, Node to, int deltaLength, int deltaLines) {
        Node parent = from.parent;
        while (parent != to) {
            // only update node if update comes from left subtree
            if (from == parent.left) {
                parent.offset += deltaLength;
                parent.line += deltaLines;
            }
            from = parent;
            parent = from.parent;
        }
    }

    /**
     * Deletes a node from the tree, re-balancing it if necessary. The differential indices in the node's parent chain
     * have to be updated in advance to calling this method. Generally, don't call <code>delete</code> directly, but
     * call <code>update_length(node, -node.length)</code> to properly remove a node.
     *
     * @param node the node to delete.
     */
    private void delete(Node node) {
        Node parent = node.parent;
        Node toUpdate; // the parent of the node that lost a child
        boolean lostLeftChild;
        boolean isLeftChild = parent == null || node == parent.left;

        if (node.left == null || node.right == null) {
            // 1) node has one child at max - replace parent's pointer with the only child
            // also handles the trivial case of no children
            Node replacement = node.left == null ? node.right : node.left;
            setChild(parent, replacement, isLeftChild);
            toUpdate = parent;
            lostLeftChild = isLeftChild;
            // no updates to do - subtrees stay as they are
        } else if (node.right.left == null) {
            // 2a) node's right child has no left child - replace node with right child, giving node's
            // left subtree to the right child
            Node replacement = node.right;
            setChild(parent, replacement, isLeftChild);
            setChild(replacement, node.left, true);
            replacement.line = node.line;
            replacement.offset = node.offset;
            replacement.balance = node.balance;
            toUpdate = replacement;
            lostLeftChild = false;
//		} else if (node.left.right == null) {
//			// 2b) symmetric case
//			Node replacement= node.left;
//			set_child(parent, replacement, isLeftChild);
//			set_child(replacement, node.right, false);
//			replacement.balance= node.balance;
//			toUpdate= replacement;
//			lostLeftChild= true;
        } else {
            // 3) hard case - replace node with its successor
            Node successor = successor(node);

            // successor exists (otherwise node would not have right child, case 1)
            // successor has no left child (a left child would be the real successor of node)
            // successor is the left child of its parent (otherwise parent would be smaller and
            // hence the real successor)
            // successor is not a child of node (would have been covered by 2a)

            toUpdate = successor.parent;
            lostLeftChild = true;

            // update relative indices
            updateParentChain(successor, node, -successor.length, -1);

            // delete successor from its current place - like 1)
            setChild(toUpdate, successor.right, true);

            // move node's subtrees to its successor
            setChild(successor, node.right, false);
            setChild(successor, node.left, true);

            // replace node by successor in its parent
            setChild(parent, successor, isLeftChild);

            // update the successor
            successor.line = node.line;
            successor.offset = node.offset;
            successor.balance = node.balance;
        }

        updateParentBalanceAfterDeletion(toUpdate, lostLeftChild);
    }

    /**
     * Updates the balance information in the parent chain of node.
     *
     * @param node the first node that needs balance updating
     * @param wasLeftChild <code>true</code> if the deletion happened on <code>node</code>'s left subtree,
     * <code>false</code> if it occurred on <code>node</code>'s right subtree
     */
    private void updateParentBalanceAfterDeletion(Node node, boolean wasLeftChild) {
        while (node != null) {
            if (wasLeftChild) {
                node.balance++;
            } else {
                node.balance--;
            }

            Node parent = node.parent;
            if (parent != null) {
                wasLeftChild = node == parent.left;
            }

            switch (node.balance) {
                case 1:
                case -1:
                    return; // done, no tree change

                case -2:
                    if (rebalanceAfterDeletionRight(node.left)) {
                        return;
                    }
                    break; // propagate up

                case 2:
                    if (rebalanceAfterDeletionLeft(node.right)) {
                        return;
                    }
                    break; // propagate up

                case 0:
                    break; // propagate up

                default:
            }

            node = parent;
        }
    }

    /**
     * Re-balances a node whose parent has a double positive balance.
     *
     * @param node the node to re-balance
     * @return <code>true</code> if the re-balancement leaves the height at <code>node.parent</code> constant,
     * <code>false</code> if the height changed
     */
    private boolean rebalanceAfterDeletionLeft(Node node) {
        Node parent = node.parent;
        if (node.balance == 1) {
            singleLeftRotation(node, parent);
            return false;
        } else if (node.balance == -1) {
            rightLeftRotation(node, parent);
            return false;
        } else if (node.balance == 0) {
            rotateLeft(parent);
            node.balance = -1;
            parent.balance = 1;
            return true;
        } else {
            return true;
        }
    }

    /**
     * Re-balances a node whose parent has a double negative balance.
     *
     * @param node the node to re-balance
     * @return <code>true</code> if the re-balancement leaves the height at <code>node.parent</code> constant,
     * <code>false</code> if the height changed
     */
    private boolean rebalanceAfterDeletionRight(Node node) {
        Node parent = node.parent;
        if (node.balance == -1) {
            singleRightRotation(node, parent);
            return false;
        } else if (node.balance == 1) {
            leftRightRotation(node, parent);
            return false;
        } else if (node.balance == 0) {
            rotateRight(parent);
            node.balance = 1;
            parent.balance = -1;
            return true;
        } else {
            return true;
        }
    }

    /**
     * Returns the successor of a node, <code>null</code> if node is the last node.
     *
     * @param node a node
     * @return the successor of <code>node</code>, <code>null</code> if there is none
     */
    private Node successor(Node node) {
        if (node.right != null) {
            return successorDown(node.right);
        }

        return successorUp(node);
    }

    /**
     * Searches the successor of <code>node</code> in its parent chain.
     *
     * @param node a node
     * @return the first node in <code>node</code>'s parent chain that is reached from its left subtree,
     * <code>null</code> if there is none
     */
    private Node successorUp(final Node node) {
        Node child = node;
        Node parent = child.parent;
        while (parent != null) {
            if (child == parent.left) {
                return parent;
            }
            child = parent;
            parent = child.parent;
        }
        return null;
    }

    /**
     * Searches the left-most node in a given subtree.
     *
     * @param node a node
     * @return the left-most node in the given subtree
     */
    private Node successorDown(Node node) {
        Node child = node.left;
        while (child != null) {
            node = child;
            child = node.left;
        }
        return node;
    }

    @Override
    public final void set(String text) {
        fRoot = new Node(0, "");
        try {
            replace(0, 0, text);
        } catch (BadLocationException x) {
            throw new InternalError();
        }
    }

    @Override
    public String toString() {
        int depth = computeDepth(fRoot);

        int leaves = (int) Math.pow(2, depth - 1);
        int width = 30 * leaves;

        List<Node> roots = new LinkedList<>();
        roots.add(fRoot);
        StringBuilder buf = new StringBuilder((width + 1) * depth); // see Bug 137688
        int indents = leaves;
        char[] space = new char[leaves * 30 / 2];
        Arrays.fill(space, ' ');
        for (int d = 0; d < depth; d++) {
            // compute indent
            indents /= 2;
            int spaces = Math.max(0, indents * 30 - 30 / 2);
            // print nodes
            for (ListIterator<Node> it = roots.listIterator(); it.hasNext();) {
                // pad before
                buf.append(space, 0, spaces);

                Node node = it.next();
                String box;
                // replace the node with its children
                if (node == null) {
                    it.add(null);
                    box = ".";
                } else {
                    it.set(node.left);
                    it.add(node.right);
                    box = node.toString();
                }

                // draw the node, pad to WIDTH
                int pad_left = (30 - box.length() + 1) / 2;
                int pad_right = 30 - box.length() - pad_left;
                buf.append(space, 0, pad_left);
                buf.append(box);
                buf.append(space, 0, pad_right);

                // pad after
                buf.append(space, 0, spaces);
            }

            buf.append('\n');
        }

        return buf.toString();
    }

    /**
     * Recursively computes the depth of the tree. Only used by {@link #toString()}.
     *
     * @param root the subtree to compute the depth of, may be <code>null</code>
     * @return the depth of the given tree, 0 if it is <code>null</code>
     */
    private byte computeDepth(Node root) {
        if (root == null) {
            return 0;
        }

        return (byte) (Math.max(computeDepth(root.left), computeDepth(root.right)) + 1);
    }

    /**
     * Returns the information about the first delimiter found in the given text starting at the given offset.
     *
     * @param text the text to be searched
     * @param offset the offset in the given text
     * @return the information of the first found delimiter or <code>null</code>
     */
    protected DelimiterInfo nextDelimiterInfo(String text, int offset) {
        return _typespecOuter.nextDelimiterInfo(text, offset);
    }
}
