# How to Profile Your Emitter Code

This guide explains how to measure execution time of different code blocks in the emitter.

## Quick Start

### 1. Import the Profiler

Add this import at the top of the file you want to profile:

```typescript
import { Profiler } from "./profiler.js";
```

### 2. Wrap Functions to Measure

**For synchronous functions:**
```typescript
// Instead of:
const yamlMap = emitCodeModel(sdkContext);

// Use:
const yamlMap = Profiler.measure('emitCodeModel', () => emitCodeModel(sdkContext));
```

**For async functions:**
```typescript
// Instead of:
const sdkContext = await createPythonSdkContext(context);

// Use:
const sdkContext = await Profiler.measureAsync('createPythonSdkContext', () => createPythonSdkContext(context));
```

**For code blocks (manual start/stop):**
```typescript
const stopTimer = Profiler.start('walkThroughNodes');
// ... your code here ...
walkThroughNodes(yamlMap);
// ... more code ...
stopTimer(); // Records the time
```

### 3. Print Summary

At the end of your main function, call:
```typescript
Profiler.printSummary();
```

## Example: Instrumenting emitter.ts

Here's how you would instrument the main `onEmitMain` function:

```typescript
import { Profiler } from "./profiler.js";

async function onEmitMain(context: EmitContext<PythonEmitterOptions>) {
  // clean all cache to make sure emitter could work in watch mode
  Profiler.measure('cleanAllCache', () => cleanAllCache());

  const program = context.program;
  
  const sdkContext = await Profiler.measureAsync('createPythonSdkContext', 
    () => createPythonSdkContext(context));
  
  const root = path.join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const outputDir = context.emitterOutputDir;
  
  Profiler.measure('addDefaultOptions', () => addDefaultOptions(sdkContext));
  
  const yamlMap = Profiler.measure('emitCodeModel', () => emitCodeModel(sdkContext));
  
  const parsedYamlMap = Profiler.measure('walkThroughNodes', () => walkThroughNodes(yamlMap));

  const yamlPath = await Profiler.measureAsync('saveCodeModelAsYaml', 
    () => saveCodeModelAsYaml("python-yaml-path", parsedYamlMap));

  // ... rest of the function ...

  // At the end, print the summary
  Profiler.printSummary();
}
```

## Output Example

When you run the emitter, you'll see output like:

```
[Profiler] cleanAllCache: 0.05ms
[Profiler] createPythonSdkContext: 150.32ms
[Profiler] addDefaultOptions: 2.15ms
[Profiler] emitCodeModel: 523.47ms
[Profiler] walkThroughNodes: 45.21ms
[Profiler] saveCodeModelAsYaml: 89.63ms

================================================================================
PROFILER SUMMARY
================================================================================
Label                                       Total(ms)    Calls      Avg(ms)     Min(ms)     Max(ms)        %
--------------------------------------------------------------------------------
emitCodeModel                                  523.47        1       523.47      523.47      523.47    64.5%
createPythonSdkContext                         150.32        1       150.32      150.32      150.32    18.5%
saveCodeModelAsYaml                             89.63        1        89.63       89.63       89.63    11.0%
walkThroughNodes                                45.21        1        45.21       45.21       45.21     5.6%
addDefaultOptions                                2.15        1         2.15        2.15        2.15     0.3%
cleanAllCache                                    0.05        1         0.05        0.05        0.05     0.0%
--------------------------------------------------------------------------------
TOTAL                                          810.83
================================================================================
```

## Alternative: Using Node.js Built-in Profiler

For more detailed profiling, you can use Node.js's built-in profiler:

```bash
# Generate a profile
node --prof dist/emitter.js

# Process the profile (creates a readable file)
node --prof-process isolate-*.log > profile.txt
```

## Alternative: Using VS Code Debugger

1. Add breakpoints in VS Code
2. Use the "Performance" tab in VS Code's debugger
3. Or use Chrome DevTools by running:
   ```bash
   node --inspect-brk dist/emitter.js
   ```
   Then open `chrome://inspect` in Chrome

## Tips

1. **Profile in Release Mode**: Make sure you build with `npm run build` before profiling
2. **Multiple Runs**: Run the profiler multiple times to get consistent results
3. **Disable When Done**: Call `Profiler.disable()` or remove profiling code for production
4. **Nested Profiling**: You can nest profiler calls to measure sub-functions
