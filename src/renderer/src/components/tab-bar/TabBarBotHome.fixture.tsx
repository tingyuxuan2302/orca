import { useState } from 'react'
import { DndContext } from '@dnd-kit/core'
import { defineFixture } from '../../component-fixtures/component-fixture'
import { publishBots } from '@/lib/bot-catalog-snapshot'
import type { Bot } from '../../../../shared/bot-types'
import type { Tab } from '../../../../shared/workspace-layout/tab-groups/tab-types'
import { folderWorkspaceKey } from '../../../../shared/workspace/identity/workspace-scope'
import TabBar from './TabBar'

const bot: Bot = {
  id: 'release-helper',
  name: 'Release helper',
  hostId: 'local',
  folder: 'release-helper',
  folderWorkspaceId: 'fw-release-helper',
  agent: 'claude',
  avatar: null,
  paused: false,
  notifications: { needsPermission: true, taskComplete: true, couldNotFinish: true },
  members: [],
  slack: null,
  linear: null,
  github: null,
  chatSessionId: 'release-helper-chat',
  createdAt: 0,
  updatedAt: 0
}
const WORKSPACE_ID = folderWorkspaceKey(bot.folderWorkspaceId)
const GROUP_ID = 'bot-home-group'
const SIDE_TITLES = [
  'Draft the release notes',
  'Triage the flaky upload test',
  'Check the nightly build',
  'Answer the docs question'
]
const noop = (): void => {}

function chatTab(id: string, entityId: string, label: string, index: number): Tab {
  return {
    id,
    entityId,
    groupId: GROUP_ID,
    worktreeId: WORKSPACE_ID,
    executionHostId: 'local',
    contentType: 'agent-session',
    agentSessionAgent: 'claude',
    label,
    customLabel: null,
    color: null,
    sortOrder: index,
    createdAt: index,
    isPinned: index === 0
  }
}

function BotHomeTabsFixture({
  sideChats,
  paneHeader = false
}: {
  sideChats: number
  /** Mirrors TabGroupPanel's header: drag handle, quick commands and pane actions share the strip's width. */
  paneHeader?: boolean
}): React.JSX.Element {
  const tabs = [
    chatTab('home-tab', bot.chatSessionId!, 'Home', 0),
    ...Array.from({ length: sideChats }, (_, index) =>
      chatTab(
        `side-${index}`,
        `side-chat-${index}`,
        SIDE_TITLES[index % SIDE_TITLES.length],
        index + 1
      )
    )
  ] as (Tab & { contentType: 'agent-session' })[]
  const [activeTabId, setActiveTabId] = useState(tabs.at(-1)!.id)
  const tabBar = (
    <TabBar
      tabs={[]}
      agentSessionTabs={tabs}
      tabBarOrder={tabs.map((tab) => tab.id)}
      activeTabId={activeTabId}
      activeTabType="agent-session"
      worktreeId={WORKSPACE_ID}
      groupId={GROUP_ID}
      expandedPaneByTabId={{}}
      showAgentLaunchItems={false}
      onActivate={setActiveTabId}
      onActivateAgentSession={setActiveTabId}
      onClose={noop}
      onCloseOthers={noop}
      onCloseToRight={noop}
      onCloseToLeft={noop}
      onNewTerminalTab={noop}
      onNewBrowserTab={noop}
      onSetCustomTitle={noop}
      onSetTabColor={noop}
      onTogglePaneExpand={noop}
    />
  )
  return (
    <DndContext>
      {paneHeader ? (
        <div data-fixture-pane-header="" className="flex h-8 items-stretch bg-card pr-1">
          <div className="@container/tab-strip flex min-w-0 flex-1 items-stretch">
            <div className="h-full min-w-10 flex-1">{tabBar}</div>
            <div className="w-10 min-w-0 @max-[203px]/tab-strip:hidden" />
            <div className="flex min-w-0 items-center gap-0.5 overflow-hidden pr-0.5 pl-1.5">
              <div className="h-6 w-[47px] shrink-0 rounded-md bg-muted @max-[163px]/tab-strip:hidden" />
              <div className="size-7 shrink-0 rounded-md bg-muted @max-[114px]/tab-strip:hidden" />
            </div>
          </div>
        </div>
      ) : (
        <div className="@container/tab-strip h-8 bg-card">{tabBar}</div>
      )}
    </DndContext>
  )
}

const setup = (): void => {
  publishBots([bot], { threadReplies: false, webhooks: false })
}

export const homeOnly = defineFixture({
  width: 620,
  store: { workspaceSessionReady: true },
  setup,
  render: () => <BotHomeTabsFixture sideChats={0} />
})

export const homeWithSideChats = defineFixture({
  width: 900,
  store: { workspaceSessionReady: true },
  setup,
  render: () => <BotHomeTabsFixture sideChats={2} />
})

// Side chats overflow the strip: Home stays at the left edge while they scroll.
export const homeOverflowing = defineFixture({
  width: 620,
  store: { workspaceSessionReady: true },
  setup,
  render: () => <BotHomeTabsFixture sideChats={12} />
})

// A narrow split: the strip keeps its sliver, Home truncates, and "+" stays reachable.
export const homeNarrowSplit = defineFixture({
  width: 160,
  store: { workspaceSessionReady: true },
  setup,
  render: () => <BotHomeTabsFixture sideChats={12} />
})

// Inside a pane header whose actions share the width; resize [data-fixture-pane-header] to probe narrow splits.
export const homeInPaneHeader = defineFixture({
  width: 620,
  store: { workspaceSessionReady: true },
  setup,
  render: () => <BotHomeTabsFixture sideChats={12} paneHeader />
})
