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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.dom.NaiveASTFlattener;
import java.util.AbstractList;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

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
 * uses a flag to indicate a syntax error. Newly created nodes have no flags set. </p> <p> Each AST node is capable of
 * carrying an open-ended collection of client-defined properties. Newly created nodes have none.
 * <code>getProperty</code> and <code>setProperty</code> are used to access these properties. </p> <p> AST nodes are
 * thread-safe for readers provided there are no active writers. If one thread is modifying an AST, including creating
 * new nodes or cloning existing ones, it is <b>not</b> safe for another thread to read, visit, write, create, or clone
 * <em>any</em> of the nodes on the same AST. When synchronization is required, consider using the common AST object
 * that owns the node; that is, use <code>synchronize (node.getAST()) {...}</code>. </p> <p> ASTs also support the
 * visitor pattern; see the class <code>ASTVisitor</code> for details. </p>
 *
 * @see ASTParser
 * @see ASTVisitor
 * @since 2.0
 * @noextend This class is not intended to be subclassed by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
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
     * Primary field used in representing node properties efficiently. If <code>null</code>, this node has no
     * properties. If a {@link String}, this is the name of this node's sole property, and <code>property2</code>
     * contains its value. If a {@link Map}, this is the table of property name-value mappings; <code>property2</code>,
     * if non-null is its unmodifiable equivalent. Initially <code>null</code>.
     *
     * @see #property2
     */
    private Object property1 = null;

    /**
     * Auxiliary field used in representing node properties efficiently.
     *
     * @see #property1
     */
    private Object property2 = null;

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
    class NodeList extends AbstractList {

        /**
         * The underlying list in which the nodes of this list are stored (element type: {@link ASTNode}). <p> Be stingy
         * on storage - assume that list will be empty. </p> <p> This field declared default visibility (rather than
         * private) so that accesses from <code>NodeList.Cursor</code> do not require a synthetic accessor method. </p>
         */
        ArrayList store = new ArrayList(0);

        /**
         * The property descriptor for this list.
         */
        ChildListPropertyDescriptor propertyDescriptor;

        /**
         * A cursor for iterating over the elements of the list. Does not lose its position if the list is changed
         * during the iteration.
         */
        class Cursor implements Iterator {
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
            public Object next() {
                Object result = NodeList.this.store.get(this.position);
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
         * A list of currently active cursors (element type: {@link Cursor}), or <code>null</code> if there are no
         * active cursors. <p> It is important for storage considerations to maintain the null-means-empty invariant;
         * otherwise, every NodeList instance will waste a lot of space. A cursor is needed only for the duration of a
         * visit to the child nodes. Under normal circumstances, only a single cursor is needed; multiple cursors are
         * only required if there are multiple visits going on at the same time. </p>
         */
        private List cursors = null;

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
        public Object get(int index) {
            return this.store.get(index);
        }

        @Override
        public Object set(int index, Object element) {
            if (element == null) {
                throw new IllegalArgumentException();
            }
            if ((ASTNode.this.typeAndFlags & 4) != 0) {
                // this node is protected => cannot gain or lose children
                throw new IllegalArgumentException("AST node cannot be modified"); //$NON-NLS-1$
            }
            // delink old child from parent, and link new child to parent
            ASTNode newChild = (ASTNode) element;
            ASTNode oldChild = (ASTNode) this.store.get(index);
            if (oldChild == newChild) {
                return oldChild;
            }
            if ((oldChild.typeAndFlags & 4) != 0) {
                // old child is protected => cannot be unparented
                throw new IllegalArgumentException("AST node cannot be modified"); //$NON-NLS-1$
            }
            ASTNode.checkNewChild(ASTNode.this, newChild, this.propertyDescriptor.cycleRisk,
                this.propertyDescriptor.elementType);

            Object result = this.store.set(index, newChild);
            oldChild.setParent(null, null);
            newChild.setParent(ASTNode.this, this.propertyDescriptor);
            return result;
        }

        @Override
        public void add(int index, Object element) {
            if (element == null) {
                throw new IllegalArgumentException();
            }
            if ((ASTNode.this.typeAndFlags & 4) != 0) {
                // this node is protected => cannot gain or lose children
                throw new IllegalArgumentException("AST node cannot be modified"); //$NON-NLS-1$
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
        public Object remove(int index) {
            if ((ASTNode.this.typeAndFlags & 4) != 0) {
                // this node is protected => cannot gain or lose children
                throw new IllegalArgumentException("AST node cannot be modified"); //$NON-NLS-1$
            }
            // delink old child from parent
            ASTNode oldChild = (ASTNode) this.store.get(index);
            if ((oldChild.typeAndFlags & 4) != 0) {
                // old child is protected => cannot be unparented
                throw new IllegalArgumentException("AST node cannot be modified"); //$NON-NLS-1$
            }

            oldChild.setParent(null, null);
            Object result = this.store.remove(index);
            updateCursors(index, -1);
            return result;
        }

        /**
         * Allocate a cursor to use for a visit. The client must call <code>releaseCursor</code> when done. <p> This
         * method is internally synchronized on this NodeList. It is thread-safe to create a cursor. </p>
         *
         * @return a new cursor positioned before the first element of the list
         */
        Cursor newCursor() {
            synchronized (this) {
                // serialize cursor management on this NodeList
                if (this.cursors == null) {
                    // convert null to empty list
                    this.cursors = new ArrayList(1);
                }
                Cursor result = new Cursor();
                this.cursors.add(result);
                return result;
            }
        }

        /**
         * Releases the given cursor at the end of a visit. <p> This method is internally synchronized on this NodeList.
         * It is thread-safe to release a cursor. </p>
         *
         * @param cursor the cursor
         */
        void releaseCursor(Cursor cursor) {
            synchronized (this) {
                // serialize cursor management on this NodeList
                this.cursors.remove(cursor);
                if (this.cursors.isEmpty()) {
                    // important: convert empty list back to null
                    // otherwise the node will hang on to needless junk
                    this.cursors = null;
                }
            }
        }

        /**
         * Adjusts all cursors to accommodate an add/remove at the given index. <p> This method is only used when the
         * list is being modified. The AST is not thread-safe if any of the clients are modifying it. </p>
         *
         * @param index the position at which the element was added or removed
         * @param delta +1 for add, and -1 for remove
         */
        private synchronized void updateCursors(int index, int delta) {
            if (this.cursors == null) {
                // there are no cursors to worry about
                return;
            }
            for (Object cursor : this.cursors) {
                Cursor c = (Cursor) cursor;
                c.update(index, delta);
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
        setFlags(ast.getDefaultNodeFlag());
    }

    /**
     * Returns this node's AST. <p> Note that the relationship between an AST node and its owing AST does not change
     * over the lifetime of a node. </p>
     *
     * @return the AST that owns this node
     */
    public final AST getAST() {
        return this.ast;
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
     * <pre>
     * {@code
     * ASTNode node = ...;
     * ASTNode parent = node.getParent();
     * StructuralPropertyDescriptor location = node.getLocationInParent();
     * assert (parent != null) == (location != null);
     * if ((location != null) && location.isChildProperty())
     *    assert parent.getStructuralProperty(location) == node;
     * if ((location != null) && location.isChildListProperty())
     *    assert ((List) parent.getStructuralProperty(location)).contains(node);
     * }
     * </pre>
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
     * Internal helper method that starts the building a list of property descriptors for the given node type.
     *
     * @param nodeClass the class for a concrete node type with n properties
     * @param propertyList empty list, with capacity for n+1 elements
     */
    static void createPropertyList(Class nodeClass, List propertyList) {
        // stuff nodeClass at head of list for future ref
        propertyList.add(nodeClass);
    }

    /**
     * Internal helper method that adding a property descriptor.
     *
     * @param property the structural property descriptor
     * @param propertyList list beginning with the AST node class followed by accumulated structural property
     * descriptors
     */
    static void addProperty(StructuralPropertyDescriptor property, List propertyList) {
        Class nodeClass = (Class) propertyList.get(0);
        if (property.getNodeClass() != nodeClass) {
            // easily made cut-and-paste mistake
            throw new RuntimeException("Structural property descriptor has wrong node class!");  //$NON-NLS-1$
        }
        propertyList.add(property);
    }

    /**
     * Internal helper method that completes the building of a node type's structural property descriptor list.
     *
     * @param propertyList list beginning with the AST node class followed by accumulated structural property
     * descriptors
     * @return unmodifiable list of structural property descriptors (element type: {@link StructuralPropertyDescriptor})
     */
    static List reapPropertyList(List propertyList) {
        propertyList.remove(0); // remove nodeClass
        // compact
        ArrayList a = new ArrayList(propertyList.size());
        a.addAll(propertyList);
        return Collections.unmodifiableList(a);
    }

    /**
     * Checks that this AST operation is not used when building JLS2 level ASTs. <p> Use this method to prevent access
     * to new properties that have been added in JLS3. </p>
     *
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.0
     */
    final void unsupportedIn2() {
        if (this.ast.apiLevel == 2) {
            throw new UnsupportedOperationException("Operation not supported in JLS2 AST"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is not used when building JLS2 or JLS3 level ASTs. <p> Use this method to prevent
     * access to new properties that have been added in JLS4. </p>
     *
     * @exception UnsupportedOperationException if this operation is used in a JLS2 or JLS3 AST
     * @since 3.7
     */
    final void unsupportedIn2_3() {
        if (this.ast.apiLevel <= 3) {
            throw new UnsupportedOperationException("Operation only supported in JLS4 and later AST"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is not used when building JLS2 or JLS3 or JLS4 level ASTs. <p> Use this method to
     * prevent access to new properties that have been added in JLS8. </p>
     *
     * @exception UnsupportedOperationException if this operation is used below JLS8
     * @since 3.10
     */
    final void unsupportedIn2_3_4() {
        if (this.ast.apiLevel < 8) {
            throw new UnsupportedOperationException("Operation only supported in JLS8 and later AST"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is not used when building JLS2, JLS3, JLS4 or JLS8 level ASTs. <p> Use this method
     * to prevent access to new properties that have been added in JLS9. </p>
     *
     * @exception UnsupportedOperationException if this operation is used below JLS9
     * @since 3.14
     */
    final void unsupportedBelow9() {
        if (this.ast.apiLevel < 9) {
            throw new UnsupportedOperationException("Operation only supported in JLS9 and later AST"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is not used when building JLS2, JLS3, JLS4, JLS8 or JLS9 level ASTs. <p> Use this
     * method to prevent access to new properties that have been added in JLS10 </p>
     *
     * @exception UnsupportedOperationException if this operation is used below JLS10
     * @since 3.14
     */
    final void unsupportedBelow10() {
        if (this.ast.apiLevel < 10) {
            throw new UnsupportedOperationException("Operation only supported in ASTs with level JLS10 and above"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is not used when building JLS2, JLS3, JLS4, JLS8, JLS9, JLS10, JLS11, JLS12 or
     * JSL13 level ASTs. <p> Use this method to prevent access to new properties that have been added in JLS14 </p>
     *
     * @exception UnsupportedOperationException if this operation is used below JLS14
     * @since 3.22
     */
    final void unsupportedBelow14() {
        if (this.ast.apiLevel < 14) {
            throw new UnsupportedOperationException("Operation only supported in ASTs with level JLS14 and above"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is not used when building JLS2, JLS3, JLS4, JLS8, JLS9, JLS10, JLS11, JLS12, JLS13
     * or JSL14 level ASTs. <p> Use this method to prevent access to new properties that have been added in JLS15 </p>
     *
     * @exception UnsupportedOperationException if this operation is used below JLS15
     * @since 3.22
     */
    final void unsupportedBelow15() {
        if (this.ast.apiLevel < 15) {
            throw new UnsupportedOperationException("Operation only supported in ASTs with level JLS15 and above"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is not used when building JLS2, JLS3, JLS4, JLS8, JLS9, JLS10, JLS11, JLS12,
     * JLS13, JSL14 or JSL15 level ASTs. <p> Use this method to prevent access to new properties that have been added in
     * JLS16 </p>
     *
     * @exception UnsupportedOperationException if this operation is used below JLS16
     * @since 3.26
     */
    final void unsupportedBelow16() {
        if (this.ast.apiLevel < 16) {
            throw new UnsupportedOperationException("Operation only supported in ASTs with level JLS16 and above"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is not used when building JLS2, JLS3, JLS4, JLS8, JLS9, JLS10, JLS11, JLS12,
     * JLS13, JSL14, JSL15 or JLS16 level ASTs. <p> Use this method to prevent access to new properties that have been
     * added in JLS17 </p>
     *
     * @exception UnsupportedOperationException if this operation is used below JLS17
     * @since 3.27
     */
    final void unsupportedBelow17() {
        if (this.ast.apiLevel < 17) {
            throw new UnsupportedOperationException("Operation only supported in ASTs with level JLS17 and above"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is not used when building JLS2, JLS3, JLS4, JLS8, JLS9, JLS10, JLS11, JLS12,
     * JLS13, JSL14, JSL15, JLS16 or JLS17 level ASTs. <p> Use this method to prevent access to new properties that have
     * been added in JLS18 </p>
     *
     * @exception UnsupportedOperationException if this operation is used below JLS18
     * @since 3.30
     */
    final void unsupportedBelow18() {
        if (this.ast.apiLevel < 18) {
            throw new UnsupportedOperationException("Operation only supported in ASTs with level JLS17 and above"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is only used when building JLS2 level ASTs. <p> Use this method to prevent access
     * to deprecated properties (deprecated in JLS3). </p>
     *
     * @exception UnsupportedOperationException if this operation is used in an AST later than JLS2
     * @since 3.0
     */
    final void supportedOnlyIn2() {
        if (this.ast.apiLevel != 2) {
            throw new UnsupportedOperationException("Operation only supported in JLS2 AST"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is only used when building JLS2, JLS3 or JLS4 level ASTs. <p> Use this method to
     * prevent access to deprecated properties (deprecated in JLS8). </p>
     *
     * @exception UnsupportedOperationException if this operation is used in an AST later than JLS4
     * @since 3.10
     */
    final void supportedOnlyIn2_3_4() {
        if (this.ast.apiLevel >= 8) {
            throw new UnsupportedOperationException("Operation only supported in JLS2, JLS3 and JLS4 ASTs"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is only used when building JLS20 level ASTs. <p> Use this method to prevent access
     * to new properties available only in JLS20. </p>
     *
     * @exception UnsupportedOperationException if this operation is not used in JLS20
     * @since 3.33
     */
    final void supportedOnlyIn20() {
        if (this.ast.apiLevel < 20) {
            throw new UnsupportedOperationException("Operation only supported in JLS20 AST"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is only used when building JLS21 level ASTs. <p> Use this method to prevent access
     * to new properties available only in JLS21. </p>
     *
     * @exception UnsupportedOperationException if this operation is not used in JLS21
     * @since 3.36
     */
    final void supportedOnlyIn21() {
        if (this.ast.apiLevel < 21) {
            throw new UnsupportedOperationException("Operation only supported in JLS21 AST"); //$NON-NLS-1$
        }
    }

    /**
     * Checks that this AST operation is only used when building JLS22 level ASTs. <p> Use this method to prevent access
     * to new properties available only in JLS22. </p>
     *
     * @exception UnsupportedOperationException if this operation is not used in JLS22
     * @since 3.37
     */
    final void supportedOnlyIn22() {
        if (this.ast.apiLevel < 22) {
            throw new UnsupportedOperationException("Operation only supported in JLS22 AST"); //$NON-NLS-1$
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
    static void checkNewChild(ASTNode node, ASTNode newChild, boolean cycleCheck, Class nodeType) {
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
        Class childClass = newChild.getClass();
        if (nodeType != null && !nodeType.isAssignableFrom(childClass)) {
            // new child is not of the right type
            throw new ClassCastException(childClass + " is not an instance of " + nodeType); //$NON-NLS-1$
        }
        if ((newChild.typeAndFlags & 4) != 0) {
            // new child node is protected => cannot be parented
            throw new IllegalArgumentException("AST node cannot be modified"); //$NON-NLS-1$
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
     * This method does all the precondition checks and changes parent links. The old child is delinked from its parent
     * (making it a root node), and the new child node is linked to its parent. The new child node must be a root node
     * in the same AST as its new parent, and must not be an ancestor of this node. All three nodes must be modifiable
     * (not PROTECTED). The replace operation must fail atomically; so it is crucial that all precondition checks be
     * done before any linking and delinking happens.
     *
     * @param oldChild the old child of this node, or <code>null</code> if there was no old child to replace
     * @param newChild the new child of this node, or <code>null</code> if there is no replacement child
     * @param property the property descriptor of this node describing the relationship between node and child
     * @exception RuntimeException if: <ul> <li>the node belongs to a different AST</li> <li>the node already has a
     * parent</li> <li>a cycle in would be created</li> <li>any of the nodes involved are unmodifiable</li> </ul>
     * @since 3.0
     */
    final void preReplaceChild(ASTNode oldChild, ASTNode newChild, ChildPropertyDescriptor property) {
        if ((this.typeAndFlags & 4) != 0) {
            // this node is protected => cannot gain or lose children
            throw new IllegalArgumentException("AST node cannot be modified"); //$NON-NLS-1$
        }
        if (newChild != null) {
            checkNewChild(this, newChild, property.cycleRisk, null);
        }
        // delink old child from parent
        if (oldChild != null) {
            if ((oldChild.typeAndFlags & 4) != 0) {
                // old child node is protected => cannot be unparented
                throw new IllegalArgumentException("AST node cannot be modified"); //$NON-NLS-1$
            }
            oldChild.setParent(null, null);
        }
        // link new child to parent
        if (newChild != null) {
            newChild.setParent(this, property);
        }
    }

    /**
     * Checks that a simple property of this node can be changed. Here is the code pattern found in all AST node
     * subclasses:
     *
     * <pre>
     * preValueChange();
     * this.foo = newFoo;
     * </pre>
     *
     * This method does the precondition check to make sure the node is modifiable (not PROTECTED). The change operation
     * must fail atomically; so it is crucial that the precondition checks are done before the field is hammered.
     *
     * @exception RuntimeException if: <ul> <li>this node is unmodifiable</li> </ul>
     * @since 3.0
     */
    final void preValueChange() {
        if ((this.typeAndFlags & 4) != 0) {
            // this node is protected => cannot change value of properties
            throw new IllegalArgumentException("AST node cannot be modified"); //$NON-NLS-1$
        }
    }

    /**
     * Ensures that this node is modifiable (that is, not marked PROTECTED).
     *
     * @exception RuntimeException is not modifiable
     */
    final void checkModifiable() {
        if ((this.typeAndFlags & 4) != 0) {
            throw new IllegalArgumentException("AST node cannot be modified"); //$NON-NLS-1$
        }
    }

    /**
     * End lazy initialization of this node. Here is the code pattern found in all AST node subclasses. For thread
     * safety it uses a "double-checked locking idiom":
     *
     * <pre>
     * private volatile ASTNode node; // has to be declared volatile and ASTNode has to be threadsafe!
     * ...
     * if (this.node == null) {
     *    synchronized (this) {
     *       if (this.node == null) { // double check
     *          ASTNode node = ...; // code to create new node
     *          node.xyz = ...; // initialize all fields
     *          // Finally write the full initialized field:
     *          this.node = postLazyInit(node, FOO_PROPERTY);
     *          // Do not modify node after writing it to this.node!
     *       }
     *    }
     * }
     * </pre>
     *
     * @param newChild the new child of this node
     * @param property the property descriptor of this node describing the relationship between node and child
     */
    final <T extends ASTNode> T postLazyInit(T newChild, ChildPropertyDescriptor property) {
        // IMPORTANT: this method is called by readers
        // ASTNode.this is locked at this point
        // newChild is brand new (so no chance of concurrent access)
        newChild.setParent(this, property);
        return newChild;
    }

    /**
     * Returns the value of the named property of this node, or <code>null</code> if none.
     *
     * @param propertyName the property name
     * @return the property value, or <code>null</code> if none
     * @see #setProperty(String,Object)
     */
    public final Object getProperty(String propertyName) {
        if (propertyName == null) {
            throw new IllegalArgumentException();
        }
        if (this.property1 == null) {
            // node has no properties at all
            return null;
        }
        if (this.property1 instanceof String) {
            // node has only a single property
            if (propertyName.equals(this.property1)) {
                return this.property2;
            } else {
                return null;
            }
        }
        // otherwise node has table of properties
        Map m = (Map) this.property1;
        return m.get(propertyName);
    }

    /**
     * Sets the named property of this node to the given value, or to <code>null</code> to clear it. <p> Clients should
     * employ property names that are sufficiently unique to avoid inadvertent conflicts with other clients that might
     * also be setting properties on the same node. </p> <p> Note that modifying a property is not considered a
     * modification to the AST itself. This is to allow clients to decorate existing nodes with their own properties
     * without jeopardizing certain things (like the validity of bindings), which rely on the underlying tree remaining
     * static. </p>
     *
     * @param propertyName the property name
     * @param data the new property value, or <code>null</code> if none
     * @see #getProperty(String)
     * @throws IllegalArgumentException if the given property name is <code>null</code>
     */
    public final void setProperty(String propertyName, Object data) {
        if (propertyName == null) {
            throw new IllegalArgumentException();
        }
        if (this.property1 == null) {
            // node has no properties at all
            if (data == null) {
                // we already know this
                return;
            }
            // node gets its fist property
            this.property1 = propertyName;
            this.property2 = data;
            return;
        }

        if (this.property1 instanceof String) {
            // node has only a single property
            if (propertyName.equals(this.property1)) {
                // we're in luck
                if (data == null) {
                    // just deleted last property
                    this.property1 = null;
                    this.property2 = null;
                } else {
                    this.property2 = data;
                }
                return;
            }
            if (data == null) {
                // we already know this
                return;
            }
            // node already has one property - getting its second
            // convert to more flexible representation
            Map m = new HashMap(3);
            m.put(this.property1, this.property2);
            m.put(propertyName, data);
            this.property1 = m;
            this.property2 = null;
            return;
        }

        // node has two or more properties
        Map m = (Map) this.property1;
        if (data == null) {
            m.remove(propertyName);
            // check for just one property left
            if (m.size() == 1) {
                // convert to more efficient representation
                Map.Entry[] entries = (Map.Entry[]) m.entrySet().toArray(new Map.Entry[1]);
                this.property1 = entries[0].getKey();
                this.property2 = entries[0].getValue();
            }
        } else {
            m.put(propertyName, data);
            // still has two or more properties
        }
    }

    /**
     * Returns the flags associated with this node. <p> No flags are associated with newly created nodes. </p> <p> The
     * flags are the bitwise-or of individual flags. The following flags are currently defined: <ul>
     * <li><code>1</code> (malformed) - indicates node is syntactically malformed</li> <li><code>2</code> (original) -
     * indicates original node created by ASTParser</li> <li><code>4</code> (protect) - indicates node is protected from
     * further modification</li> <li><code>8</code> (recovered) - indicates node or a part of this node is recovered
     * from
     * source that contains a syntax error</li> </ul> Other bit positions are reserved for future use.
     *
     * @return the bitwise-or of individual flags
     * @see #setFlags(int)
     */
    public final int getFlags() {
        return this.typeAndFlags & 0xFFFF;
    }

    /**
     * Sets the flags associated with this node to the given value. <p> The flags are the bitwise-or of individual
     * flags. The following flags are currently defined: <ul> <li><code>1</code> (malformed) - indicates node is
     * syntactically malformed</li> <li><code>2</code> (original) - indicates original node created by ASTParser</li>
     * <li><code>4</code> (protect) - indicates node is protected from further modification</li> <li><code>8</code>
     * (recovered) - indicates node or a part of this node is recovered from source that contains a syntax error</li>
     * </ul> Other bit positions are reserved for future use. <p> Note that the flags are <em>not</em> considered a
     * structural property of the node, and can be changed even if the node is marked as protected. </p>
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
        if (visitor == null) {
            throw new IllegalArgumentException();
        }
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
     * visitor.endVisit(this);
     * </code>
     * </pre>
     *
     * Note that the caller (<code>accept</code>) take cares of invoking <code>visitor.preVisit(this)</code> and
     * <code>visitor.postVisit(this)</code>. </p>
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
    final void acceptChildren(ASTVisitor visitor, ASTNode.NodeList children) {
        // use a cursor to keep track of where we are up to
        // (the list may be changing under foot)
        NodeList.Cursor cursor = children.newCursor();
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
     * {@link ASTParser#setKind(int)} for details on precisely where source ranges begin and end. </p>
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
     * {@link ASTParser#setKind(int)} methods for details on precisely where source ranges begin and end. </p>
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
     * <p> See {@link ASTParser#setKind(int)} for details on precisely where source ranges are supposed to begin and
     * end. </p>
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
        checkModifiable();
        this.startPosition = startPosition;
        this.length = length;
    }

    /**
     * Returns a string representation of this node suitable for debugging purposes only.
     *
     * @return a debug string
     */
    @Override
    public final String toString() {
        StringBuilder buffer = new StringBuilder();
        int p = buffer.length();
        try {
            appendDebugString(buffer);
        } catch (RuntimeException e) {
            // since debugger sometimes call toString methods, problems can easily happen when
            // toString is called on an instance that is being initialized
            buffer.setLength(p);
            buffer.append("!"); //$NON-NLS-1$
            buffer.append(standardToString());
        }
        return buffer.toString();
    }

    /**
     * Returns the string representation of this node produced by the standard <code>Object.toString</code> method.
     *
     * @return a debug string
     */
    final String standardToString() {
        return super.toString();
    }

    /**
     * Appends a debug representation of this node to the given string buffer. <p> The <code>ASTNode</code>
     * implementation of this method prints out the entire subtree. Subclasses may override to provide a more succinct
     * representation. </p>
     *
     * @param buffer the string buffer to append to
     */
    void appendDebugString(StringBuilder buffer) {
        // print the subtree by default
        appendPrintString(buffer);
    }

    /**
     * Appends a standard Java source code representation of this subtree to the given string buffer.
     *
     * @param buffer the string buffer to append to
     */
    final void appendPrintString(StringBuilder buffer) {
        NaiveASTFlattener printer = new NaiveASTFlattener();
        accept(printer);
        buffer.append(printer.getResult());
    }
}
