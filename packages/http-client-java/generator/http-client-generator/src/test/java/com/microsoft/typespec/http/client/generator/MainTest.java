package com.microsoft.typespec.http.client.generator;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class MainTest {

  @Test
  public void testHello() {
    Main main = new Main();
    assertEquals("Hello friends from TypeSpec Java code generator", main.sayHello("TypeSpec Java code generator"));
  }
}
