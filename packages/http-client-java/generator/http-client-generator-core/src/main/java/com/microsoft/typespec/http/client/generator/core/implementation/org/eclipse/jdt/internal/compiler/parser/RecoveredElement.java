// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2017 IBM Corporation and others.
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

/**
 * Internal structure for parsing recovery
 */
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;

public abstract class RecoveredElement {

    public RecoveredElement parent;
    public int bracketBalance;
    public boolean foundOpeningBrace;
    protected Parser recoveringParser;

    // There is no RecoveredLambdaElement, we just keep track of entry and exit of lambdas via a counter. This allows to
    // prevent certain incorrect mutations of current element.
    // See https://bugs.eclipse.org/bugs/show_bug.cgi?id=430667.
    public int lambdaNestLevel;

    public RecoveredElement(RecoveredElement parent, int bracketBalance) {
        this(parent, bracketBalance, null);
    }

    public RecoveredElement(RecoveredElement parent, int bracketBalance, Parser parser) {
        this.parent = parent;
        this.bracketBalance = bracketBalance;
        this.recoveringParser = parser;
    }

    public RecoveredElement addAnnotationName(int identifierPtr, int identifierLengthPtr, int annotationStart,
        int bracketBalanceValue) {
        /* default behavior is to delegate recording to parent if any */
        resetPendingModifiers();
        if (this.parent == null)
            return this; // ignore
        this.updateSourceEndIfNecessary(previousAvailableLineEnd(annotationStart - 1));
        return this.parent.addAnnotationName(identifierPtr, identifierLengthPtr, annotationStart, bracketBalanceValue);
    }

    /*
     * Record a method declaration
     */
    public RecoveredElement add(AbstractMethodDeclaration methodDeclaration, int bracketBalanceValue) {

        /* default behavior is to delegate recording to parent if any */
        resetPendingModifiers();
        if (this.parent == null)
            return this; // ignore
        this.updateSourceEndIfNecessary(previousAvailableLineEnd(methodDeclaration.declarationSourceStart - 1));
        return this.parent.add(methodDeclaration, bracketBalanceValue);
    }

    /*
     * Record a nested block declaration
     */
    public RecoveredElement add(Block nestedBlockDeclaration, int bracketBalanceValue) {

        /* default behavior is to delegate recording to parent if any */
        resetPendingModifiers();
        if (this.parent == null)
            return this; // ignore
        this.updateSourceEndIfNecessary(previousAvailableLineEnd(nestedBlockDeclaration.sourceStart - 1));
        return this.parent.add(nestedBlockDeclaration, bracketBalanceValue);
    }

    /*
     * Record an e reference
     */
    public RecoveredElement add(ModuleStatement moduleStatement, int bracketBalanceValue) {

        /* default behavior is to delegate recording to parent if any */
        resetPendingModifiers();
        if (this.parent == null)
            return this; // ignore
        this.updateSourceEndIfNecessary(previousAvailableLineEnd(moduleStatement.declarationSourceStart - 1));
        return this.parent.add(moduleStatement, bracketBalanceValue);
    }

    /*
     * Record a field declaration
     */
    public RecoveredElement add(FieldDeclaration fieldDeclaration, int bracketBalanceValue) {

        /* default behavior is to delegate recording to parent if any */
        resetPendingModifiers();
        if (this.parent == null)
            return this; // ignore
        this.updateSourceEndIfNecessary(previousAvailableLineEnd(fieldDeclaration.declarationSourceStart - 1));
        return this.parent.add(fieldDeclaration, bracketBalanceValue);
    }

    /*
     * Record an import reference
     */
    public RecoveredElement add(ImportReference importReference, int bracketBalanceValue) {

        /* default behavior is to delegate recording to parent if any */
        resetPendingModifiers();
        if (this.parent == null)
            return this; // ignore
        this.updateSourceEndIfNecessary(previousAvailableLineEnd(importReference.declarationSourceStart - 1));
        return this.parent.add(importReference, bracketBalanceValue);
    }

    /*
     * Record a local declaration
     */
    public RecoveredElement add(LocalDeclaration localDeclaration, int bracketBalanceValue) {

        /* default behavior is to delegate recording to parent if any */
        resetPendingModifiers();
        if (this.parent == null)
            return this; // ignore
        this.updateSourceEndIfNecessary(previousAvailableLineEnd(localDeclaration.declarationSourceStart - 1));
        return this.parent.add(localDeclaration, bracketBalanceValue);
    }

    /*
     * Record a statement
     */
    public RecoveredElement add(Statement statement, int bracketBalanceValue) {

        /* default behavior is to delegate recording to parent if any */
        resetPendingModifiers();
        if (this.parent == null)
            return this; // ignore
        if (this instanceof RecoveredType) {
            TypeDeclaration typeDeclaration = ((RecoveredType) this).typeDeclaration;
            if (typeDeclaration != null && (typeDeclaration.bits & 512) != 0) {
                // https://bugs.eclipse.org/bugs/show_bug.cgi?id=291040, new X(<SelectOnMessageSend:zoo()>) { ???
                if (statement.sourceStart > typeDeclaration.sourceStart
                    && statement.sourceEnd < typeDeclaration.sourceEnd) {
                    return this;
                }
            }
        }
        this.updateSourceEndIfNecessary(previousAvailableLineEnd(statement.sourceStart - 1));
        return this.parent.add(statement, bracketBalanceValue);
    }

    public RecoveredElement add(ModuleDeclaration moduleDeclaration, int bracketBalanceValue) {
        resetPendingModifiers();
        if (this.parent == null)
            return this; // ignore
        this.updateSourceEndIfNecessary(previousAvailableLineEnd(moduleDeclaration.declarationSourceStart - 1));
        return this.parent.add(moduleDeclaration, bracketBalanceValue);
    }

