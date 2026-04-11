import { memo } from 'react'
import type { TabId, Tab } from '../types'
import '../styles/TabNav.css'

interface TabNavProps {
  tabs: Tab[]
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const TabNav = memo(function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="tabnav" role="navigation" aria-label="Основная навигация">
      <div className="tabnav__inner">
        <div className="tabnav__list" role="tablist">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`tabnav__tab ${isActive ? 'tabnav__tab--active' : ''}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
              >
                {tab.label}
                {isActive && <span className="tabnav__tab-indicator" />}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
})

export default TabNav
