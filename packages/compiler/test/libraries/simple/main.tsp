import "MyLib";
import "CustomTypeSpecMain";

@myLibDec
model A {
  x: MyLib.Model;
}
model B {
  x: CustomTypeSpecMain.Model;
}
