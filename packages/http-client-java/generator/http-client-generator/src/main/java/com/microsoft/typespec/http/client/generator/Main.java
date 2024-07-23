package com.microsoft.typespec.http.client.generator;

/**
 * The main class for TypeSpec Java code generator.
 */
public class Main {
  /**
   * The main method for TypeSpec Java code generator.
   * @param args The arguments for TypeSpec Java code generator.
   */
  public static void main(String[] args) {
    Main main = new Main();
    System.out.println(main.sayHello("TypeSpec Java code generator"));
  }

  /**
   * The method to say hello.
   * @param name The name to say hello.
   * @return The hello message.
   */
  public String sayHello(String name) {
    return "Hello " + name;
  }
}
