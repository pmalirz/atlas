# Project agent skills

Shared skill content lives in `.agents/skills/`. Devin uses relative symbolic links from `.devin/skills/` to that content. Downloaded skills are tracked in `skills-lock.json` when supported by their installation history.

The community selection was reviewed on 2026-11-07. The practical selection criterion is approximately 10,000 or more public skills.sh installations, an identifiable upstream source, and relevance to Atlas. Installation counts are approximate adoption signals, not quality guarantees or endorsements. Repository stars are not skill installation counts.

| Skill | Approximate installs | Source / evidence |
| --- | ---: | --- |
| find-skills | 4.3M | [Vercel](https://skills.sh/vercel-labs/skills/find-skills) |
| frontend-design | 1.1M | [Anthropic](https://skills.sh/anthropics/skills/frontend-design) |
| vercel-react-best-practices | 879K | [Vercel](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices) |
| web-design-guidelines | 835K | [Vercel](https://skills.sh/vercel-labs/agent-skills/web-design-guidelines) |
| ui-ux-pro-max | 440K | [NextLevelBuilder](https://skills.sh/nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max) |
| shadcn | 139K | [shadcn/ui](https://skills.sh/shadcn-ui/ui/shadcn) |
| accessibility | 68K | [Addy Osmani](https://skills.sh/addyosmani/web-quality-skills/accessibility) |
| design-md | 66K | [Google Labs](https://skills.sh/google-labs-code/stitch-skills/design-md) |
| nestjs-best-practices | 31K | [Kadajett](https://skills.sh/kadajett/agent-nestjs-skills/nestjs-best-practices) |
| docker-expert | 27K | [Community collection](https://skills.sh/sickn33/agentic-awesome-skills/docker-expert) |
| prd | 24K | [GitHub](https://skills.sh/github/awesome-copilot/prd) |
| clean-code | 13K | [Community collection](https://skills.sh/sickn33/agentic-awesome-skills/clean-code) |
| typescript-expert | 13K | [Community collection](https://skills.sh/sickn33/agentic-awesome-skills/typescript-expert) |

`atlas-model-seed` is the intentional project-specific exception. It contains Atlas model, migration, audit-trigger, and seed guidance and is not evaluated against community usage.

Removed from the downloaded collection: `context7`, `planner`, `requirements-analysis`, `nestjs-expert`, and `prisma-expert` had substantially lower public adoption; `jq-json-processing` lacked verifiable adoption evidence in this review. `prd` replaces the requirements workflow and `nestjs-best-practices` replaces the NestJS guidance.

`design-md` applies to Stitch projects; `vercel-react-best-practices` also contains Next.js guidance. Apply only instructions relevant to Atlas's React/Vite stack and installed package versions.
