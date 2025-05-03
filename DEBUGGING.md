# Viewing stderr Output with MCP Inspector

## Background
The MCP server uses stdout for communication with the MCP Inspector, following the Model Context Protocol. To avoid interfering with this communication, all debugging and logging messages have been redirected to stderr using `console.error()` instead of `console.log()`.

## How to View stderr Output
When running the MCP server with the MCP Inspector, you can view the stderr output using one of the following methods:

### Method 1: Redirect stderr to a File
When launching the MCP Inspector with your server, redirect stderr to a file:

```bash
npx @modelcontextprotocol/inspector -- node dist/server.js 2> debug.log
```

This will capture all stderr output (including your debug messages) in the `debug.log` file, which you can view in another terminal window:

```bash
tail -f debug.log
```

### Method 2: Display stderr in Terminal
If you want to see the stderr output directly in the terminal while using the MCP Inspector, you can use a terminal multiplexer like `tmux` or use process substitution:

```bash
# Using process substitution
npx @modelcontextprotocol/inspector -- node dist/server.js 2> >(tee debug.log >&2)
```

### Method 3: Use a Custom Wrapper Script
Create a wrapper script that captures and displays stderr while passing stdout to the MCP Inspector:

```bash
#!/bin/bash
# save as run-with-debug.sh and make executable with: chmod +x run-with-debug.sh

# Run the server and redirect stderr to both a file and the terminal
node dist/server.js 2> >(tee debug.log >&2)
```

Then run the MCP Inspector with this script:

```bash
npx @modelcontextprotocol/inspector -- ./run-with-debug.sh
```

## Conclusion
By using one of these methods, you can see the debug messages sent to stderr (via `console.error()`) while still allowing the MCP Inspector to communicate with the server through stdout.