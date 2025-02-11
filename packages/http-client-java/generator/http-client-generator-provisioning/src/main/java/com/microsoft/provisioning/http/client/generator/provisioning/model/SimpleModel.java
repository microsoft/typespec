package com.microsoft.provisioning.http.client.generator.provisioning.model;

import com.microsoft.provisioning.http.client.generator.provisioning.utils.IndentWriter;
import com.microsoft.provisioning.http.client.generator.provisioning.utils.NameUtils;
import com.microsoft.provisioning.http.client.generator.provisioning.utils.ReflectionUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class SimpleModel extends TypeModel {
    public SimpleModel(Specification spec, ClientModel armType, String name, String ns, String description) {
        super(spec, armType, name, ns, description);
    }

    @Override
    public String toString() {
        return "<Model " + getProvisioningPackage() + "." + getName() + ">";
    }

    @Override
    public void generate() {
        try {
            System.out.println("Generating model " + getName());
            IndentWriter writer = new IndentWriter();
            writer.writeLine("// Copyright (c) Microsoft Corporation. All rights reserved.");
            writer.writeLine("// Licensed under the MIT License.");
            writer.writeLine();

            writer.writeLine("package " + getProvisioningPackage() + ";");
            writer.writeLine();

            ReflectionUtils.getImportPackages(this.getProperties()).forEach(packageImport -> {
                writer.writeLine("import " + packageImport + ";");
            });

            writer.writeLine("import com.azure.provisioning.BicepValue;");
            writer.writeLine("import com.azure.provisioning.primitives.ProvisioningConstruct;");

            writer.writeLine();
            writer.writeLine("public class " + getName() + " extends "
                + (getBaseType() != null ? getBaseType().getName() : "ProvisioningConstruct") + " {");

            writeProperties(writer);
            writeConstructor(writer);
            writeGetterSetterMethods(getName(), writer);
            writer.writeLine("}");
            saveFile(writer.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
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
        writer.writeLine("public " + className + " set" + NameUtils.toPascalCase(property.getName()) + "("
            + property.getBicepTypeReference() + " " + property.getName() + ") {");
        writer.indent();
        writer.writeLine("this." + property.getName() + ".assign(" + property.getName() + ");");
        writer.writeLine("return this;");
        writer.unindent();
        writer.writeLine("}");

        // set*(String)
        writer.writeLine("public " + className + " set" + NameUtils.toPascalCase(property.getName()) + "("
            + property.getPropertyType().getName() + " " + property.getName() + ") {");
        writer.indent();
        writer.writeLine("return this.set" + NameUtils.toPascalCase(property.getName()) + "("
            + property.getPropertyType().bicepValueExpression(property.getName()) + ");");
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
        writer.writeLine("public " + getName() + "() {");
        writer.indent();
        getProperties().forEach(property -> {
            writer.writeLine(property.getName() + " = " + property.getBicepDefinition(false) + ";");
        });
        writer.unindent();
        writer.writeLine("}");
        writer.unindent();
    }

    private void saveFile(String content) {
        Path path = Paths.get(
            this.getSpec().getBaseDir() + "/src/main/java/" + getProvisioningPackage().replace(".", "/") + "/",
            getName() + ".java");
        try {
            System.out.println("Writing to " + path);
            Files.createDirectories(path.getParent());
            Files.write(path, content.getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
