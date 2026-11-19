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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

import java.util.AbstractList;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Abstract superclass of all Abstract Syntax Tree (AST) node types. <p> An AST node represents a Java source code
 * construct, such as a name, type, expression, statement, or declaration. </p> <p> Each AST node belongs to a unique
 * AST instance, called the owning AST. The children of an AST node always have the same owner as their parent node. If
 * a node from one AST is to be added to a different AST, the subtree must be cloned first to ensure that the added
 * nodes have the correct owning AST. </p> <p> When an AST node is part of an AST, it has a unique parent node. Clients
 * can navigate upwards, from child to parent, as well as downwards, from parent to child. Newly created nodes are
 * unparented. When an unparented node is set as a child of a node (using a <code>set<i>CHILD</i></code> method), its
 * parent link is set automatically and the parent link of the former child is set to <code>null</code>. For nodes with
 * properties that include a list of children (for example, <code>Block</code> whose <code>statements</code> property is
 * a list of statements), adding or removing an element to/for the list property automatically updates the parent links.
 * These lists support the <code>List.set</code> method; however, the constraint that the same node cannot appear more
 * than once means that this method cannot be used to swap elements without first removing the node. </p> <p> ASTs must
 * not contain cycles. All operations that could create a cycle detect this possibility and fail. </p> <p> ASTs do not
 * contain "holes" (missing subtrees). If a node is required to have a certain property, a syntactically plausible
 * initial value is always supplied. </p> <p> The hierarchy of AST node types has some convenient groupings marked by
 * abstract superclasses: <ul> <li>expressions - <code>Expression</code></li> <li>names - <code>Name</code> (a sub-kind
 * of expression)</li> <li>statements - <code>Statement</code></li> <li>types - <code>Type</code></li> <li>type body
 * declarations - <code>BodyDeclaration</code></li> </ul> <p> Abstract syntax trees may be hand constructed by clients,
 * using the <code>new<i>TYPE</i></code> factory methods (see <code>AST</code>) to create new nodes, and the various
 * <code>set<i>CHILD</i></code> methods to connect them together. </p> <p> The class {@link ASTParser} parses a string
 * containing a Java source code and returns an abstract syntax tree for it. The resulting nodes carry source ranges
 * relating the node back to the original source characters. The source range covers the construct as a whole. </p> <p>
 * Each AST node carries bit flags, which may convey additional information about the node. For instance, the parser
 * uses a flag to indicate a syntax error. Newly created nodes have no flags set. </p> <p> AST nodes are not
 * thread-safe, and child nodes are created lazily without synchronization; the formatter builds and visits each tree
 * on a single thread. </p> <p> ASTs also support the visitor pattern; see the class <code>ASTVisitor</code> for
 * details. </p>
 *
 * @see ASTParser
 * @see ASTVisitor
 * @since 2.0
 * @noextend This class is not intended to be subclassed by clients.
 */
public abstract class ASTNode {

    /**
     * Owning AST. <p> N.B. This is a private field, but declared as package-visible for more efficient access from
     * inner classes. </p>
     */
    final AST ast;

    /**
     * Parent AST node, or <code>null</code> if this node is a root. Initially <code>null</code>.
     */
    private ASTNode parent = null;

    /**
     * A character index into the original source string, or <code>-1</code> if no source position information is
     * available for this node; <code>-1</code> by default.
     */
    private int startPosition = -1;

    /**
     * A character length, or <code>0</code> if no source position information is recorded for this node; <code>0</code>
     * by default.
     */
    private int length = 0;

    /**
     * int containing the node type in the top 16 bits and flags in the bottom 16 bits; none set by default. <p> N.B.
     * This is a private field, but declared as package-visible for more efficient access from inner classes. </p>
     *
     */
    int typeAndFlags = 0;

    /**
     * Property of parent in which this node is a child, or <code>null</code> if this node is a root. Initially
     * <code>null</code>.
     *
     * @see #getLocationInParent
     * @since 3.0
     */
    private StructuralPropertyDescriptor location = null;

    /**
     * A specialized implementation of a list of ASTNodes. The implementation is based on an ArrayList.
     */
    class NodeList<E> extends AbstractList<E> {

        /**
         * The underlying list in which the nodes of this list are stored. <p> Be stingy on storage - assume that list
         * will be empty. </p> <p> This field declared default visibility (rather than private) so that accesses from
         * <code>NodeList.Cursor</code> do not require a synthetic accessor method. </p>
         */
        ArrayList<E> store = new ArrayList<>(0);

