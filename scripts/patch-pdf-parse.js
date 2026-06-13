const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../node_modules/pdf-parse/index.js");

if (fs.existsSync(filePath)) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    if (content.includes("let isDebugMode = !module.parent;")) {
      content = content.replace(
        "let isDebugMode = !module.parent;",
        "let isDebugMode = false;"
      );
      fs.writeFileSync(filePath, content, "utf8");
      console.log("Successfully patched node_modules/pdf-parse/index.js to disable test debug mode.");
    }
  } catch (error) {
    console.error("Failed to patch pdf-parse:", error);
  }
} else {
  console.warn("pdf-parse is not installed, skipping patch.");
}
