import { TopToolbar } from './components/TopToolbar'
import { LeftSidebar } from './components/LeftSidebar'
import { RightSidebar } from './components/RightSidebar'
import { EditorCanvas } from './components/EditorCanvas'
import { FloatingToolbar } from './components/FloatingToolbar'
import { ToastContainer } from './components/ToastContainer'

function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-paper-dark overflow-hidden">
      {/* 顶部工具栏 */}
      <TopToolbar />

      {/* 主体区域：左侧栏 + 画布 + 右侧栏 */}
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />

        {/* 中间画布区（相对定位，用于悬浮工具栏） */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <EditorCanvas />
          <FloatingToolbar />
        </main>

        <RightSidebar />
      </div>

      {/* 全局通知 */}
      <ToastContainer />
    </div>
  )
}

export default App