        /**
         * The property descriptor for this list.
         */
        ChildListPropertyDescriptor propertyDescriptor;

        /**
         * A cursor for iterating over the elements of the list. Does not lose its position if the list is changed
         * during the iteration.
         */
        class Cursor implements Iterator<E> {
            /**
             * The position of the cursor between elements. If the value is N, then the cursor sits between the element
             * at positions N-1 and N. Initially just before the first element of the list.
             */
            private int position = 0;

            @Override
            public boolean hasNext() {
                return this.position < NodeList.this.store.size();
            }

            @Override
            public E next() {
                E result = NodeList.this.store.get(this.position);
                this.position++;
                return result;
            }

            @Override
            public void remove() {
                throw new UnsupportedOperationException();
            }

            /**
             * Adjusts this cursor to accommodate an add/remove at the given index.
             *
             * @param index the position at which the element was added or removed
             * @param delta +1 for add, and -1 for remove
             */
            void update(int index, int delta) {
                if (this.position > index) {
                    // the cursor has passed the added or removed element
                    this.position += delta;
                }
            }
        }

        /**
         * A list of currently active cursors, or <code>null</code> if there are no active cursors. <p> It is important
         * for storage considerations to maintain the null-means-empty invariant; otherwise, every NodeList instance
         * will waste a lot of space. A cursor is needed only for the duration of a visit to the child nodes. Under
         * normal circumstances, only a single cursor is needed; multiple cursors are only required if there are
         * multiple visits going on at the same time. </p>
         */
        private List<Cursor> cursors = null;

        /**
         * Creates a new empty list of nodes owned by this node. This node will be the common parent of all nodes added
         * to this list.
         *
         * @param property the property descriptor
         * @since 3.0
         */
        NodeList(ChildListPropertyDescriptor property) {
            super();
            this.propertyDescriptor = property;
        }

        @Override
        public int size() {
            return this.store.size();
        }

        @Override
        public E get(int index) {
            return this.store.get(index);
        }

        @Override
        public E set(int index, E element) {
            if (element == null) {
                throw new IllegalArgumentException();
            }
            // delink old child from parent, and link new child to parent
            ASTNode newChild = (ASTNode) element;
            ASTNode oldChild = (ASTNode) this.store.get(index);
            if (oldChild == newChild) {
                return element;
            }
            ASTNode.checkNewChild(ASTNode.this, newChild, this.propertyDescriptor.cycleRisk,
                this.propertyDescriptor.elementType);

            E result = this.store.set(index, element);
            oldChild.setParent(null, null);
            newChild.setParent(ASTNode.this, this.propertyDescriptor);
            return result;
        }

        @Override
        public void add(int index, E element) {
            if (element == null) {
                throw new IllegalArgumentException();
            }
            // link new child to parent
            ASTNode newChild = (ASTNode) element;
            ASTNode.checkNewChild(ASTNode.this, newChild, this.propertyDescriptor.cycleRisk,
                this.propertyDescriptor.elementType);

            this.store.add(index, element);
            updateCursors(index, +1);
            newChild.setParent(ASTNode.this, this.propertyDescriptor);
        }

        @Override
        public E remove(int index) {
            // delink old child from parent
            ASTNode oldChild = (ASTNode) this.store.get(index);

            oldChild.setParent(null, null);
            E result = this.store.remove(index);
            updateCursors(index, -1);
            return result;
        }

        /**
         * Allocate a cursor to use for a visit. The client must call <code>releaseCursor</code> when done.
         *
         * @return a new cursor positioned before the first element of the list
         */
        Cursor newCursor() {
            if (this.cursors == null) {
                // convert null to empty list
                this.cursors = new ArrayList<>(1);
            }
            Cursor result = new Cursor();
            this.cursors.add(result);
            return result;
        }

        /**
         * Releases the given cursor at the end of a visit.
         *
         * @param cursor the cursor
         */
        void releaseCursor(Cursor cursor) {
            this.cursors.remove(cursor);
            if (this.cursors.isEmpty()) {
                // important: convert empty list back to null
                // otherwise the node will hang on to needless junk
                this.cursors = null;
            }
        }

        /**
         * Adjusts all cursors to accommodate an add/remove at the given index. <p> This method is only used when the
         * list is being modified. </p>
         *
         * @param index the position at which the element was added or removed
         * @param delta +1 for add, and -1 for remove
         */
        private void updateCursors(int index, int delta) {
            if (this.cursors == null) {
                // there are no cursors to worry about
                return;
            }
            for (Cursor cursor : this.cursors) {
                cursor.update(index, delta);
            }
        }
    }

