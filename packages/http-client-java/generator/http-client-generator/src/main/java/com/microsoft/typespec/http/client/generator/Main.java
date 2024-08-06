package com.microsoft.typespec.http.client.generator;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileAttribute;

/**
 * The main class for TypeSpec Java code generator.
 */
public class Main {
  /**
   * The main method for TypeSpec Java code generator.
   * @param args The arguments for TypeSpec Java code generator.
   */
  public static void main(String[] args) throws IOException {
    Main main = new Main();
    System.out.println(main.sayHello("TypeSpec Java code generator"));
    Path file = Files.createFile(Paths.get("test.txt"));
    Files.write(file, "Test file".getBytes(StandardCharsets.UTF_8));
    System.out.println("Created file at " + file.toAbsolutePath());
    boolean deleteIfExists = Files.deleteIfExists(file);
    System.out.println("Deleted file at " + file.toAbsolutePath() + " " + deleteIfExists);

  }

  /**
   * The method to say hello.
   * @param name The name to say hello.
   * @return The hello message.
   */
  public String sayHello(String name) {
    return "Hello friends from " + name;
  }
}
