# Common Issues and Troubleshooting

As you work with TypeSpec, you may encounter various issues or errors. This section addresses some common problems and provides solutions to help you troubleshoot effectively.

## FAQ Section Addressing Common Errors and Solutions

### Error: `Cannot find package 'x' imported from 'y'`

**Description**: This issue typically arises when package 'y' has a `peerDependency` on package 'x', and package 'x' isn't installed. This can occur if you're using a package manager that doesn't auto-install implicit peer dependencies, such as:

- `npm` (before version 7)
- `yarn`

**Solution**:
| Package Manager | Action |
| --------------- | ----------------------------------------------------------------- |
| `npm` | Upgrade npm with `npm install -g npm` |
| `yarn` | Add `x` as an intermediate dependency to your `package.json` dependencies |

### Error: `Type '123' is not assignable to type 'TypeSpec.string'`

**Description**: This error occurs when you attempt to assign a value that does not meet the type constraints defined in your TypeSpec code.

**Solution**: Ensure that the value you are assigning matches the expected type. For example, if a property is defined as a `string`, make sure you are not trying to assign a number or other incompatible type.

### Best Practices for Troubleshooting

- **Check Your Imports**: Ensure that all necessary files and libraries are correctly imported in your TypeSpec definitions.
- **Review Your Model Definitions**: Make sure that your models are defined correctly, with appropriate types and properties.
- **Use the TypeSpec Playground**: The TypeSpec Playground allows you to experiment with your definitions and see how they behave in real-time. This can help you identify issues quickly.
- **Consult the Documentation**: Always refer to the official TypeSpec documentation for guidance on specific features and best practices.

## Summary

By understanding common issues and their solutions, you can troubleshoot effectively while working with TypeSpec. Remember to follow best practices and consult the documentation whenever you encounter problems.

As you continue to develop with TypeSpec, keep this troubleshooting guide handy to help you navigate any challenges that arise.