    /**
     * Creates a new AST node owned by the given AST. Once established, the relationship between an AST node and its
     * owning AST does not change over the lifetime of the node. The new node has no parent node, and no properties. <p>
     * N.B. This constructor is package-private; all subclasses my be declared in the same package; clients are unable
     * to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    ASTNode(AST ast) {
        if (ast == null) {
            throw new IllegalArgumentException();
        }

        this.ast = ast;
        setNodeType(getNodeType0());
    }

    /**
     * Returns this node's parent node, or <code>null</code> if this is the root node. <p> Note that the relationship
     * between an AST node and its parent node may change over the lifetime of a node. </p>
     *
     * @return the parent of this node, or <code>null</code> if none
     */
    public final ASTNode getParent() {
        return this.parent;
    }

    /**
     * Returns the location of this node within its parent, or <code>null</code> if this is a root node.
     *
     * <p> Note that the relationship between an AST node and its parent node may change over the lifetime of a node.
     * </p>
     *
     * @return the location of this node in its parent, or <code>null</code> if this node has no parent
     * @since 3.0
     */
    public final StructuralPropertyDescriptor getLocationInParent() {
        return this.location;
    }

    /**
     * Returns the root node at or above this node; returns this node if it is a root.
     *
     * @return the root node at or above this node
     */
    public final ASTNode getRoot() {
        ASTNode candidate = this;
        while (true) {
            ASTNode p = candidate.getParent();
            if (p == null) {
                // candidate has no parent - that's the guy
                return candidate;
            }
            candidate = p;
        }
    }

    /**
     * Sets or clears this node's parent node and location. <p> Note that this method is package-private. The pointer
     * from a node to its parent is set implicitly as a side effect of inserting or removing the node as a child of
     * another node. </p>
     *
     * @param parent the new parent of this node, or <code>null</code> if none
     * @param property the location of this node in its parent, or <code>null</code> if <code>parent</code> is
     * <code>null</code>
     * @see #getLocationInParent
     * @see #getParent
     * @since 3.0
     */
    final void setParent(ASTNode parent, StructuralPropertyDescriptor property) {
        this.parent = parent;
        this.location = property;
    }

    /**
     * Checks whether the given new child node is a node in a different AST from its parent-to-be, whether it is already
     * has a parent, whether adding it to its parent-to-be would create a cycle, and whether the child is of the right
     * type. The parent-to-be is the enclosing instance.
     *
     * @param node the parent-to-be node
     * @param newChild the new child of the parent
     * @param cycleCheck <code>true</code> if cycles are possible and need to be checked, <code>false</code> if cycles
     * are impossible and do not need to be checked
     * @param nodeType a type constraint on child nodes, or <code>null</code> if no special check is required
     * @exception IllegalArgumentException if: <ul> <li>the child is null</li> <li>the node belongs to a different
     * AST</li> <li>the child has the incorrect node type</li> <li>the node already has a parent</li> <li>a cycle in
     * would be created</li> </ul>
     */
    static void checkNewChild(ASTNode node, ASTNode newChild, boolean cycleCheck, Class<?> nodeType) {
        if (newChild.ast != node.ast) {
            // new child is from a different AST
            throw new IllegalArgumentException();
        }
        if (newChild.getParent() != null) {
            // new child currently has a different parent
            throw new IllegalArgumentException();
        }
        if (cycleCheck && newChild == node.getRoot()) {
            // inserting new child would create a cycle
            throw new IllegalArgumentException();
        }
        Class<?> childClass = newChild.getClass();
        if (nodeType != null && !nodeType.isAssignableFrom(childClass)) {
            // new child is not of the right type
            throw new ClassCastException(childClass + " is not an instance of " + nodeType); //$NON-NLS-1$
        }
    }

