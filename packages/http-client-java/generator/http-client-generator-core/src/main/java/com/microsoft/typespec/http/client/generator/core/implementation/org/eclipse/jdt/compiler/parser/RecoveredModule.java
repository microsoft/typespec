// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
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
 *
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ExportsStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ModuleDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ModuleStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.OpensStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ProvidesStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.RequiresStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.UsesStatement;

public class RecoveredModule extends RecoveredElement {

    public RecoveredExportsStatement[] exports;
    public int exportCount;
    public RecoveredOpensStatement[] opens;
    public int opensCount;
    public RecoveredRequiresStatement[] requires;
    public int requiresCount;
    public RecoveredUsesStatement[] uses;
    public int usesCount;
    public RecoveredProvidesStatement[] services;
    public int servicesCount;
    public ModuleDeclaration moduleDeclaration;

    public RecoveredModule(ModuleDeclaration moduleDeclaration, RecoveredElement parent, int bracketBalance) {
        super(parent, bracketBalance);
        this.moduleDeclaration = moduleDeclaration;
    }

    @Override
    public RecoveredElement add(ModuleStatement moduleStatement, int bracketBalanceValue) {

        // TODO: can't we do away with all these additions except for ProvidesStatement - to check
        // if there are any corner cases that uses these.
        if (moduleStatement instanceof ExportsStatement) {
            return add((ExportsStatement) moduleStatement, bracketBalanceValue);
        }
        if (moduleStatement instanceof OpensStatement) {
            return add((OpensStatement) moduleStatement, bracketBalanceValue);
        }
        if (moduleStatement instanceof RequiresStatement) {
            return add((RequiresStatement) moduleStatement, bracketBalanceValue);
        }
        if (moduleStatement instanceof ProvidesStatement) {
            return add((ProvidesStatement) moduleStatement, bracketBalanceValue);
        }
        if (moduleStatement instanceof UsesStatement) {
            return add((UsesStatement) moduleStatement, bracketBalanceValue);
        }

        return this;
    }

    public RecoveredElement add(ExportsStatement exportsStatement, int bracketBalanceValue) {
        resetPendingModifiers();

        if (this.exports == null) {
            this.exports = new RecoveredExportsStatement[5];
            this.exportCount = 0;
        } else {
            if (this.exportCount == this.exports.length) {
                System.arraycopy(this.exports, 0, (this.exports = new RecoveredExportsStatement[2 * this.exportCount]),
                    0, this.exportCount);
            }
        }
        RecoveredExportsStatement element = new RecoveredExportsStatement(exportsStatement, this, bracketBalanceValue);
        this.exports[this.exportCount++] = element;

        return element;
    }

    public RecoveredElement add(OpensStatement opensStatement, int bracketBalanceValue) {
        resetPendingModifiers();

        if (this.opens == null) {
            this.opens = new RecoveredOpensStatement[5];
            this.opensCount = 0;
        } else {
            if (this.opensCount == this.opens.length) {
                System.arraycopy(this.opens, 0, (this.opens = new RecoveredOpensStatement[2 * this.opensCount]), 0,
                    this.opensCount);
            }
        }
        RecoveredOpensStatement element = new RecoveredOpensStatement(opensStatement, this, bracketBalanceValue);
        this.opens[this.opensCount++] = element;

        return element;
    }

    public RecoveredElement add(RequiresStatement requiresStatement, int bracketBalanceValue) {
        if (this.requires == null) {
            this.requires = new RecoveredRequiresStatement[5];
            this.requiresCount = 0;
        } else {
            if (this.requiresCount == this.requires.length) {
                System.arraycopy(this.requires, 0,
                    (this.requires = new RecoveredRequiresStatement[2 * this.requiresCount]), 0, this.requiresCount);
            }
        }
        RecoveredRequiresStatement element
            = new RecoveredRequiresStatement(requiresStatement, this, bracketBalanceValue);
        this.requires[this.requiresCount++] = element;
        return this;
    }

    public RecoveredElement add(ProvidesStatement providesStatement, int bracketBalanceValue) {
        if (this.services == null) {
            this.services = new RecoveredProvidesStatement[5];
            this.servicesCount = 0;
        } else {
            if (this.servicesCount == this.services.length) {
                System.arraycopy(this.services, 0,
                    (this.services = new RecoveredProvidesStatement[2 * this.servicesCount]), 0, this.servicesCount);
            }
        }
        RecoveredProvidesStatement element
            = new RecoveredProvidesStatement(providesStatement, this, bracketBalanceValue);
        this.services[this.servicesCount++] = element;
        return element;
    }

