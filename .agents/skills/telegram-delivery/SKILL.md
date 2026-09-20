---
name: telegram-delivery
description: Send user-requested files, videos, images or messages to the user's configured Telegram chat. Use for requests such as "schick mir das über Telegram", "Telegramm Versand" or "send it on Telegram", across projects. Not for building bots or messaging unrelated recipients.
---

# Telegram delivery

Use this skill whenever the user asks to send the current result through Telegram. Resolve paths below relative to this skill folder. Python 3.10+ is required. The user's configured bot and recipient are stored separately; never assume a new computer is already configured.

## Send requested content

1. Run `python scripts/send.py --check`. This checks credential readability without sending a message. On Windows, run in the signed-in user's context: DPAPI cannot decrypt under a sandbox service account. Request execution permission if needed without revealing secrets.
2. Send with `python scripts/send.py --file "ABSOLUTE_FILE_PATH" --text "Short caption"` or `python scripts/send.py --text "Requested message"`.
3. Confirm `ok: true` and `message_id` before reporting success. Never report success from an upload merely starting.

The current request authorizes its delivery scope. Do not ask again solely because this skill is involved. Installation is not blanket permission for future deliveries. Send only requested content, never credentials, `.env` files or whole project folders as incidental attachments.

MP4 uses sendVideo; PNG/JPEG uses sendPhoto; other files use sendDocument. Maximum file size is 49 MB; photos over 9 MB use sendDocument. Prefer H.264/AAC with faststart. Successful deliveries are deduplicated by content, filename and caption. An uncertain or pending upload is never retried automatically: inspect its receipt or ask the user to check Telegram before deliberately using `--resend`. A definite rejection may be corrected and retried.

## A different computer

This folder contains no secrets and can be copied or checked into a repository under `.agents/skills/telegram-delivery`. For use across all projects on the new computer, run `python scripts/install.py`. It installs into the personal skill directory, preferring an existing installation; `--replace` explicitly updates its known skill files. Restart Codex if discovery has not refreshed. Skill files are not automatically synchronized to inaccessible computers.

Run `send.py --check` first. If no configuration is available, ask only for the missing local setup. Do not ask the user to paste a bot token into chat. With a user-provided private environment file outside the repository, run:

`python scripts/configure.py --env-file "ABSOLUTE_PRIVATE_ENV_PATH"`

It reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (or `ALLOWED_USER_ID`). Use `--replace` only for a requested credential change. Windows stores the pair using DPAPI under `~/.codex/private/telegram-delivery`; the encrypted file is tied to that computer/user and must not be copied as working credentials. macOS/Linux use the OS credential store through the optional Python `keyring` package with a secure backend. A process environment containing both Telegram variables is also supported; never print it or persist it to project files.

Receipt files remain private in `~/.codex/private/telegram-delivery`. Never print tokens, credential blobs, chat IDs, complete Bot API URLs or decrypted configuration. Windows delivery is verified in this project; other OS backends require a local check on the destination computer.
