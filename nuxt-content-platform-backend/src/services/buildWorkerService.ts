import { BuildEventStatus } from '@prisma/client'
import type { Env } from '../config/env.js'
import { prisma } from '../db/prisma.js'

type GitHubRun = {
  id: number
  name?: string
  display_title?: string
  status: string
  conclusion: string | null
  html_url: string
}

export type BuildWorkerConfig = {
  owner: string
  repo: string
  workflow: string
  ref: string
  token: string
  mergeWindowSeconds: number
}

export function requireBuildWorkerConfig(env: Env): BuildWorkerConfig {
  if (!env.BUILD_GITHUB_OWNER || !env.BUILD_GITHUB_REPO || !env.BUILD_GITHUB_TOKEN)
    throw new Error('BUILD_GITHUB_OWNER, BUILD_GITHUB_REPO and BUILD_GITHUB_TOKEN are required')
  return {
    owner: env.BUILD_GITHUB_OWNER,
    repo: env.BUILD_GITHUB_REPO,
    workflow: env.BUILD_GITHUB_WORKFLOW,
    ref: env.BUILD_GITHUB_REF,
    token: env.BUILD_GITHUB_TOKEN,
    mergeWindowSeconds: env.BUILD_MERGE_WINDOW_SECONDS,
  }
}

function headers(config: BuildWorkerConfig): Record<string, string> {
  return {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${config.token}`,
    'content-type': 'application/json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'nuxt-content-platform-build-worker',
  }
}

function apiBase(config: BuildWorkerConfig): string {
  return `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`
}

function safeRunUrl(config: BuildWorkerConfig, value: string): string | null {
  try {
    const url = new URL(value)
    const prefix = `/${config.owner}/${config.repo}/actions/runs/`.toLowerCase()
    return url.protocol === 'https:'
      && url.hostname === 'github.com'
      && url.pathname.toLowerCase().startsWith(prefix)
      ? url.toString()
      : null
  }
  catch {
    return null
  }
}

async function githubRequest(config: BuildWorkerConfig, path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${apiBase(config)}${path}`, {
    ...init,
    headers: { ...headers(config), ...(init?.headers || {}) },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok)
    throw new Error(`github_api_${response.status}`)
  return response
}

async function dispatch(config: BuildWorkerConfig, dispatchKey: string, eventIds: number[]): Promise<void> {
  await githubRequest(config, `/actions/workflows/${encodeURIComponent(config.workflow)}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({
      ref: config.ref,
      inputs: {
        dispatch_key: dispatchKey,
        event_ids: eventIds.join(','),
        trigger_reason: 'content_event',
      },
    }),
  })
}

async function findRun(config: BuildWorkerConfig, dispatchKey: string): Promise<GitHubRun | null> {
  const response = await githubRequest(
    config,
    `/actions/workflows/${encodeURIComponent(config.workflow)}/runs?event=workflow_dispatch&per_page=30`,
  )
  const data = await response.json() as { workflow_runs?: GitHubRun[] }
  return data.workflow_runs?.find(run =>
    run.name === dispatchKey || run.display_title === dispatchKey,
  ) ?? null
}

async function getRun(config: BuildWorkerConfig, id: string): Promise<GitHubRun> {
  const response = await githubRequest(config, `/actions/runs/${encodeURIComponent(id)}`)
  return response.json() as Promise<GitHubRun>
}

function safeError(error: unknown): string {
  const value = error instanceof Error ? error.message : 'build_dispatch_failed'
  return value.replace(/https?:\/\/[^\s]+/g, '[url]').slice(0, 500)
}

async function reconcileRunning(config: BuildWorkerConfig): Promise<void> {
  const rows = await prisma.buildEvent.findMany({
    where: { status: BuildEventStatus.RUNNING },
    orderBy: { startedAt: 'asc' },
    take: 20,
  })
  for (const row of rows) {
    try {
      const run = row.externalRunId?.startsWith('dispatch:')
        ? await findRun(config, row.externalRunId.slice('dispatch:'.length))
        : row.externalRunId ? await getRun(config, row.externalRunId) : null
      if (!run)
        continue
      const runUrl = safeRunUrl(config, run.html_url)
      const finished = run.status === 'completed'
      const succeeded = finished && run.conclusion === 'success'
      await prisma.buildEvent.update({
        where: { id: row.id },
        data: {
          externalRunId: String(run.id),
          externalRunUrl: runUrl,
          ...(finished
            ? {
                status: succeeded ? BuildEventStatus.SUCCEEDED : BuildEventStatus.FAILED,
                finishedAt: new Date(),
                errorSummary: succeeded ? null : `github_actions_${run.conclusion || 'failed'}`,
              }
            : {}),
        },
      })
    }
    catch (error) {
      await prisma.buildEvent.update({
        where: { id: row.id },
        data: { errorSummary: safeError(error) },
      })
    }
  }
}

async function dispatchQueued(config: BuildWorkerConfig, dryRun: boolean): Promise<number[]> {
  const cutoff = new Date(Date.now() - config.mergeWindowSeconds * 1000)
  const rows = await prisma.buildEvent.findMany({
    where: {
      status: BuildEventStatus.QUEUED,
      createdAt: { lte: cutoff },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 50,
  })
  if (rows.length === 0 || dryRun)
    return rows.map(row => row.id)

  const leader = rows[0]!
  const mergedIds = rows.slice(1).map(row => row.id)
  const dispatchKey = `content-build-${leader.id}-${leader.attempts + 1}`
  const claimed = await prisma.$transaction(async (tx) => {
    const result = await tx.buildEvent.updateMany({
      where: { id: leader.id, status: BuildEventStatus.QUEUED },
      data: {
        status: BuildEventStatus.RUNNING,
        attempts: { increment: 1 },
        startedAt: new Date(),
        finishedAt: null,
        errorSummary: null,
        externalRunId: `dispatch:${dispatchKey}`,
        externalRunUrl: null,
      },
    })
    if (result.count !== 1)
      return false
    if (mergedIds.length > 0) {
      await tx.buildEvent.updateMany({
        where: { id: { in: mergedIds }, status: BuildEventStatus.QUEUED },
        data: {
          status: BuildEventStatus.SKIPPED,
          finishedAt: new Date(),
          externalRunId: `merged:${leader.id}`,
          errorSummary: `merged_into_build_event_${leader.id}`,
        },
      })
    }
    return true
  })
  if (!claimed)
    return []

  try {
    await dispatch(config, dispatchKey, rows.map(row => row.id))
  }
  catch (error) {
    await prisma.buildEvent.update({
      where: { id: leader.id },
      data: {
        status: BuildEventStatus.FAILED,
        finishedAt: new Date(),
        errorSummary: safeError(error),
      },
    })
  }
  return rows.map(row => row.id)
}

export async function runBuildWorkerOnce(config: BuildWorkerConfig, dryRun = false): Promise<number[]> {
  if (!dryRun)
    await reconcileRunning(config)
  return dispatchQueued(config, dryRun)
}