    public RecoveredElement add(UsesStatement usesStatement, int bracketBalanceValue) {
        genAssign(usesStatement, bracketBalanceValue);
        return this;
    }

    private void genAssign(UsesStatement usesStatement, int bracketBalanceValue) {
        if (this.uses == null) {
            this.uses = new RecoveredUsesStatement[5];
            this.usesCount = 0;
        } else {
            if (this.usesCount == this.uses.length) {
                System.arraycopy(this.uses, 0, (this.uses = new RecoveredUsesStatement[2 * this.usesCount]), 0,
                    this.usesCount);
            }
        }
        RecoveredUsesStatement element = new RecoveredUsesStatement(usesStatement, this, bracketBalanceValue);
        this.uses[this.usesCount++] = element;
    }

    public ModuleDeclaration updatedModuleDeclaration() {
        updateExports(this.moduleDeclaration);
        updateOpens(this.moduleDeclaration);
        updateRequires(this.moduleDeclaration);
        updateUses(this.moduleDeclaration);
        updateServices(this.moduleDeclaration);
        return this.moduleDeclaration;
    }

    private void updateExports(ModuleDeclaration mod) {
        if (this.exportCount > 0) {
            int existingCount = mod.exportsCount, actualCount = 0;
            ExportsStatement[] exports1 = new ExportsStatement[existingCount + this.exportCount];
            if (existingCount > 0) {
                System.arraycopy(mod.exports, 0, exports1, 0, existingCount);
                actualCount = existingCount;
            }
            for (int i = 0; i < this.exportCount; i++) {
                exports1[actualCount++] = (ExportsStatement) this.exports[i].updatedPackageVisibilityStatement();
            }
            mod.exports = exports1;
            mod.exportsCount = actualCount;
        }
    }

    private void updateOpens(ModuleDeclaration mod) {
        if (this.opensCount > 0) {
            int existingCount = mod.opensCount, actualCount = 0;
            OpensStatement[] opens1 = new OpensStatement[existingCount + this.opensCount];
            if (existingCount > 0) {
                System.arraycopy(mod.exports, 0, opens1, 0, existingCount);
                actualCount = existingCount;
            }
            for (int i = 0; i < this.opensCount; i++) {
                opens1[actualCount++] = (OpensStatement) this.opens[i].updatedPackageVisibilityStatement();
            }
            mod.opens = opens1;
            mod.opensCount = actualCount;
        }
    }

    private void updateRequires(ModuleDeclaration mod) {
        if (this.requiresCount > 0) {
            int existingCount = mod.requiresCount, actualCount = 0;
            RequiresStatement[] requiresStmts = new RequiresStatement[existingCount + this.requiresCount];
            if (existingCount > 0) {
                System.arraycopy(mod.requires, 0, requiresStmts, 0, existingCount);
                actualCount = existingCount;
            }
            for (int i = 0; i < this.requiresCount; i++) {
                requiresStmts[actualCount++] = this.requires[i].updatedRequiresStatement();
            }
            mod.requires = requiresStmts;
            mod.requiresCount = actualCount;
        }
    }

    private void updateUses(ModuleDeclaration mod) {
        if (this.usesCount > 0) {
            int existingCount = mod.usesCount, actualCount = 0;
            UsesStatement[] usesStmts = new UsesStatement[existingCount + this.usesCount];
            if (existingCount > 0) {
                System.arraycopy(mod.uses, 0, usesStmts, 0, existingCount);
                actualCount = existingCount;
            }
            for (int i = 0; i < this.usesCount; ++i) {
                usesStmts[actualCount++] = this.uses[i].updatedUsesStatement();
            }
            mod.uses = usesStmts;
            mod.usesCount = actualCount;
        }
    }

    private void updateServices(ModuleDeclaration mod) {
        if (this.servicesCount > 0) {
            int existingCount = mod.servicesCount, actualCount = 0;
            ProvidesStatement[] providesStmts = new ProvidesStatement[existingCount + this.servicesCount];
            if (existingCount > 0) {
                System.arraycopy(mod.services, 0, providesStmts, 0, existingCount);
                actualCount = existingCount;
            }
            for (int i = 0; i < this.servicesCount; ++i) {
                providesStmts[actualCount++] = this.services[i].updatedProvidesStatement();
            }
            mod.services = providesStmts;
            mod.servicesCount = actualCount;
        }
    }

    @Override
    public void updateParseTree() {
        updatedModuleDeclaration();
    }
}
