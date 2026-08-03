import { useState, useEffect, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit } from "@tauri-apps/api/event";
import "./global.css";
import "./Tasks.css";

interface Task {
  id: string;
  text: string;
  size: "small" | "big";
  done: boolean;
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskSize, setNewTaskSize] = useState<"small" | "big">("small");
  const [undoTask, setUndoTask] = useState<Task | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mitra_tasks");
    if (saved) {
      try { setTasks(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  // Save tasks to localStorage when changed
  useEffect(() => {
    localStorage.setItem("mitra_tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Keep track of mounted state to prevent state updates on unmounted component
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTaskText.trim(), size: newTaskSize, done: false }]);
    setNewTaskText("");
  };

  const toggleTask = async (id: string, currentlyDone: boolean, size: "small" | "big") => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newTasks = tasks.map(t => t.id === id ? { ...t, done: !currentlyDone } : t);
    setTasks(newTasks);

    if (!currentlyDone) {
      await emit("task:completed", { size });

      // Show undo toast first — only delete after 5s if not undone
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoTask(task);

      undoTimerRef.current = setTimeout(() => {
        if (isMounted.current) {
          setTasks(prev => prev.filter(t => t.id !== id));
          setUndoTask(null);
        }
      }, 5000);
    }
  };

  const handleUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoTask(null);
    // Revert the done state
    if (undoTask) {
      setTasks(prev => prev.map(t => t.id === undoTask.id ? { ...t, done: false } : t));
    }
  };

  const handleClose = () => getCurrentWebviewWindow().hide();

  return (
    <div className="tasks-container">
      <div className="tasks-header" data-tauri-drag-region>
        <h2 data-tauri-drag-region>Mitra Focus</h2>
        <button className="close-btn" onClick={handleClose}>✕</button>
      </div>

      {/* Undo toast */}
      {undoTask && (
        <div className="task-undo-toast">
          <span className="task-undo-icon">✓</span>
          <span className="task-undo-label">"{undoTask.text}" done!</span>
          <button className="task-undo-btn" onClick={handleUndo}>Undo</button>
        </div>
      )}

      <div className="tasks-section">
        <h3>Today's Goals</h3>

        <form className="add-task-form" onSubmit={addTask}>
          <input
            type="text"
            placeholder="What are we doing?"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
          />

          <div className="custom-select-wrapper">
            <select value={newTaskSize} onChange={(e) => setNewTaskSize(e.target.value as "small" | "big")}>
              <option value="small">Small Task</option>
              <option value="big">Big Goal</option>
            </select>
            <div className="select-arrow">▼</div>
          </div>

          <button type="submit" className="add-btn">+</button>
        </form>

        <div className="task-list">
          {tasks.length === 0 && <p className="empty-state">No tasks yet. Let's conquer the day! 🚀</p>}
          {tasks.map(task => (
            <div key={task.id} className={`task-item ${task.done ? "done" : ""} size-${task.size}`}>
              <div
                className={`checkbox ${task.done ? "checked" : ""}`}
                onClick={() => toggleTask(task.id, task.done, task.size)}
              >
                {task.done && "✓"}
              </div>
              <div className="task-content">
                <span className="task-text">{task.text}</span>
                <span className="task-badge">{task.size === "big" ? "🌟 Goal" : "✓ Task"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
