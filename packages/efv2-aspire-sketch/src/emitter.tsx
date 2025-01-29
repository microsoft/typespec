import * as ay from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";

import { EmitContext } from "@typespec/compiler";

export async function $onEmit(context: EmitContext) {
  const csNamePolicy = cs.useCSharpNamePolicy();

  // Emit all enums and models
  return (
    <ay.Output namePolicy={csNamePolicy}>
      <cs.ProjectDirectory description="" name="efv2-aspire-sketch" path="." version="0.0.1">
        <cs.Namespace name="Models">
          <ay.SourceDirectory path="src">
            <cs.SourceFile path="MyClass.cs">
              <cs.Class name="MyClass" accessModifier="public">
                <cs.ClassMethod
                  name="sayHello"
                  accessModifier="public"
                  parameters={[{ name: "name", type: "string" }]}
                >
                  System.Console.WriteLine("Hello, World!");
                </cs.ClassMethod>
              </cs.Class>
            </cs.SourceFile>
          </ay.SourceDirectory>
        </cs.Namespace>
      </cs.ProjectDirectory>
    </ay.Output>
  );
}
