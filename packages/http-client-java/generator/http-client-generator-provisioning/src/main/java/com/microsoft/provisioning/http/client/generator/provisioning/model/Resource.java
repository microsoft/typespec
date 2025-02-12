package com.microsoft.provisioning.http.client.generator.provisioning.model;

import com.microsoft.provisioning.http.client.generator.provisioning.utils.IndentWriter;
import com.microsoft.provisioning.http.client.generator.provisioning.utils.NameUtils;
import com.microsoft.provisioning.http.client.generator.provisioning.utils.ReflectionUtils;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Represents a resource in the Azure provisioning model.
 */
public class Resource extends TypeModel {
    private String resourceType;
    private String resourceNamespace;
    private String defaultResourceVersion;
    private List<String> resourceVersions;
    private NameRequirements nameRequirements;
    private boolean generateRoleAssignment = false;
    private Resource parentResource;
    private SimpleModel getKeysType;
    private boolean getKeysIsList;
    private FluentResourceModel resourceModel;

    public Resource(Specification spec, FluentResourceModel armType) {
        super(spec, armType.getInnerModel(), armType.getInnerModel().getName(), armType.getInnerModel().getPackage(),
            "");
        this.resourceModel = armType;
    }

    public FluentResourceModel getResourceModel() {
        return resourceModel;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceNamespace() {
        return resourceNamespace;
    }

    public void setResourceNamespace(String resourceNamespace) {
        this.resourceNamespace = resourceNamespace;
    }

    public String getDefaultResourceVersion() {
        return defaultResourceVersion;
    }

    public void setDefaultResourceVersion(String defaultResourceVersion) {
        this.defaultResourceVersion = defaultResourceVersion;
    }

    public List<String> getResourceVersions() {
        return resourceVersions;
    }

    public void setResourceVersions(List<String> resourceVersions) {
        this.resourceVersions = resourceVersions;
    }

    public NameRequirements getNameRequirements() {
        return nameRequirements;
    }

    public void setNameRequirements(NameRequirements nameRequirements) {
        this.nameRequirements = nameRequirements;
    }

    public boolean isGenerateRoleAssignment() {
        return generateRoleAssignment;
    }

    public void setGenerateRoleAssignment(boolean generateRoleAssignment) {
        this.generateRoleAssignment = generateRoleAssignment;
    }

    public Resource getParentResource() {
        return parentResource;
    }

    public void setParentResource(Resource parentResource) {
        this.parentResource = parentResource;
    }

    public SimpleModel getGetKeysType() {
        return getKeysType;
    }

    public void setGetKeysType(SimpleModel getKeysType) {
        this.getKeysType = getKeysType;
    }

    public boolean isGetKeysIsList() {
        return getKeysIsList;
    }

    public void setGetKeysIsList(boolean getKeysIsList) {
        this.getKeysIsList = getKeysIsList;
    }

    @Override
    public String toString() {
        return "<Resource " + getSpec().getName() + "::" + getName() + ">";
    }

    @Override
    public void lint() {
        super.lint();
        if (defaultResourceVersion == null) {
            warn(resourceType + " has no DefaultResourceVersion.");
        } else if (resourceVersions == null) {
            warn(resourceType + " has no ResourceVersions.");
        }
    }

    private String getClassName() {
        return this.getName().replace("Inner", "") + "Resource";
    }

    @Override
    public void generate() {
        IndentWriter writer = new IndentWriter();
        String className = getClassName();
        System.out.println("Generating resource " + className);
        writer.writeLine("// Copyright (c) Microsoft Corporation. All rights reserved.");
        writer.writeLine("// Licensed under the MIT License.");

        writer.writeLine();
        writer.writeLine("package " + this.getProvisioningPackage() + ";");

        writer.writeLine();

        ReflectionUtils.getImportPackages(this.getProperties()).forEach(packageImport -> {
            writer.writeLine("import " + packageImport + ";");
        });
        writer.writeLine("import com.azure.provisioning.BicepValue;");

        writer.writeLine("import com.azure.provisioning.primitives.Resource;");
        writer.writeLine("import com.azure.provisioning.tmp.ResourceType;"); // FIXME temporary type being used

        writer.writeLine();

        writer.writeLine("public class " + className + " extends Resource {");

        writeProperties(writer);
        writeConstructor(writer);
        writeGetterSetterMethods(className, writer);
        writeResourceVersions(writer);

        writer.writeLine("}");
        saveFile(className, writer.toString());
    }

    private void saveFile(String className, String content) {

        Path path = Paths.get(
            this.getSpec().getBaseDir() + "/src/main/java/" + getProvisioningPackage().replace(".", "/") + "/",
            className + ".java");
        try {
            System.out.println("Writing to " + path);
            Files.createDirectories(path.getParent());
            Files.write(path, content.getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void writeResourceVersions(IndentWriter writer) {
        if (resourceVersions == null || resourceVersions.isEmpty()) {
            return;
        }

        writer.indent();
        writer.writeLine();
        writer.writeLine("public static class ResourceVersions {");
        writer.writeLine();
        writer.indent();

        this.resourceVersions.forEach(version -> {
            writer.writeLine(
                "public static final String " + NameUtils.getVersionIdentifier(version) + " = \"" + version + "\";");
            writer.writeLine();
        });
        writer.unindent();
        writer.writeLine("}");
        writer.unindent();

    }

    private void writeGetterSetterMethods(String className, IndentWriter writer) {
        writer.indent();
        writer.writeLine();
        this.getProperties().forEach(property -> {
            writeGetter(writer, property);
            writer.writeLine();
            writeSetter(writer, property, className);
        });
        writer.unindent();
    }

    private void writeSetter(IndentWriter writer, Property property, String className) {
        // set*(BicepValue)
        writer.writeLine("public " + className + " set" + NameUtils.toPascalCase(property.getName()) + "(BicepValue<"
            + property.getPropertyType().getName() + "> " + property.getName() + ") {");
        writer.indent();
        writer.writeLine("this." + property.getName() + ".assign(" + property.getName() + ");");
        writer.writeLine("return this;");
        writer.unindent();
        writer.writeLine("}");
        writer.writeLine();

        // set*(String)
        writer.writeLine("public " + className + " set" + NameUtils.toPascalCase(property.getName()) + "("
            + property.getPropertyType().getName() + " " + property.getName() + ") {");
        writer.indent();
        writer.writeLine("return this.set" + NameUtils.toPascalCase(property.getName()) + "(BicepValue.from("
            + property.getName() + "));");
        writer.unindent();
        writer.writeLine("}");
        writer.writeLine();
    }

    private static void writeGetter(IndentWriter writer, Property property) {
        writer.writeLine("public " + property.getBicepTypeReference() + " get"
            + NameUtils.toPascalCase(property.getName()) + "() {");
        writer.indent();
        writer.writeLine("return this." + property.getName() + ";");
        writer.unindent();
        writer.writeLine("}");
    }

    private void writeProperties(IndentWriter writer) {
        writer.indent();
        writer.writeLine();
        this.getProperties().forEach(property -> {
            String bicepType = property.getBicepTypeReference();
            writer.writeLine("private final " + bicepType + " " + property.getName() + ";");
        });
        writer.unindent();
    }

    private void writeConstructor(IndentWriter writer) {
        writer.indent();
        writer.writeLine();
        writer.writeLine("public " + getClassName() + "(String identifierName) {");
        writer.indent();
        writer.writeLine("this(identifierName, null);");
        writer.unindent();
        writer.writeLine("}");
        writer.writeLine();

        writer.writeLine("public " + getClassName() + "(String identifierName, String resourceVersion) {");
        writer.indent();
        // FIXME ResourceType is a temporary type
        writer.write("super(identifierName, new ResourceType(\"" + resourceNamespace + "\"), resourceVersion);");
        writer.writeLine();

        getProperties().forEach(property -> {
            writer.writeLine(property.getName() + " = " + property.getBicepDefinition(true) + ";");
        });
        writer.unindent();
        writer.writeLine("}");
        writer.unindent();
    }

    // Placeholder methods for collectNamespaces, warn, and fromExpression
    protected Set<String> collectNamespaces() {
        return new HashSet<>();
    }

    protected void warn(String message) {
        // Implementation for warning
    }

    protected boolean fromExpression() {
        return false;
    }

}
