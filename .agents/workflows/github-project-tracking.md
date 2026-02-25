---
description: Automate GitHub Project Issue Tracking 
---

# GitHub Project Tracking Workflow
This workflow is used to quickly and autonomously create, list, and update issues on the `Race Committee Tracker` GitHub project board. By tagging this file with `// turbo-all`, these operations will be permitted to run automatically without prompting the user.

// turbo-all
1. Use `gh.exe project item-create 1 --owner JamesBPowell` to create a new draft tracked task.
2. Use `gh.exe project item-list 1 --owner JamesBPowell --format json` to get a list of active IDs.
3. Use `gh.exe project field-list 1 --owner JamesBPowell --format json` to get the necessary Field IDs and Option IDs.
4. Use `gh.exe project item-edit --project-id <project-id> --id <item-id> --field-id <field-id> --single-select-option-id <option-id>` to update properties such as status values.
(Note: Draft Issue assignee updates still require graphql as `item-edit` does not support assignees array natively).