    /**
     * Prepares to replace the old child of this node with another node. Here is the code pattern found in all AST node
     * subclasses:
     *
     * <pre>
     * ASTNode oldChild = this.foo;
     * preReplaceChild(oldChild, newFoo, FOO_PROPERTY);
     * this.foo = newFoo;
     * </pre>
     *
     * <p>
     * This method does all the precondition checks and changes parent links. The old child is delinked from its parent
     * (making it a root node), and the new child node is linked to its parent. The new child node must be a root node
     * in the same AST as its new parent, and must not be an ancestor of this node. The replace operation must fail
     * atomically; so it is crucial that all precondition checks be done before any linking and delinking happens.
     *
     * @param oldChild the old child of this node, or <code>null</code> if there was no old child to replace
     * @param newChild the new child of this node, or <code>null</code> if there is no replacement child
     * @param property the property descriptor of this node describing the relationship between node and child
     * @exception RuntimeException if: <ul> <li>the node belongs to a different AST</li> <li>the node already has a
     * parent</li> <li>a cycle in would be created</li> </ul>
     * @since 3.0
     */
    final void preReplaceChild(ASTNode oldChild, ASTNode newChild, ChildPropertyDescriptor property) {
        if (newChild != null) {
            checkNewChild(this, newChild, property.cycleRisk, null);
        }
        // delink old child from parent
        if (oldChild != null) {
            oldChild.setParent(null, null);
        }
        // link new child to parent
        if (newChild != null) {
            newChild.setParent(this, property);
        }
    }

    /**
     * End lazy initialization of this node. Here is the code pattern found in all AST node subclasses:
     *
     * <pre>
     * if (this.node == null) {
     *     this.node = postLazyInit(new SimpleName(this.ast), FOO_PROPERTY);
     * }
     * </pre>
     *
     * <p> AST nodes are not thread-safe. The formatter builds and visits each tree on a single thread, so lazy
     * initialization is not synchronized. </p>
     *
     * @param newChild the new child of this node
     * @param property the property descriptor of this node describing the relationship between node and child
     */
    final <T extends ASTNode> T postLazyInit(T newChild, ChildPropertyDescriptor property) {
        newChild.setParent(this, property);
        return newChild;
    }

    /**
     * Returns the flags associated with this node. <p> No flags are associated with newly created nodes. </p> <p> The
     * only flag is <code>1</code> (malformed), which indicates that the node is syntactically malformed. </p>
     *
     * @return the bitwise-or of individual flags
     * @see #setFlags(int)
     */
    public final int getFlags() {
        return this.typeAndFlags & 0xFFFF;
    }

    /**
     * Sets the flags associated with this node to the given value. <p> The only flag is <code>1</code> (malformed),
     * which indicates that the node is syntactically malformed. Flags are <em>not</em> considered a structural
     * property of the node. </p>
     *
     * @param flags the bitwise-or of individual flags
     * @see #getFlags()
     */
    public final void setFlags(int flags) {
        int old = this.typeAndFlags & 0xFFFF0000;
        this.typeAndFlags = old | (flags & 0xFFFF);
    }

    /**
     * Returns an integer value identifying the type of this concrete AST node. The values are small positive integers,
     * suitable for use in switch statements. <p> Each concrete node type has a unique node type value; for example, the
     * node type of <code>CastExpression</code> is <code>11</code>. </p>
     *
     * @return the node type value
     */
    public final int getNodeType() {
        return this.typeAndFlags >>> 16;
    }

    /**
     * Sets the integer value identifying the type of this concrete AST node. The values are small positive integers,
     * suitable for use in switch statements.
     *
     * @param nodeType one of the node type constants
     */
    private void setNodeType(int nodeType) {
        int old = this.typeAndFlags & 0xFFFF0000;
        this.typeAndFlags = old | (nodeType << 16);
    }

    /**
     * Returns an integer value identifying the type of this concrete AST node. <p> This internal method is implemented
     * in each of the concrete node subclasses. </p>
     *
     * @return one of the node type constants
     */
    abstract int getNodeType0();

    /**
     * The <code>ASTNode</code> implementation of this <code>Object</code> method uses object identity (==). Use
     * <code>subtreeMatch</code> to compare two subtrees for equality.
     *
     * @param obj {@inheritDoc}
     * @return {@inheritDoc}
     */
    @Override
    public final boolean equals(Object obj) {
        return this == obj; // equivalent to Object.equals
    }

    /*
     * (non-Javadoc) This makes it consistent with the fact that a equals methods has been provided.
     *
     * @see java.lang.Object#hashCode()
     */
    @Override
    public final int hashCode() {
        return super.hashCode();
    }

    /**
     * Accepts the given visitor on a visit of the current node.
     *
     * @param visitor the visitor object
     * @exception IllegalArgumentException if the visitor is null
     */
    public final void accept(ASTVisitor visitor) {

        // begin with the generic pre-visit
        if (visitor.preVisit2(this)) {
            // dynamic dispatch to internal method for type-specific visit/endVisit
            accept0(visitor);
        }
        // end with the generic post-visit
        visitor.postVisit();
    }

