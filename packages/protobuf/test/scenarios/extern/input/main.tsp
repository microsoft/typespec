import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  foo(...MyExtern): WellKnown.Empty;

  bar(@field(1) empty: WellKnown.Empty): {
    @field(1) myExtern: MyExtern;
  };
}

model MyExtern is Extern<"foo/bar.proto", "foo.Bar">;
