#!/usr/bin/env tsx
/**
 * Suppository Bootstrap Script
 *
 * Personalizes a new project created from the Suppository template.
 *
 * Run:
 *   pnpm bootstrap
 */
import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { execSync } from "node:child_process";


const ROOT = path.resolve(
  import.meta.dirname,
  ".."
);

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
]);

const placeholders: Record<string, string> = {
  "{{PROJECT_NAME}}": "",
  "{{PACKAGE_NAME}}": "",
  "{{DESCRIPTION}}": "",
  "{{AUTHOR}}": "",
  "{{GITHUB_USERNAME}}": "",
};

const rl = readline.createInterface({
  input,
  output,
});


function log(message: string) {
  console.log(message);
}


async function ask(
  question: string,
  defaultValue?: string
) {
  const suffix = defaultValue
    ? ` [${defaultValue}]`
    : "";

  const answer = await rl.question(
    `${question}${suffix}: `
  );
  return answer.trim() || defaultValue || "";
}


function run(
  command: string,
  optional = false
) {
  log(`\n> ${command}`);

  try {
    execSync(command, {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch (error) {
    if (!optional) {
      throw error;
    }

    log("Skipped");
  }
}


async function collectInfo() {
  console.log(`
=================================
🚀 Suppository Bootstrap
=================================
`);
  placeholders["{{PROJECT_NAME}}"] =
    await ask("Project name");

  placeholders["{{PACKAGE_NAME}}"] =
    await ask(
      "Package name",
      placeholders["{{PROJECT_NAME}}"]
        .toLowerCase()
        .replaceAll(" ", "-")
    );

  placeholders["{{DESCRIPTION}}"] =
    await ask("Description");

  placeholders["{{AUTHOR}}"] =
    await ask("Author");

  placeholders["{{GITHUB_USERNAME}}"] =
    await ask("GitHub username");
}


async function getFiles(
  directory: string
): Promise<string[]> {
  const files: string[] = [];

  const entries = await fs.readdir(
    directory,
    {
      withFileTypes: true,
    }
  );

  for (const entry of entries) {
    const fullPath = path.join(
      directory,
      entry.name
    );

    if (
      entry.isDirectory()
    ) {
      if (
        SKIP_DIRS.has(entry.name)
      ) {
        continue;
      }

      files.push(
        ...(await getFiles(fullPath))
      );
    } else {
      files.push(fullPath);
    }
  }
  return files;
}


async function replacePlaceholders() {
  log("\nReplacing placeholders...\n");
  const files = await getFiles(ROOT);

  for (const file of files) {
    try {
      let content =
        await fs.readFile(
          file,
          "utf8"
        );

      const original = content;

      for (
        const [key,value]
        of Object.entries(placeholders)
      ) {
        if (value) {
          content =
            content.replaceAll(
              key,
              value
            );
        }
      }

      if (content !== original) {
        await fs.writeFile(
          file,
          content,
          "utf8"
        );

        log(
          `✓ ${path.relative(ROOT,file)}`
        );
      }
    } catch {
      // Ignore binary files
    }
  }
}


async function createEnv() {
  const envExample =
    path.join(ROOT, ".env.example");

  const env =
    path.join(ROOT, ".env");

  if (
    existsSync(env)
  ) {
    log("✓ .env already exists");
    return;
  }

  if (
    existsSync(envExample)
  ) {
    await fs.copyFile(
      envExample,
      env
    );

    log("✓ Created .env");
  }
}


function initializeGit() {
  if (
    existsSync(
      path.join(ROOT, ".git")
    )
  ) {
    return;
  }

  run(
    "git init"
  );

  run(
    "git add ."
  );

  run(
    'git commit -m "Initial commit"',
    true
  );
}


function renamePackage() {
  const oldPath =
    path.join(
      ROOT,
      "src",
      "package"
    );

  if (
    !existsSync(oldPath)
  ) {
    return;
  }

  const newPath =
    path.join(
      ROOT,
      "src",
      placeholders["{{PACKAGE_NAME}}"]
    );

  execSync(
    `mv "${oldPath}" "${newPath}"`
  );

  log(
    `✓ Renamed package folder`
  );
}


async function installDependencies() {
  const answer =
    await ask(
      "Install dependencies? (y/n)",
      "y"
    );

  if (
    answer.toLowerCase() === "y"
  ) {
    run(
      "pnpm install"
    );
  }
}


async function setupDatabase() {
  const answer =
    await ask(
      "Initialize database? (y/n)",
      "y"
    );

  if (
    answer.toLowerCase() === "y"
  ) {
    run(
      "pnpm prisma generate"
    );

    run(
      "pnpm prisma migrate dev --name init"
    );
  }
}


async function main() {
  await collectInfo();
  await replacePlaceholders();
  await createEnv();
  renamePackage();
  initializeGit();
  await installDependencies();
  await setupDatabase();

  console.log(`
=================================

🎉 Bootstrap complete!

Start development:

    pnpm dev

=================================
`);

  rl.close();
}


main()
  .catch((error) => {
    console.error(error);
    rl.close();
    process.exit(1);
  });
