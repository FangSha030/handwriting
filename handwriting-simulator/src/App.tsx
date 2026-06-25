import { useEffect } from 'react'
import { TopToolbar } from './components/TopToolbar'
import { LeftSidebar } from './components/LeftSidebar'
import { RightSidebar } from './components/RightSidebar'
import { EditorCanvas } from './components/EditorCanvas'
import { FloatingToolbar } from './components/FloatingToolbar'
import { ToastContainer } from './components/ToastContainer'
import { initLocalFonts } from './utils/fonts'
import { useEditorStore } from './store/editorStore'

function App() {
  const addToast = useEditorStore((s) => s.addToast)

  useEffect(() => {
    // 初始化本地字体
    initLocalFonts().then(() => {
      addToast('success', '手写笔迹模拟器已就绪')
    }).catch(() => {
      addToast('warn', '部分本地字体加载失败，不影响使用')
    })
  }, [addToast])

  return (
    <div className="h-screen w-screen flex flex-col bg-paper-dark overflow-hidden">
      <TopToolbar />
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <EditorCanvas />
          <FloatingToolbar />
        </main>
        <RightSidebar />
      </div>
      <ToastContainer />
    </div>
  )
}

export default App
