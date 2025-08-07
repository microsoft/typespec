// TypeSpec standard library. Everything in here can be omitted by using `--nostdlib` cli flag or `nostdlib` in the config.
import "./types.tsp";
import "./decorators.tsp";
import "./reflection.tsp";
import "./visibility.tsp";

namespace TypeSpec {
  extern fn example(T: Reflection.Type);

  alias Example<T> = example(T);
}
