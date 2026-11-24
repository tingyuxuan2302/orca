import React from 'react'
import { SortableContext } from '@dnd-kit/sortable'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import type { Translate } from '@/i18n/use-translate'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ProjectedAgentMenuItems } from '../../agent/launch-menu/AgentMenuItems'
import { OpenAgentSettingsMenuItem } from '../../agent/launch-menu/OpenAgentSettingsMenuItem'
import { TabBarAgentPickerEntry } from '../create-entry/TabBarAgentPickerEntry'
import { TabStripScrollIndicator } from './TabStripScrollIndicator'
import { TabStripTooltipProvider } from './TabStripTooltipProvider'
import { getTabStripScrollMaskClassName } from './tab-strip-scroll-metrics'
import type { useTabStripOverflowNavigation } from './tab-strip-overflow-navigation'
import type { useTabStripDragScrollHandlers } from './tab-strip-drag-scroll'
import type { TabBarProps } from '../tab-bar-props'
import type { TabBarRuntimeModel } from '../model/use-tab-bar-runtime-model'
import type { TabBarCreateMenuController } from '../create-menu/tab-bar-create-menu-contract'
import type { TabBarItemProjection } from '../model/use-tab-bar-item-projection'
import type { TabBarItemActions } from '../model/use-tab-bar-item-actions'
import { renderTabBarItems } from '../model/tab-bar-item-surface'
import { WindowedTabStrip } from './WindowedTabStrip'
import type { TabStripSegment } from './tab-strip-window'
import { TabBarStaticCreateMenu } from '../create-menu/tab-bar-static-create-menu'
import { NewTabMenuContent } from '../menu-fit/NewTabMenuContent'
import ClientHostedBrowserTabRows from '../browser-tabs/ClientHostedBrowserTabRows'
import { BotNewChatMenuItems } from '../../bots/BotNewChatMenuItems'
import type { Bot } from '../../../../../shared/bot-types'
import type { BotGroup } from '../../../../../shared/bots/bot-group'
import { BotGroupNewThreadMenuItems } from '../../bots/BotGroupNewThreadMenuItems'
import type { ClientHostedBrowserRow } from '../../../../../shared/browser/client-hosting/client-hosted-browser-rows'
import { advanceAgentSessionsTourPastNewTab } from '@/components/contextual-tours/agent-sessions-tour-new-tab'

const EMPTY_CLIENT_HOSTED_ROWS: readonly ClientHostedBrowserRow[] = []

