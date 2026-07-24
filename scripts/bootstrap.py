#!/usr/bin/env python3

'''
Suppository Bootstrap Script

Personalizes a new project created from the Suppository GitHub template.

Usage:
    python scripts/bootstrap.py
'''
from pathlib import Path
import os
import shutil
import subprocess
import sys


ROOT = Path(__file__).parent.parent

SKIP_DIRS = {
    ".git",
    "node_modules",
    ".next",
}


PLACEHOLDERS = {
    "{{PROJECT_NAME}}": None,
    "{{PACKAGE_NAME}}": None,
    "{{DESCRIPTION}}": None,
    "{{AUTHOR}}": None,
    "{{GITHUB_USERNAME}}": None,
}


def run(command: list[str], optional=False):
    '''Run a shell command.'''
    print(f"\n> {' '.join(command)}")

    try:
        subprocess.run(
            command,
            cwd=ROOT,
            check=True,
        )
    except subprocess.CalledProcessError:
        if optional:
            print("Skipped")
        else:
            raise


def ask(prompt, default=None):
    '''Prompt user.'''
    if default:
        value = input(
            f"{prompt} [{default}]: "
        ).strip()

        return value or default

    return input(
        f"{prompt}: "
    ).strip()


def collect_information():
    print('''
=================================
🚀 Suppository Project Bootstrap
=================================
''')

    project = ask(
        "Project name"
    )

    package = ask(
        "Package name",
        project.lower()
        .replace(" ", "-")
    )

    PLACEHOLDERS["{{PROJECT_NAME}}"] = project
    PLACEHOLDERS["{{PACKAGE_NAME}}"] = package

    PLACEHOLDERS["{{DESCRIPTION}}"] = ask(
        "Description"
    )

    PLACEHOLDERS["{{AUTHOR}}"] = ask(
        "Author"
    )

    PLACEHOLDERS["{{GITHUB_USERNAME}}"] = ask(
        "GitHub username"
    )


def iter_files():
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue

        if any(
            part in SKIP_DIRS
            for part in path.parts
        ):
            continue
        yield path


def replace_placeholders():
    print("\nReplacing placeholders...\n")

    for file in iter_files():
        try:
            contents = file.read_text(
                encoding="utf-8"
            )
        except UnicodeDecodeError:
            continue

        original = contents

        for key, value in PLACEHOLDERS.items():
            if value:
                contents = contents.replace(
                    key,
                    value
                )
        if contents != original:
            file.write_text(
                contents,
                encoding="utf-8"
            )

            print(f"✓ {file}")


def create_env():
    example = ROOT / ".env.example"
    env = ROOT / ".env"

    if env.exists():
        print("✓ .env already exists")
        return

    if example.exists():
        shutil.copy(
            example,
            env
        )

        print("✓ Created .env")


def rename_package():
    old = ROOT / "src" / "package"

    package = PLACEHOLDERS[
        "{{PACKAGE_NAME}}"
    ]

    if old.exists():
        old.rename(
            old.parent / package
        )

        print(
            f"✓ Renamed package to {package}"
        )


def initialize_git():
    if (ROOT / ".git").exists():
        return

    answer = ask(
        "Initialize git repository? (y/n)",
        "y"
    )

    if answer.lower() == "y":
        run(
            ["git", "init"]
        )

        run(
            [
                "git",
                "add",
                "."
            ]
        )

        run(
            [
                "git",
                "commit",
                "-m",
                "Initial commit"
            ],
            optional=True
        )


def install_dependencies():
    answer = ask(
        "Install dependencies? (y/n)",
        "y"
    )

    if answer.lower() == "y":
        run(
            [
                "pnpm",
                "install"
            ]
        )


def setup_database():
    answer = ask(
        "Initialize database? (y/n)",
        "y"
    )

    if answer.lower() == "y":
        run(
            [
                "pnpm",
                "prisma",
                "generate"
            ]
        )

        run(
            [
                "pnpm",
                "prisma",
                "migrate",
                "dev",
                "--name",
                "init"
            ]
        )


def main():
    collect_information()
    replace_placeholders()
    create_env()
    rename_package()
    initialize_git()
    install_dependencies()
    setup_database()

    print('''
=================================

🎉 Bootstrap complete!

Next steps:

    pnpm dev

Your application is ready.

=================================
''')


if __name__ == "__main__":
    main()