    /*
     * Record a type declaration
     */
    public RecoveredElement add(TypeDeclaration typeDeclaration, int bracketBalanceValue) {

        /* default behavior is to delegate recording to parent if any */
        resetPendingModifiers();
        if (this.parent == null)
            return this; // ignore
        this.updateSourceEndIfNecessary(previousAvailableLineEnd(typeDeclaration.declarationSourceStart - 1));
        return this.parent.add(typeDeclaration, bracketBalanceValue);
    }

    protected void addBlockStatement(RecoveredBlock recoveredBlock) {
        Block block = recoveredBlock.blockDeclaration;
        if (block.statements != null) {
            Statement[] statements = block.statements;
            for (Statement statement : statements) {
                recoveredBlock.add(statement, 0);
            }
        }
    }

    public void addModifier(int flag, int modifiersSourceStart) {
        // default implementation: do nothing
    }

    /*
     * Answer the depth of this element, considering the parent link.
     */
    /*
     * Answer the enclosing method node, or null if none
     */
    public RecoveredInitializer enclosingInitializer() {
        RecoveredElement current = this;
        while (current != null) {
            if (current instanceof RecoveredInitializer) {
                return (RecoveredInitializer) current;
            }
            current = current.parent;
        }
        return null;
    }

    /*
     * Answer the enclosing method node, or null if none
     */
    public RecoveredMethod enclosingMethod() {
        RecoveredElement current = this;
        while (current != null) {
            if (current instanceof RecoveredMethod) {
                return (RecoveredMethod) current;
            }
            current = current.parent;
        }
        return null;
    }

    /*
     * Answer the enclosing type node, or null if none
     */
    public RecoveredType enclosingType() {
        RecoveredElement current = this;
        while (current != null) {
            if (current instanceof RecoveredType) {
                return (RecoveredType) current;
            }
            current = current.parent;
        }
        return null;
    }

    /*
     * Answer the closest specified parser
     */
    public Parser parser() {
        RecoveredElement current = this;
        while (current != null) {
            if (current.recoveringParser != null) {
                return current.recoveringParser;
            }
            current = current.parent;
        }
        return null;
    }

    /*
     * Answer the associated parsed structure
     */
    public ASTNode parseTree() {
        return null;
    }

    public void resetPendingModifiers() {
        // default implementation: do nothing
        // recovered elements which have pending modifiers must override this method
    }

    /*
     * Iterate the enclosing blocks and tag them so as to preserve their content
     */
    /*
     * Answer the position of the previous line end if there is nothing but spaces in between it and the line end. Used
     * to trim spaces on unclosed elements.
     */
    public int previousAvailableLineEnd(int position) {
        Parser parser = parser();
        if (parser == null)
            return position;

        Scanner scanner = parser.scanner;
        if (scanner.lineEnds == null)
            return position;

        int index = Util.getLineNumber(position, scanner.lineEnds, 0, scanner.linePtr);
        if (index < 2)
            return position;
        int previousLineEnd = scanner.lineEnds[index - 2];

        char[] source = scanner.source;
        for (int i = previousLineEnd + 1; i < position; i++) {
            if (!(source[i] == ' ' || source[i] == '\t'))
                return position;
        }
        return previousLineEnd;
    }

    /*
     * Answer the very source end of the corresponding parse node
     */
    public int getLastStart() {
        ASTNode parseTree = parseTree();
        return parseTree == null ? -1 : parseTree.sourceStart;
    }

    protected String tabString(int tab) {
        StringBuilder result = new StringBuilder();
        for (int i = tab; i > 0; i--) {
            result.append("  "); //$NON-NLS-1$
        }
        return result.toString();
    }

    /*
     * Answer the top node
     */
    public RecoveredElement topElement() {
        RecoveredElement current = this;
        while (current.parent != null) {
            current = current.parent;
        }
        return current;
    }

    @Override
    public String toString() {
        return toString(0);
    }

    public abstract String toString(int tab);

    /*
     * Answer the enclosing type node, or null if none
     */
    /*
     * Update the bodyStart of the corresponding parse node
     */
    public void updateBodyStart(int bodyStart) {
        this.foundOpeningBrace = true;
    }

    /*
     * Update the corresponding parse node from parser state which is about to disappear because of restarting recovery
     */
    public void updateFromParserState() {
        // default implementation: do nothing
    }

    /*
     * A closing brace got consumed, might have closed the current element, in which case both the currentElement is
     * exited
     */
    public RecoveredElement updateOnClosingBrace(int braceStart, int braceEnd) {
        if ((--this.bracketBalance <= 0) && (this.parent != null)) {
            this.updateSourceEndIfNecessary(braceStart, braceEnd);
            return this.parent;
        }
        return this;
    }

    /*
     * An opening brace got consumed, might be the expected opening one of the current element, in which case the
     * bodyStart is updated.
     */
    /* public RecoveredElement updateOnOpeningBrace(int braceEnd){return null;} */
    public RecoveredElement updateOnOpeningBrace(int braceStart, int braceEnd) {
        if (this.bracketBalance++ == 0) {
            updateBodyStart(braceEnd + 1);
            return this;
        }
        return null; // no update is necessary
    }

    /*
     * Final update the corresponding parse node
     */
    public abstract void updateParseTree();

    /*
     * Update the declarationSourceEnd of the corresponding parse node
     */
    public void updateSourceEndIfNecessary(int braceStart, int braceEnd) {
        // default implementation: do nothing
    }

    public void updateSourceEndIfNecessary(int sourceEnd) {
        this.updateSourceEndIfNecessary(sourceEnd + 1, sourceEnd);
    }
}
