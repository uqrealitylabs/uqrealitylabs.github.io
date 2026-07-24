import { formatIssues } from "../../src/content/schema/contentSchema.ts";
import { validateAllContent } from "../../src/content/validateContent.ts";

const issues = validateAllContent();
if (issues.length > 0) {
  console.error(formatIssues(issues));
  process.exitCode = 1;
} else {
  console.log("Content validation passed.");
}
