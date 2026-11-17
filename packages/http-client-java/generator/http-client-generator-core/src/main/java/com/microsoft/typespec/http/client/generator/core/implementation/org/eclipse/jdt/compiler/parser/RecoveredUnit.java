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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

/**
 * Internal field structure for parsing recovery
 */
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.*;
import java.util.HashSet;
import java.util.Set;

public class RecoveredUnit extends RecoveredElement {

    public CompilationUnitDeclaration unitDeclaration;

    public RecoveredImport[] imports;
    public int importCount;
    public RecoveredModule module;
    public RecoveredType[] types;
    public int typeCount;

    int pendingModifiers;
    int pendingModifersSourceStart = -1;
    RecoveredAnnotation[] pendingAnnotations;
    int pendingAnnotationCount;

    public RecoveredUnit(CompilationUnitDeclaration unitDeclaration, Parser parser) {
        super(null, 0, parser);
        this.unitDeclaration = unitDeclaration;
    }

    @Override
    public RecoveredElement addAnnotationName(int identifierPtr, int identifierLengthPtr, int annotationStart,
        int bracketBalanceValue) {
        if (this.pendingAnnotations == null) {
            this.pendingAnnotations = new RecoveredAnnotation[5];
            this.pendingAnnotationCount = 0;
        } else {
            if (this.pendingAnnotationCount == this.pendingAnnotations.length) {
                System.arraycopy(this.pendingAnnotations, 0,
                    (this.pendingAnnotations = new RecoveredAnnotation[2 * this.pendingAnnotationCount]), 0,
                    this.pendingAnnotationCount);
            }
        }

        RecoveredAnnotation element
            = new RecoveredAnnotation(identifierPtr, identifierLengthPtr, annotationStart, this, bracketBalanceValue);

        this.pendingAnnotations[this.pendingAnnotationCount++] = element;

        return element;
    }

    @Override
    public void addModifier(int flag, int modifiersSourceStart) {
        this.pendingModifiers |= flag;

        if (this.pendingModifersSourceStart < 0) {
            this.pendingModifersSourceStart = modifiersSourceStart;
        }
    }

    /*
     * Record a method declaration: should be attached to last type
     */
    @Override
    public RecoveredElement add(AbstractMethodDeclaration methodDeclaration, int bracketBalanceValue) {

        /* attach it to last type - if any */
        if (this.typeCount > 0) {
            RecoveredType type = this.types[this.typeCount - 1];
            int start = type.bodyEnd;
            int end = type.typeDeclaration.bodyEnd;
            type.bodyEnd = 0; // reset position
            type.typeDeclaration.declarationSourceEnd = 0; // reset position
            type.typeDeclaration.bodyEnd = 0;

            int kind = TypeDeclaration.kind(type.typeDeclaration.modifiers);
            if (start > 0 && start < end && kind != 2 && kind != 4) {
                // the } of the last type can be considered as the end of an initializer
                Block block = new Block(0);
                block.sourceStart = block.sourceEnd = end;
                Initializer initializer = new Initializer(block, 0);
                initializer.bodyStart = end;
                initializer.bodyEnd = end;
                initializer.declarationSourceStart = end;
                initializer.declarationSourceEnd = end;
                initializer.sourceStart = end;
                initializer.sourceEnd = end;
                type.add(initializer, bracketBalanceValue);
            }

            resetPendingModifiers();

            return type.add(methodDeclaration, bracketBalanceValue);
        }
        return this; // ignore
    }

    /*
     * Record a field declaration: should be attached to last type
     */
    @Override
    public RecoveredElement add(FieldDeclaration fieldDeclaration, int bracketBalanceValue) {

        /* attach it to last type - if any */
        if (this.typeCount > 0) {
            RecoveredType type = this.types[this.typeCount - 1];
            type.bodyEnd = 0; // reset position
            type.typeDeclaration.declarationSourceEnd = 0; // reset position
            type.typeDeclaration.bodyEnd = 0;

            resetPendingModifiers();

            return type.add(fieldDeclaration, bracketBalanceValue);
        }
        return this; // ignore
    }

    @Override
    public RecoveredElement add(ImportReference importReference, int bracketBalanceValue) {
        resetPendingModifiers();

        if (this.imports == null) {
            this.imports = new RecoveredImport[5];
            this.importCount = 0;
        } else {
            if (this.importCount == this.imports.length) {
                System.arraycopy(this.imports, 0, (this.imports = new RecoveredImport[2 * this.importCount]), 0,
                    this.importCount);
            }
        }
        RecoveredImport element = new RecoveredImport(importReference, this, bracketBalanceValue);
        this.imports[this.importCount++] = element;

        /* if import not finished, then import becomes current */
        if (importReference.declarationSourceEnd == 0)
            return element;
        return this;
    }

    @Override
    public RecoveredElement add(ModuleDeclaration moduleDeclaration, int bracketBalanceValue) {
        this.module = new RecoveredModule(moduleDeclaration, this, bracketBalanceValue);
        return this.module;
    }

