---
description: Automate GitHub Project Issue Tracking 
---

# GitHub Project Tracking Workflow
This workflow is used to quickly and autonomously create, list, and update issues on the `Race Committee Tracker` GitHub project board. By tagging this file with `// turbo-all`, these operations will be permitted to run automatically without prompting the user.

// turbo-all
1. Use `gh.exe project item-create 1 --owner JamesBPowell` to create a new draft tracked task.
2. Use `gh.exe project item-list 1 --owner JamesBPowell --format json` to get a list of active IDs.
3. Use the raw `gh.exe api graphql` pipeline to update project item properties such as status values.