export function renderTabBarSurface(
  {
    props,
    runtime,
    createMenu,
    itemProjection,
    pinnedSortableIds,
    stripSortableIds,
    tabStripNavigation,
    tabStripDragScroll,
    activeClientHostedBrowserRowId,
    itemActions,
    surfaceRef,
    bot,
    botGroup
  }: {
    props: TabBarProps
    runtime: TabBarRuntimeModel
    createMenu: TabBarCreateMenuController
    itemProjection: TabBarItemProjection
    /** A bot's Home when it leads the order; it sits outside the scroller so it never scrolls away. */
    pinnedSortableIds: string[]
    /** The scroller's sortable ids: every tab but the pinned Home. */
    stripSortableIds: string[]
    tabStripNavigation: ReturnType<typeof useTabStripOverflowNavigation>
    tabStripDragScroll: ReturnType<typeof useTabStripDragScrollHandlers>
    activeClientHostedBrowserRowId: string | null
    itemActions: TabBarItemActions
    surfaceRef: (node: HTMLDivElement | null) => void
    /** Set in a bot's home, where the menu leads with a new chat with the bot. */
    bot: Bot | null
    /** Set in a group's home, where the menu leads with a new thread. */
    botGroup: BotGroup | null
  },
  t: Translate = translate
): React.JSX.Element {
  const {
    worktreeId,
    terminalOnly = false,
    showAgentLaunchItems = true,
    onNewTerminalTab,
    onOpenEntry,
    tabStripChrome = 'default'
  } = props
  const {
    resolvedGroupId,
    mobileEmulatorEnabled,
    managedBrowserCreationEnabled,
    mobileEmulatorCreationEnabled,
    workspaceHasSimulatorTab,
    showMobileEmulatorIntroCallout,
    windowsTerminalCapabilities,
    defaultWindowsPowerShellImplementation
  } = runtime
  const {
    agentMenu,
    agentPickerInventory,
    selectPickerAgent,
    launchAgentRow,
    newTabMenuOpen,
    setNewTabMenuOpen,
    setCreateMenuQuery,
    createMenuOptions,
    windowsShellEntries,
    handleSelectCreateMenuOption,
    launchAgentFromNewTabEntry,
    runPendingNewTabMenuFocusAfterClose,
    queueNewActiveTerminalFocusAfterNewTabMenuClose,
    queueFocusAfterNewTabMenuClose,
    showStaticCreateMenuItems
  } = createMenu
  const { orderedItems, dropIndicatorByVisibleId, activeVisibleTabId } = itemProjection
  const clientHostedBrowserRows = props.clientHostedBrowserRows ?? EMPTY_CLIENT_HOSTED_ROWS
  const {
    tabStripRef,
    tabStripOverflowState,
    activeTabDockSide,
    scrollTabStrip,
    subscribeToStripResize
  } = tabStripNavigation
  const singleTab = orderedItems.length + clientHostedBrowserRows.length === 1
  const includeTopTabBorder = tabStripChrome !== 'floating-panel'
  const pinnedCount = pinnedSortableIds.length
  const renderItems = (
    segments: readonly TabStripSegment[],
    itemOffset: number
  ): React.ReactNode[] =>
    renderTabBarItems({
      items: orderedItems,
      props,
      runtime,
      actions: itemActions,
      dropIndicatorByVisibleId,
      includeTopTabBorder,
      activeClientHostedBrowserRowId,
      segments,
      itemOffset
    })

  const hasTabs = orderedItems.length + clientHostedBrowserRows.length > 0
  // Why 300 with a pinned Home: below it Home's icons, both chevrons, the sliver, "+" and every action no longer fit.
  const chevronClassName = `mx-0.5 my-auto h-6 w-5 ${
    pinnedCount > 0 ? '@max-[300px]/tab-strip:hidden' : '@max-[260px]/tab-strip:hidden'
  }`
  const stripHasTabs = orderedItems.length + clientHostedBrowserRows.length > pinnedCount
  return (
    <div ref={surfaceRef} className="flex items-stretch h-full overflow-hidden flex-1 min-w-0">
      {pinnedCount > 0 ? (
        // Its own context: the strip's windowed list leaves Home out, and Home still takes drops after it.
        <SortableContext items={pinnedSortableIds}>
          <div
            data-single-tab={singleTab ? '' : undefined}
            data-pinned-home-slot=""
            // Why: Home prefers its usual 144px; in overflow the strip gives way to its floor first, then Home narrows to its icons (label hidden once it no longer fits whole), then to its avatar on the strip's usual 40px tab floor.
            // Below 250px of tab strip (room for Home's icons, the 40px sliver, "+" and every action) the order flips so the sliver gives way to Home's icons.
            // The tab fills this box, so the drop marker on its right edge is never clipped; sr-only keeps "Home" as the accessible name when it hides.
            className="@container/pinned-home group/tab-strip flex min-h-0 min-w-10 shrink grow-0 basis-[144px] overflow-hidden @max-[250px]/tab-strip:shrink-[10000] [&>[data-tab-strip-slot]]:w-full [&>[data-tab-strip-slot]]:min-w-0 @max-[84px]/pinned-home:[&_.tab-label]:sr-only @max-[44px]/pinned-home:[&_.lucide-pin]:hidden"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <TabStripTooltipProvider>
              {renderItems([{ kind: 'tabs', start: 0, end: pinnedCount }], 0)}
            </TabStripTooltipProvider>
          </div>
        </SortableContext>
      ) : null}
      {tabStripOverflowState.hasOverflow ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className={chevronClassName}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              aria-label={t('auto.components.tab.bar.TabBar.7a9b4af2af', 'Scroll tabs left')}
              aria-disabled={!tabStripOverflowState.canScrollStart}
              disabled={
                !tabStripDragScroll.isTabDragActive && !tabStripOverflowState.canScrollStart
              }
              onClick={() => scrollTabStrip('start')}
              onPointerEnter={tabStripDragScroll.onDragScrollStartEnter}
              onPointerLeave={tabStripDragScroll.onDragScrollLeave}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            {t('auto.components.tab.bar.TabBar.7a9b4af2af', 'Scroll tabs left')}
          </TooltipContent>
        </Tooltip>
      ) : null}
      {/* Keep drag siblings anchored; only the insertion bar moves. */}
      <WindowedTabStrip
        stripRef={tabStripRef}
        subscribeToStripResize={subscribeToStripResize}
        sortableIds={stripSortableIds}
        activeVisibleTabId={activeVisibleTabId}
        renderStrip={(segments) => (
          // Why no-drag: tab interactions must work inside the titlebar's drag region (outer container stays window-draggable).
          <div
            data-single-tab={singleTab ? '' : undefined}
            // Why: tabs are the only drag source, so a narrow pane clips the "+" before the last tab sliver.
            className={`group/tab-strip relative flex min-h-0 w-max max-w-full ${
              pinnedCount > 0
                ? 'shrink-[10000] @max-[250px]/tab-strip:shrink @max-[250px]/tab-strip:min-w-0'
                : 'shrink'
            } ${stripHasTabs ? 'min-w-10' : 'min-w-0'}`}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <div
              ref={tabStripRef}
              // Tab drags clip drop targets to this box (tab-drag-collision.ts).
              data-tab-strip-scroller=""
              data-active-tab-docked={activeTabDockSide ?? undefined}
              // Why: only `border-r` here — a strip-level `border-l` would render a heavier L-corner than the first tab's own `border-l`.
              className={[
                'terminal-tab-strip flex h-full min-w-0 max-w-full flex-1 items-stretch overflow-x-auto overflow-y-hidden',
                'border-r border-border/70',
                getTabStripScrollMaskClassName(tabStripOverflowState, activeTabDockSide)
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <TabStripTooltipProvider>
                {renderItems(segments, pinnedCount)}
                {clientHostedBrowserRows.length > 0 ? (
                  <ClientHostedBrowserTabRows
                    rows={clientHostedBrowserRows}
                    worktreeId={worktreeId}
                    groupId={resolvedGroupId}
                    groupActiveTabId={props.groupActiveTabId ?? null}
                    includeTopTabBorder={includeTopTabBorder}
                  />
                ) : null}
              </TabStripTooltipProvider>
            </div>
            <TabStripScrollIndicator
              hasOverflow={tabStripOverflowState.hasOverflow}
              scrollContainerRef={tabStripRef}
              subscribeToStripResize={subscribeToStripResize}
              disabled={tabStripDragScroll.isTabDragActive}
            />
          </div>
        )}
      />
      {tabStripOverflowState.hasOverflow ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className={chevronClassName}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              aria-label={t('auto.components.tab.bar.TabBar.232e075b07', 'Scroll tabs right')}
              aria-disabled={!tabStripOverflowState.canScrollEnd}
              disabled={!tabStripDragScroll.isTabDragActive && !tabStripOverflowState.canScrollEnd}
              onClick={() => scrollTabStrip('end')}
              onPointerEnter={tabStripDragScroll.onDragScrollEndEnter}
              onPointerLeave={tabStripDragScroll.onDragScrollLeave}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            {t('auto.components.tab.bar.TabBar.232e075b07', 'Scroll tabs right')}
          </TooltipContent>
        </Tooltip>
      ) : null}
      <DropdownMenu
        open={newTabMenuOpen}
        onOpenChange={setNewTabMenuOpen}
        // Why: modal would disable body pointer events, making the Mobile Emulator "Hide" re-enable toast unclickable.
        modal={false}
      >
        <DropdownMenuTrigger asChild>
          {/* Why: below 86px (40 tab floor + 36 "+" + 8 action padding + 2 sub-pixel slack) "+" would only clip; hide it whole so Tab never lands on it. Empty groups keep it. */}
          <button
            className={`ml-2 my-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground ${
              hasTabs ? '@max-[86px]/tab-strip:hidden' : ''
            }`}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title={t('auto.components.tab.bar.TabBar.b1a132357f', 'New tab')}
            aria-label={t('auto.components.tab.bar.TabBar.b1a132357f', 'New tab')}
            data-contextual-tour-target="tab-create-menu"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <NewTabMenuContent
          align="start"
          sideOffset={6}
          className="w-72 max-w-[calc(100vw-1rem)] rounded-[11px] border-border/80 p-1 shadow-[0_16px_36px_rgba(0,0,0,0.24)]"
          onCloseAutoFocus={(event) => {
            // Why: Radix restores focus to the "+" trigger on close, stealing it from the freshly-mounted terminal.
            event.preventDefault()
            runPendingNewTabMenuFocusAfterClose()
            advanceAgentSessionsTourPastNewTab()
          }}
        >
          {!terminalOnly && onOpenEntry ? (
            <>
              <TabBarAgentPickerEntry
                inventory={agentPickerInventory}
                terminalPending={agentMenu.state === 'settled' && agentMenu.terminalPending}
                worktreeId={worktreeId}
                groupId={resolvedGroupId}
                excludedTabId={
                  activeClientHostedBrowserRowId === null ? itemProjection.activeUnifiedTabId : null
                }
                menuOpen={newTabMenuOpen}
                menuOptions={createMenuOptions}
                // A bot's or group's home offers its agents only through its chats, above.
                hideAgents={bot !== null || botGroup !== null}
                onLaunchAgentOption={launchAgentFromNewTabEntry}
                onOpenDefaultTerminal={() => {
                  queueNewActiveTerminalFocusAfterNewTabMenuClose()
                  onNewTerminalTab()
                }}
                onOpenEntry={onOpenEntry}
                onQueryChange={setCreateMenuQuery}
                onQueueSwitchFocus={queueFocusAfterNewTabMenuClose}
                onSelectMenuOption={handleSelectCreateMenuOption}
                onDidOpenEntry={() => setNewTabMenuOpen(false)}
              />
              {showStaticCreateMenuItems ? <DropdownMenuSeparator className="my-0 mb-1.5" /> : null}
            </>
          ) : null}
          {bot && !terminalOnly ? <BotNewChatMenuItems bot={bot} model={agentMenu} /> : null}
          {botGroup && !terminalOnly ? (
            <>
              <BotGroupNewThreadMenuItems group={botGroup} />
              {showStaticCreateMenuItems ? <DropdownMenuSeparator /> : null}
            </>
          ) : null}
          {showStaticCreateMenuItems ? (
            <TabBarStaticCreateMenu
              props={props}
              groupId={resolvedGroupId}
              terminalOnly={terminalOnly}
              mobileEmulatorEnabled={mobileEmulatorEnabled}
              managedBrowserCreationEnabled={managedBrowserCreationEnabled}
              mobileEmulatorCreationEnabled={mobileEmulatorCreationEnabled}
              workspaceHasSimulatorTab={workspaceHasSimulatorTab}
              showMobileEmulatorIntroCallout={showMobileEmulatorIntroCallout}
              windowsShellEntries={windowsShellEntries}
              defaultWindowsPowerShellImplementation={defaultWindowsPowerShellImplementation}
              pwshAvailable={windowsTerminalCapabilities.pwshAvailable}
              queueNewActiveTerminalFocusAfterNewTabMenuClose={
                queueNewActiveTerminalFocusAfterNewTabMenuClose
              }
            />
          ) : null}
          {showStaticCreateMenuItems && showAgentLaunchItems && !botGroup ? (
            <>
              <DropdownMenuSeparator />
              {bot ? (
                <OpenAgentSettingsMenuItem variant="create" />
              ) : (
                <ProjectedAgentMenuItems
                  model={agentMenu}
                  pickerInventory={agentPickerInventory}
                  onSelectPickerAgent={selectPickerAgent}
                  hidePickerSearch={!terminalOnly && Boolean(onOpenEntry)}
                  runLaunch={launchAgentRow}
                />
              )}
            </>
          ) : null}
        </NewTabMenuContent>
      </DropdownMenu>
    </div>
  )
}
