// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents all languages.
 */
public class Languages {
    private Language _default;
    private CSharpLanguage csharp;
    private Language python;
    private Language ruby;
    private Language go;
    private Language typescript;
    private Language javascript;
    private Language powershell;
    private Language java;
    private Language c;
    private Language cpp;
    private Language swift;
    private Language objectivec;

    /**
     * Creates a new instance of the Languages class.
     */
    public Languages() {
    }

    /**
     * Gets the default language. (Required)
     *
     * @return The default language.
     */
    public Language getDefault() {
        return _default;
    }

    /**
     * Sets the default language. (Required)
     *
     * @param _default The default language.
     */
    public void setDefault(Language _default) {
        this._default = _default;
    }

    /**
     * Gets the C# language.
     *
     * @return The C# language.
     */
    public CSharpLanguage getCsharp() {
        return csharp;
    }

    /**
     * Sets the C# language.
     *
     * @param csharp The C# language.
     */
    public void setCsharp(CSharpLanguage csharp) {
        this.csharp = csharp;
    }

    /**
     * Gets the Python language.
     *
     * @return The Python language.
     */
    public Language getPython() {
        return python;
    }

    /**
     * Sets the Python language.
     *
     * @param python The Python language.
     */
    public void setPython(Language python) {
        this.python = python;
    }

    /**
     * Gets the Ruby language.
     *
     * @return The Ruby language.
     */
    public Language getRuby() {
        return ruby;
    }

    /**
     * Sets the Ruby language.
     *
     * @param ruby The Ruby language.
     */
    public void setRuby(Language ruby) {
        this.ruby = ruby;
    }

    /**
     * Gets the Go language.
     *
     * @return The Go language.
     */
    public Language getGo() {
        return go;
    }

    /**
     * Sets the Go language.
     *
     * @param go The Go language.
     */
    public void setGo(Language go) {
        this.go = go;
    }

    /**
     * Gets the TypeScript language.
     *
     * @return The TypeScript language.
     */
    public Language getTypescript() {
        return typescript;
    }

    /**
     * Sets the TypeScript language.
     *
     * @param typescript The TypeScript language.
     */
    public void setTypescript(Language typescript) {
        this.typescript = typescript;
    }

    /**
     * Gets the JavaScript language.
     *
     * @return The JavaScript language.
     */
    public Language getJavascript() {
        return javascript;
    }

    /**
     * Sets the JavaScript language.
     *
     * @param javascript The JavaScript language.
     */
    public void setJavascript(Language javascript) {
        this.javascript = javascript;
    }

    /**
     * Gets the PowerShell language.
     *
     * @return The PowerShell language.
     */
    public Language getPowershell() {
        return powershell;
    }

    /**
     * Sets the PowerShell language.
     *
     * @param powershell The PowerShell language.
     */
    public void setPowershell(Language powershell) {
        this.powershell = powershell;
    }

    /**
     * Gets the Java language.
     *
     * @return The Java language.
     */
    public Language getJava() {
        return java;
    }

    /**
     * Sets the Java language.
     *
     * @param java The Java language.
     */
    public void setJava(Language java) {
        this.java = java;
    }

    /**
     * Gets the C language.
     *
     * @return The C language.
     */
    public Language getC() {
        return c;
    }

    /**
     * Sets the C language.
     *
     * @param c The C language.
     */
    public void setC(Language c) {
        this.c = c;
    }

    /**
     * Gets the C++ language.
     *
     * @return The C++ language.
     */
    public Language getCpp() {
        return cpp;
    }

    /**
     * Sets the C++ language.
     *
     * @param cpp The C++ language.
     */
    public void setCpp(Language cpp) {
        this.cpp = cpp;
    }

    /**
     * Gets the Swift language.
     *
     * @return The Swift language.
     */
    public Language getSwift() {
        return swift;
    }

    /**
     * Sets the Swift language.
     *
     * @param swift The Swift language.
     */
    public void setSwift(Language swift) {
        this.swift = swift;
    }

    /**
     * Gets the Objective-C language.
     *
     * @return The Objective-C language.
     */
    public Language getObjectivec() {
        return objectivec;
    }

    /**
     * Sets the Objective-C language.
     *
     * @param objectivec The Objective-C language.
     */
    public void setObjectivec(Language objectivec) {
        this.objectivec = objectivec;
    }

    @Override
    public int hashCode() {
        return Objects.hash(_default, python, cpp, c, go, objectivec, javascript, ruby, csharp, java, powershell,
            typescript, swift);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof Languages)) {
            return false;
        }

        Languages rhs = ((Languages) other);
        return Objects.equals(_default, rhs._default)
            && Objects.equals(python, rhs.python)
            && Objects.equals(cpp, rhs.cpp)
            && Objects.equals(c, rhs.c)
            && Objects.equals(go, rhs.go)
            && Objects.equals(objectivec, rhs.objectivec)
            && Objects.equals(javascript, rhs.javascript)
            && Objects.equals(ruby, rhs.ruby)
            && Objects.equals(csharp, rhs.csharp)
            && Objects.equals(java, rhs.java)
            && Objects.equals(powershell, rhs.powershell)
            && Objects.equals(typescript, rhs.typescript)
            && Objects.equals(swift, rhs.swift);
    }

    @Override
    public String toString() {
        return "Languages{default=" + _default + ", java=" + java + '}';
    }
}
