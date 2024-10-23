alias myConst = "foobar";

model Person {
  simple: "Simple ${123} end";
  multiline: """
    Multi 
       ${123} 
      ${true}
    line
    """;
  ref: "Ref this alias ${myConst} end";
  template: Template<"custom">;
}

alias Template<T extends string> = "Foo ${T} bar";

/** Example of string template with template parameters */
@doc("Animal named: ${T}")
model Animal<T extends valueof string> {
  named: string;
}

model Cat is Animal<"Cat">;
