// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

public class ModuleInfo {
    private final String moduleName;
    private final List<RequireModule> requireModules = new ArrayList<>();
    private final List<ExportModule> exportModules = new ArrayList<>();
    private final List<OpenModule> openModules = new ArrayList<>();

    public static class RequireModule {
        private final String moduleName;
        private final boolean isTransitive;

        public RequireModule(String moduleName) {
            this.moduleName = moduleName;
            this.isTransitive = false;
        }

        public RequireModule(String moduleName, boolean isTransitive) {
            this.moduleName = moduleName;
            this.isTransitive = isTransitive;
        }

        public String getModuleName() {
            return moduleName;
        }

        public boolean isTransitive() {
            return isTransitive;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            RequireModule that = (RequireModule) o;
            return isTransitive == that.isTransitive && Objects.equals(moduleName, that.moduleName);
        }

        @Override
        public int hashCode() {
            return Objects.hash(moduleName, isTransitive);
        }
    }

    public static class ExportModule {
        private final String moduleName;

        public ExportModule(String moduleName) {
            this.moduleName = moduleName;
        }

        public String getModuleName() {
            return moduleName;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            ExportModule that = (ExportModule) o;
            return Objects.equals(moduleName, that.moduleName);
        }

        @Override
        public int hashCode() {
            return Objects.hash(moduleName);
        }
    }

    public static class OpenModule {
        private final String moduleName;
        private final List<String> openToModules;

        public OpenModule(String moduleName) {
            this.moduleName = moduleName;
            this.openToModules = null;
        }

        public OpenModule(String moduleName, List<String> openToModules) {
            this.moduleName = moduleName;
            this.openToModules = openToModules;
        }

        public String getModuleName() {
            return moduleName;
        }

        public List<String> getOpenToModules() {
            return openToModules;
        }

        public boolean isOpenTo() {
            return openToModules != null && !openToModules.isEmpty();
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            OpenModule that = (OpenModule) o;
            return Objects.equals(moduleName, that.moduleName) && Objects.equals(openToModules, that.openToModules);
        }

        @Override
        public int hashCode() {
            return Objects.hash(moduleName, openToModules);
        }
    }

    public ModuleInfo(String moduleName) {
        this.moduleName = moduleName;
    }

    public String getModuleName() {
        return moduleName;
    }

    public List<RequireModule> getRequireModules() {
        return requireModules;
    }

    public List<ExportModule> getExportModules() {
        return exportModules;
    }

    public List<OpenModule> getOpenModules() {
        return openModules;
    }

    // TODO (weidxu): this method likely will get refactored when we support external model (hence external package)
    public void checkForAdditionalDependencies(Set<String> externalPackageNames) {
        // currently, only check for azure-core-experimental
        if (externalPackageNames.stream().anyMatch(p -> p.startsWith("com.azure.core.experimental"))) {
            getRequireModules().add(new ModuleInfo.RequireModule("com.azure.core.experimental", true));
        }
    }
}
