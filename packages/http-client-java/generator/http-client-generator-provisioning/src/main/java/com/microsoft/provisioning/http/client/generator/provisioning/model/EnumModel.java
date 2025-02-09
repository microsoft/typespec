package com.microsoft.provisioning.http.client.generator.provisioning.model;


import com.microsoft.provisioning.http.client.generator.provisioning.utils.IndentWriter;
import com.microsoft.provisioning.http.client.generator.provisioning.utils.NameUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * Represents an enumeration model in the Azure provisioning model.
 */
public class EnumModel extends ModelBase {
    private final List<String> values;

    /**
     * Constructs a new EnumModel.
     *
     * @param name Name of the enum.
     * @param namespace Namespace of the enum.
     * @param values List of enum values.
     */
    public EnumModel(String name, String namespace, List<String> values) {
        super(name, namespace, null, null);
        this.values = values;
    }

    /**
     * Gets the list of enum values.
     *
     * @return the list of enum values.
     */
    public List<String> getValues() {
        return values;
    }

    @Override
    public String getTypeReference() {
        return getName();
    }


    @Override
    public void generate() {
        try {
            System.out.println("Generating enum " + getName());
            IndentWriter writer = new IndentWriter();
            writer.writeLine("// Copyright (c) Microsoft Corporation. All rights reserved.");
            writer.writeLine("// Licensed under the MIT License.");
            writer.writeLine();
            writer.writeLine("package " + getProvisioningPackage() + ";");
            writer.writeLine();
            writer.writeLine("public enum " + getName() + " {");
            writer.indent();

            for (int i = 0; i < values.size(); i++) {
                writer.writeLine();
                String enumMember = String.format("%s(\"%s\")", NameUtils.getEnumMemberName(values.get(i)), values.get(i));
                if (i == values.size() - 1) {
                    writer.writeLine(enumMember + ";");
                } else {
                    writer.writeLine(enumMember + ",");
                }
            }

            //FIXME non-string value
            writer.writeLine("private final String value;");
            writer.writeLine(String.format("%s(String value) {", getName()));

            writer.indent();
            writer.writeLine("this.value = value;");
            writer.unindent();
            writer.writeLine("}");

            writer.writeLine("@Override");
            writer.writeLine("public String toString() {");
            writer.indent();
            writer.writeLine("return this.value;");
            writer.unindent();
            writer.writeLine("}");

            writer.unindent();
            writer.writeLine("}");
            saveFile(writer.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void saveFile(String content) {
        Path path = Paths.get(this.getSpec().getBaseDir() + "/src/main/java/" + getProvisioningPackage().replace(".", "/") + "/", getName() + ".java");
        try {
            System.out.println("Writing to " + path);
            Files.createDirectories(path.getParent());
            Files.write(path, content.getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