    /**
     * Accepts the given visitor on a type-specific visit of the current node. This method must be implemented in all
     * concrete AST node types. <p> General template for implementation on each concrete ASTNode class:
     *
     * <pre>
     * <code>
     * boolean visitChildren = visitor.visit(this);
     * if (visitChildren) {
     *    // visit children in normal left to right reading order
     *    acceptChild(visitor, getProperty1());
     *    acceptChildren(visitor, this.rawListProperty);
     *    acceptChild(visitor, getProperty2());
     * }
     * visitor.endVisit(this); // for node types that have an endVisit method
     * </code>
     * </pre>
     *
     * <p>
     * Note that the caller (<code>accept</code>) take cares of invoking <code>visitor.preVisit2(this)</code> and
     * <code>visitor.postVisit()</code>. </p>
     *
     * @param visitor the visitor object
     */
    abstract void accept0(ASTVisitor visitor);

    /**
     * Accepts the given visitor on a visit of the current node. <p> This method should be used by the concrete
     * implementations of <code>accept0</code> to traverse optional properties. Equivalent to
     * <code>child.accept(visitor)</code> if <code>child</code> is not <code>null</code>. </p>
     *
     * @param visitor the visitor object
     * @param child the child AST node to dispatch too, or <code>null</code> if none
     */
    final void acceptChild(ASTVisitor visitor, ASTNode child) {
        if (child == null) {
            return;
        }
        child.accept(visitor);
    }

    /**
     * Accepts the given visitor on a visit of the given live list of child nodes. <p> This method must be used by the
     * concrete implementations of <code>accept</code> to traverse list-values properties; it encapsulates the proper
     * handling of on-the-fly changes to the list. </p>
     *
     * @param visitor the visitor object
     * @param children the child AST node to dispatch too, or <code>null</code> if none
     */
    final <E> void acceptChildren(ASTVisitor visitor, ASTNode.NodeList<E> children) {
        // use a cursor to keep track of where we are up to
        // (the list may be changing under foot)
        NodeList<E>.Cursor cursor = children.newCursor();
        try {
            while (cursor.hasNext()) {
                ASTNode child = (ASTNode) cursor.next();
                child.accept(visitor);
            }
        } finally {
            children.releaseCursor(cursor);
        }
    }

    /**
     * Returns the character index into the original source file indicating where the source fragment corresponding to
     * this node begins. <p> The parser supplies useful well-defined source ranges to the nodes it creates. See
     * {@link ASTParser} for details on where source ranges begin and end. </p>
     *
     * @return the 0-based character index, or <code>-1</code> if no source position information is recorded for this
     * node
     * @see #getLength()
     * @see ASTParser
     */
    public final int getStartPosition() {
        return this.startPosition;
    }

    /**
     * Returns the length in characters of the original source file indicating where the source fragment corresponding
     * to this node ends. <p> The parser supplies useful well-defined source ranges to the nodes it creates. See
     * {@link ASTParser} for details on where source ranges begin and end. </p>
     *
     * @return a (possibly 0) length, or <code>0</code> if no source position information is recorded for this node
     * @see #getStartPosition()
     * @see ASTParser
     */
    public final int getLength() {
        return this.length;
    }

    /**
     * Sets the source range of the original source file where the source fragment corresponding to this node was found.
     * <p> See {@link ASTParser} for details on where source ranges begin and end. </p>
     *
     * @param startPosition a 0-based character index, or <code>-1</code> if no source position information is available
     * for this node
     * @param length a (possibly 0) length, or <code>0</code> if no source position information is recorded for this
     * node
     * @see #getStartPosition()
     * @see #getLength()
     * @see ASTParser
     */
    public final void setSourceRange(int startPosition, int length) {
        if (startPosition >= 0 && length < 0) {
            throw new IllegalArgumentException("negative length=" + length + " startPosition= " + startPosition); //$NON-NLS-1$ //$NON-NLS-2$
        }
        if (startPosition < 0 && length != 0) {
            throw new IllegalArgumentException("negative startPosition=" + startPosition + " length=" + length); //$NON-NLS-1$ //$NON-NLS-2$
        }
        // source positions are not considered a structural property
        // but we protect them nevertheless
        this.startPosition = startPosition;
        this.length = length;
    }

}
