import { formatIssues } from "../src/content/schema/contentSchema.ts";
import { validateAllContent } from "../src/content/validateContent.ts";

export function validateContentFiles() {
  return validateAllContent();
}

if (process.argv[1]?.endsWith("validate-content.ts")) {
  const issues = validateContentFiles();
  if (issues.length > 0) {
    console.error(formatIssues(issues));
    process.exit(1);
  }
  console.log("Content JSON graph is valid.");
}