    @Override
    public RecoveredElement add(TypeDeclaration typeDeclaration, int bracketBalanceValue) {
        if ((typeDeclaration.bits & 512) != 0) {
            if (this.typeCount > 0) {
                // add it to the last type
                RecoveredType lastType = this.types[this.typeCount - 1];
                lastType.bodyEnd = 0; // reopen type
                lastType.typeDeclaration.bodyEnd = 0; // reopen type
                lastType.typeDeclaration.declarationSourceEnd = 0; // reopen type
                lastType.bracketBalance++; // expect one closing brace

                resetPendingModifiers();

                return lastType.add(typeDeclaration, bracketBalanceValue);
            }
        }
        if (this.types == null) {
            this.types = new RecoveredType[5];
            this.typeCount = 0;
        } else {
            if (this.typeCount == this.types.length) {
                System.arraycopy(this.types, 0, (this.types = new RecoveredType[2 * this.typeCount]), 0,
                    this.typeCount);
            }
        }
        RecoveredType element = new RecoveredType(typeDeclaration, this, bracketBalanceValue);
        this.types[this.typeCount++] = element;

        if (this.pendingAnnotationCount > 0) {
            element.attach(this.pendingAnnotations, this.pendingAnnotationCount, this.pendingModifiers,
                this.pendingModifersSourceStart);
        }
        resetPendingModifiers();

        /* if type not finished, then type becomes current */
        if (typeDeclaration.declarationSourceEnd == 0)
            return element;
        return this;
    }

    /*
     * Answer the associated parsed structure
     */
    @Override
    public ASTNode parseTree() {
        return this.unitDeclaration;
    }

    @Override
    public void resetPendingModifiers() {
        this.pendingAnnotations = null;
        this.pendingAnnotationCount = 0;
        this.pendingModifiers = 0;
        this.pendingModifersSourceStart = -1;
    }

    /*
     * Answer the very source end of the corresponding parse node
     */
    @Override
    public int getLastStart() {
        int lastTypeStart = -1;

        if (this.typeCount > 0) {
            TypeDeclaration lastType = this.types[this.typeCount - 1].typeDeclaration;
            if (lastTypeStart < lastType.declarationSourceStart && lastType.declarationSourceStart != 0) {
                lastTypeStart = lastType.declarationSourceStart;
            }
        }
        return lastTypeStart;
    }

    public void updatedCompilationUnitDeclaration() {

        /* update imports */
        if (this.importCount > 0) {
            ImportReference[] importRefences = new ImportReference[this.importCount];
            for (int i = 0; i < this.importCount; i++) {
                importRefences[i] = this.imports[i].updatedImportReference();
            }
            this.unitDeclaration.imports = importRefences;
        }
        if (this.module != null) {
            this.unitDeclaration.moduleDeclaration = this.module.updatedModuleDeclaration();
        }
        /* update types */
        if (this.typeCount > 0) {
            int existingCount = this.unitDeclaration.types == null ? 0 : this.unitDeclaration.types.length;
            TypeDeclaration[] typeDeclarations = new TypeDeclaration[existingCount + this.typeCount];
            if (existingCount > 0) {
                System.arraycopy(this.unitDeclaration.types, 0, typeDeclarations, 0, existingCount);
            }
            // may need to update the declarationSourceEnd of the last type
            if (this.types[this.typeCount - 1].typeDeclaration.declarationSourceEnd == 0) {
                this.types[this.typeCount - 1].typeDeclaration.declarationSourceEnd = this.unitDeclaration.sourceEnd;
                this.types[this.typeCount - 1].typeDeclaration.bodyEnd = this.unitDeclaration.sourceEnd;
            }

            Set<TypeDeclaration> knownTypes = new HashSet<>();
            int actualCount = existingCount;
            for (int i = 0; i < this.typeCount; i++) {
                TypeDeclaration typeDecl = this.types[i].updatedTypeDeclaration(0, knownTypes);
                // filter out local types (12454)
                if (typeDecl != null && (typeDecl.bits & 256) == 0) {
                    typeDeclarations[actualCount++] = typeDecl;
                }
            }
            if (actualCount != this.typeCount) {
                System.arraycopy(typeDeclarations, 0,
                    typeDeclarations = new TypeDeclaration[existingCount + actualCount], 0,
                    existingCount + actualCount);
            }
            this.unitDeclaration.types = typeDeclarations;
        }
    }

    @Override
    public void updateParseTree() {
        updatedCompilationUnitDeclaration();
    }

    /*
     * Update the sourceEnd of the corresponding parse node
     */
    @Override
    public void updateSourceEndIfNecessary(int bodyStart, int bodyEnd) {
        if (this.unitDeclaration.sourceEnd == 0)
            this.unitDeclaration.sourceEnd = bodyEnd;
    }
}
