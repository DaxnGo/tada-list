import React, { useState, useEffect, useRef } from "react";
import "./TodoList.css";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  category: string;
  createdAt: number;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("personal");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [draggedTodoId, setDraggedTodoId] = useState<number | null>(null);
  const dragStartX = useRef<number>(0);
  const draggedItemRef = useRef<HTMLLIElement | null>(null);

  const categories = ["personal", "work", "shopping", "health", "other"];

  // Load todos from localStorage on initial render
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
    setLoading(false);
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (inputValue.trim() !== "") {
      const newTodo: Todo = {
        id: Date.now(),
        text: inputValue,
        completed: false,
        priority,
        category,
        createdAt: Date.now(),
      };
      setTodos([...todos, newTodo]);
      setInputValue("");
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const clearCompleted = () => {
    setTodos(todos.filter((todo) => !todo.completed));
  };

  // Touch handlers for swipe-to-delete on mobile
  const handleTouchStart = (e: React.TouchEvent, id: number) => {
    dragStartX.current = e.touches[0].clientX;
    setDraggedTodoId(id);
    draggedItemRef.current = e.currentTarget as HTMLLIElement;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedTodoId === null || !draggedItemRef.current) return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - dragStartX.current;

    // Only allow swipe left (negative deltaX)
    if (deltaX < 0) {
      // Limit the max swipe distance to -100px
      const translateX = Math.max(-100, deltaX);
      draggedItemRef.current.style.transform = `translateX(${translateX}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (draggedTodoId === null || !draggedItemRef.current) return;

    // Get the current transform value
    const style = window.getComputedStyle(draggedItemRef.current);
    const transform = style.getPropertyValue("transform");
    const matrix = new DOMMatrix(transform);
    const translateX = matrix.m41;

    // If swiped more than 40% of the width, delete the item
    if (translateX < -80) {
      // Animate the item off the screen
      draggedItemRef.current.style.transform = "translateX(-100%)";
      draggedItemRef.current.style.opacity = "0";
      setTimeout(() => {
        deleteTodo(draggedTodoId);
      }, 300);
    } else {
      // Reset the transform
      draggedItemRef.current.style.transform = "translateX(0)";
    }

    setDraggedTodoId(null);
    draggedItemRef.current = null;
  };

  const filteredTodos = todos
    .filter((todo) => {
      if (filter === "active") return !todo.completed;
      if (filter === "completed") return todo.completed;
      return true;
    })
    .filter((todo) => {
      if (categoryFilter === "all") return true;
      return todo.category === categoryFilter;
    })
    .sort((a, b) => {
      // Sort by priority (high to low)
      const priorityValues = { high: 3, medium: 2, low: 1 };
      return priorityValues[b.priority] - priorityValues[a.priority];
    });

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;

  // Using Array.from instead of spread operator with Set
  const uniqueCategories = Array.from(
    new Set(todos.map((todo) => todo.category))
  );

  // Get counts for all priorities
  const priorityCounts = {
    high: todos.filter((todo) => todo.priority === "high").length,
    medium: todos.filter((todo) => todo.priority === "medium").length,
    low: todos.filter((todo) => todo.priority === "low").length,
  };

  // Helper to get today's date formatted
  const getTodayDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString(undefined, options);
  };

  return (
    <div className="todo-container">
      <div className="todo-header">
        <h1>Tada List</h1>
        <p className="date-display">{getTodayDate()}</p>
      </div>

      <div className="input-section">
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new task..."
          />
          <button onClick={addTodo} className="add-btn">
            Add
          </button>
        </div>

        <div className="task-options">
          <div className="option-group">
            <label>Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="category-select">
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="option-group">
            <label>Priority:</label>
            <div className="priority-options">
              <button
                className={`priority-btn low ${priority === "low" ? "active" : ""}`}
                onClick={() => setPriority("low")}>
                Low
              </button>
              <button
                className={`priority-btn medium ${priority === "medium" ? "active" : ""}`}
                onClick={() => setPriority("medium")}>
                Medium
              </button>
              <button
                className={`priority-btn high ${priority === "high" ? "active" : ""}`}
                onClick={() => setPriority("high")}>
                High
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}>
            All
          </button>
          <button
            className={`filter-btn ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}>
            Active
          </button>
          <button
            className={`filter-btn ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}>
            Completed
          </button>
        </div>

        {uniqueCategories.length > 1 && (
          <div className="category-filter">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your tasks...</p>
        </div>
      ) : (
        <>
          {filteredTodos.length === 0 ? (
            <div className="empty-state">
              {todos.length === 0
                ? "Your to-do list is empty. Add a new task to get started!"
                : "No tasks match your current filters."}
            </div>
          ) : (
            <ul className="todo-list">
              {filteredTodos.map((todo) => (
                <li
                  key={todo.id}
                  className={`${todo.completed ? "completed" : ""} priority-${todo.priority}`}
                  onTouchStart={(e) => handleTouchStart(e, todo.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}>
                  <div className="swipe-hint">← Swipe to delete</div>
                  <div className="todo-item">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                    />
                    <div className="todo-content">
                      <span className="todo-text">{todo.text}</span>
                      <div className="todo-meta">
                        <span className={`category-tag ${todo.category}`}>
                          {todo.category}
                        </span>
                        <span className={`priority-tag ${todo.priority}`}>
                          {todo.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => deleteTodo(todo.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="todo-footer">
            <div className="todo-stats">
              <p>{todos.filter((todo) => !todo.completed).length} items left</p>
              {totalCount > 0 && (
                <p>
                  {completedCount} of {totalCount} completed
                </p>
              )}
            </div>

            {completedCount > 0 && (
              <button className="clear-completed" onClick={clearCompleted}>
                Clear completed
              </button>
            )}
          </div>

          {totalCount > 0 && (
            <div className="todo-summary">
              <h3>Task Summary</h3>
              <div className="summary-chart">
                <div className="chart-bar">
                  <div
                    className="bar high"
                    style={{
                      width: `${(priorityCounts.high / totalCount) * 100}%`,
                    }}>
                    {priorityCounts.high > 0 && `${priorityCounts.high}`}
                  </div>
                  <div
                    className="bar medium"
                    style={{
                      width: `${(priorityCounts.medium / totalCount) * 100}%`,
                    }}>
                    {priorityCounts.medium > 0 && `${priorityCounts.medium}`}
                  </div>
                  <div
                    className="bar low"
                    style={{
                      width: `${(priorityCounts.low / totalCount) * 100}%`,
                    }}>
                    {priorityCounts.low > 0 && `${priorityCounts.low}`}
                  </div>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color high"></span> High
                  </div>
                  <div className="legend-item">
                    <span className="legend-color medium"></span> Medium
                  </div>
                  <div className="legend-item">
                    <span className="legend-color low"></span> Low
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TodoList;
