import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const commitMsgFile = process.argv[2];
if (!commitMsgFile) process.exit(0);

try {
  const branchName = execSync("git branch --show-current", { encoding: "utf8" }).trim();
  const issueMatch = branchName.match(/([A-Za-z]+-\d+)/i);

  if (issueMatch) {
    const issueKey = issueMatch[1]?.toUpperCase();
    let content = readFileSync(commitMsgFile, "utf8");

    if (issueKey != null && !content.includes(issueKey)) {
      if (/^[a-z]+:/i.test(content)) {
        content = content.replace(/^([a-z]+):/i, `$1(${issueKey}):`);
      } else {
        content = `[${issueKey}] ${content}`;
      }
      writeFileSync(commitMsgFile, content, "utf8");
    }
  }
} catch {
  process.exit(0);
}
