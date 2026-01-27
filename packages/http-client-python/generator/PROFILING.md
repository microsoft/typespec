# How to Profile Your Generator Code

This guide explains how to measure execution time of different code blocks in the Python generator.

## Quick Start

### 1. Import the Profiler

Add this import at the top of the file you want to profile:

```python
from pygen.timing_utils import Profiler
```

### 2. Wrap Functions to Measure

**For synchronous functions:**
```python
# Instead of:
yaml_data = self.get_yaml()

# Use:
yaml_data = Profiler.measure('get_yaml', lambda: self.get_yaml())
```

**For code blocks (manual start/stop):**
```python
stop_timer = Profiler.start('update_types')
# ... your code here ...
self.update_types(yaml_data["types"])
# ... more code ...
stop_timer()  # Records the time
```

### 3. Print Summary

At the end of your main function, call:
```python
Profiler.print_summary()
```

## Example: Instrumenting run_tsp.py

Here's how the main script is instrumented:

```python
from pygen.timing_utils import Profiler

if __name__ == "__main__":
    # ... setup code ...
    
    args, unknown_args = parse_args()
    
    # Process with profiling
    Profiler.measure(
        'PreProcessPlugin.process',
        lambda: preprocess.PreProcessPlugin(
            output_folder=args.output_folder, 
            tsp_file=args.tsp_file, 
            **unknown_args
        ).process()
    )
    
    Profiler.measure(
        'CodeGenerator.process',
        lambda: codegen.CodeGenerator(
            output_folder=args.output_folder, 
            tsp_file=args.tsp_file, 
            **unknown_args
        ).process()
    )
    
    # Print profiling summary
    Profiler.print_summary()
```

## Example: Instrumenting CodeGenerator

Here's how to instrument the `CodeGenerator.process()` method:

```python
from ..timing_utils import Profiler

class CodeGenerator(Plugin):
    
    def process(self) -> bool:
        yaml_data = Profiler.measure(
            'CodeGenerator.get_yaml', 
            lambda: self.get_yaml()
        )

        Profiler.measure(
            'CodeGenerator.sort_exceptions', 
            lambda: self.sort_exceptions(yaml_data)
        )

        if self.options["azure-arm"]:
            Profiler.measure(
                'CodeGenerator.remove_cloud_errors', 
                lambda: self.remove_cloud_errors(yaml_data)
            )

        code_model = Profiler.measure(
            'CodeGenerator.CodeModel_init',
            lambda: CodeModel(yaml_data=yaml_data, options=self.options)
        )
        
        serializer = Profiler.measure(
            'CodeGenerator.get_serializer',
            lambda: self.get_serializer(code_model)
        )
        
        Profiler.measure(
            'CodeGenerator.serializer.serialize', 
            lambda: serializer.serialize()
        )
        
        return True
```

## Output Example

When you run the generator, you'll see output like:

```
[Profiler] PreProcessPlugin.process: 450.32ms
[Profiler] PreProcessPlugin.update_types: 12.15ms
[Profiler] PreProcessPlugin.update_client[0]: 180.47ms
[Profiler] PreProcessPlugin.update_operation_groups[0]: 235.21ms
[Profiler] PreProcessPlugin.pad_builtin_namespaces: 1.05ms
[Profiler] CodeGenerator.process: 1523.67ms
[Profiler] CodeGenerator.get_yaml: 23.14ms
[Profiler] CodeGenerator.sort_exceptions: 5.32ms
[Profiler] CodeGenerator.CodeModel_init: 567.89ms
[Profiler] CodeGenerator.get_serializer: 8.45ms
[Profiler] CodeGenerator.serializer.serialize: 918.87ms

====================================================================================================
PROFILER SUMMARY
====================================================================================================
Label                                         Total(ms)    Calls      Avg(ms)   Min(ms)   Max(ms)        %
----------------------------------------------------------------------------------------------------
CodeGenerator.serializer.serialize              918.87        1       918.87    918.87    918.87    46.9%
CodeGenerator.CodeModel_init                    567.89        1       567.89    567.89    567.89    29.0%
PreProcessPlugin.update_operation_groups[0]     235.21        1       235.21    235.21    235.21    12.0%
PreProcessPlugin.update_client[0]               180.47        1       180.47    180.47    180.47     9.2%
CodeGenerator.get_yaml                           23.14        1        23.14     23.14     23.14     1.2%
PreProcessPlugin.update_types                    12.15        1        12.15     12.15     12.15     0.6%
CodeGenerator.get_serializer                      8.45        1         8.45      8.45      8.45     0.4%
CodeGenerator.sort_exceptions                     5.32        1         5.32      5.32      5.32     0.3%
PreProcessPlugin.pad_builtin_namespaces           1.05        1         1.05      1.05      1.05     0.1%
----------------------------------------------------------------------------------------------------
TOTAL                                          1952.55
====================================================================================================
```

## Advanced Usage

### Using Manual Start/Stop

For more control over what you're measuring, use the manual start/stop approach:

```python
def update_operation_groups(self, code_model, client):
    for i, operation_group in enumerate(client.get("operationGroups", [])):
        stop_timer = Profiler.start(f'update_operation_group_{i}')
        
        # Update operation group name
        operation_group["identifyName"] = self.pad_reserved_words(
            operation_group.get("name", operation_group["propertyName"]),
            PadType.OPERATION_GROUP,
            operation_group,
        )
        
        # Process operations
        for operation in operation_group["operations"]:
            self.get_operation_updater(operation)(code_model, operation)
        
        stop_timer()
```

### Programmatic Access to Timings

You can also access timing data programmatically:

```python
# Get timings as a dictionary
timings = Profiler.get_timings()

# Access specific measurements
if 'CodeGenerator.serialize' in timings:
    serialize_time = timings['CodeGenerator.serialize']['total_ms']
    print(f"Serialization took {serialize_time:.2f}ms")
```

### Controlling the Profiler

```python
# Disable profiling (no overhead)
Profiler.disable()

# Re-enable profiling
Profiler.enable()

# Clear all recorded timings
Profiler.reset()
```

## Alternative: Using Python's Built-in Profiler

For more detailed profiling, you can use Python's built-in cProfile:

```bash
# Generate a profile
python -m cProfile -o output.prof eng/scripts/setup/run_tsp.py --output-folder=... --tsp-file=...

# View the profile with snakeviz (install with: pip install snakeviz)
snakeviz output.prof
```

Or use line_profiler for line-by-line profiling:

```bash
# Install line_profiler
pip install line_profiler

# Add @profile decorator to functions you want to profile
# Run with kernprof
kernprof -l -v eng/scripts/setup/run_tsp.py
```

## Tips

1. **Profile in Production Mode**: Make sure you build the emitter with `npm run build` before profiling the full pipeline
2. **Multiple Runs**: Run the profiler multiple times to get consistent results
3. **Disable When Done**: Call `Profiler.disable()` or remove profiling code for production
4. **Nested Profiling**: You can nest profiler calls to measure sub-functions - the summary will show all measurements
5. **Use Descriptive Labels**: Use clear, hierarchical labels like `ClassName.method_name` for easy identification in the summary

## Integration with VS Code

You can also use VS Code's Python profiling features:

1. Install the Python extension
2. Open the Command Palette (Ctrl+Shift+P)
3. Run "Python: Launch Profile"
4. Select your script
5. View results in the "Performance" tab
