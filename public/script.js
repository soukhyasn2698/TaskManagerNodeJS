const API_URL = "/"; 

// Show loading state
function showLoading() {
    document.getElementById("loading").style.display = "block";
    document.getElementById("taskList").style.display = "none";
    document.getElementById("emptyState").style.display = "none";
}

// Hide loading state
function hideLoading() {
    document.getElementById("loading").style.display = "none";
    document.getElementById("taskList").style.display = "block";
}

// Show message to user
function showMessage(text, type = 'success') {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    const taskInput = document.querySelector('.task-input');
    taskInput.appendChild(message);
    
    // Auto-remove message after 3 seconds
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return "Today";
    } else if (diffDays === 2) {
        return "Yesterday";
    } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Truncate task ID for display
function truncateId(id) {
    return id.substring(0, 8) + '...';
}

// Update task count
function updateTaskCount(count) {
    document.getElementById("taskCount").textContent = count;
}

// Load and display tasks
async function loadTasks() {
    console.log("Starting to load tasks...");
    
    try {
        const response = await fetch(API_URL + "/tasks");
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.json();
        console.log("Raw API response:", rawData);
        console.log("Type of rawData:", typeof rawData);
        console.log("Is rawData an array?", Array.isArray(rawData));
        
        // Handle different response formats
        let data = [];
        
        if (Array.isArray(rawData)) {
            // Direct array response
            data = rawData;
            console.log("Using direct array");
        } else if (rawData && rawData.body) {
            // Response wrapped in body (Lambda proxy integration)
            console.log("Found body property:", rawData.body);
            try {
                if (typeof rawData.body === 'string') {
                    data = JSON.parse(rawData.body);
                } else {
                    data = rawData.body;
                }
                console.log("Parsed body data:", data);
            } catch (e) {
                console.error("Error parsing body:", e);
                data = [];
            }
        } else if (rawData && rawData.Items) {
            // DynamoDB scan response format
            data = rawData.Items;
            console.log("Using DynamoDB Items");
        } else if (rawData && typeof rawData === 'object') {
            // Single object - convert to array
            data = [rawData];
            console.log("Converting single object to array");
        } else {
            console.warn("Unexpected response format:", rawData);
            data = [];
        }
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
            console.error("Data is still not an array after processing:", typeof data, data);
            data = [];
        }
        
        console.log("Final processed data:", data);
        console.log("Data length:", data.length);
        
        const list = document.getElementById("taskList");
        const emptyState = document.getElementById("emptyState");
        
        // Clear existing content
        list.innerHTML = "";
        
        if (data.length === 0) {
            console.log("No tasks found, showing empty state");
            if (list.style) list.style.display = "none";
            if (emptyState && emptyState.style) emptyState.style.display = "block";
            if (document.getElementById("taskCount")) {
                document.getElementById("taskCount").textContent = "0";
            }
            return;
        }
        
        // Sort tasks by creation date (newest first) - with error handling
        try {
            data.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });
        } catch (sortError) {
            console.warn("Error sorting data:", sortError);
            // Continue without sorting
        }
        
        // Display tasks
        data.forEach((task, index) => {
            const li = document.createElement("li");
            li.className = "task-item";
            
            // Ensure task has required properties
            const taskId = task.taskId || `unknown-${index}`;
            const taskText = task.task || 'No task text';
            const createdAt = task.createdAt || new Date().toISOString();
            
            li.innerHTML = `
                <div class="task-content">
                    <div class="task-text">${escapeHtml(taskText)}</div>
                    <div class="task-meta">
                        <span class="task-id">
                            <i class="fas fa-hashtag"></i> ${truncateId(taskId)}
                        </span>
                        <span class="task-date">
                            <i class="fas fa-calendar-alt"></i> ${formatDate(createdAt)}
                        </span>
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteTask('${taskId}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
            
            list.appendChild(li);
        });
        
        // Show task list and hide empty state
        if (list.style) list.style.display = "block";
        if (emptyState && emptyState.style) emptyState.style.display = "none";
        if (document.getElementById("taskCount")) {
            document.getElementById("taskCount").textContent = data.length.toString();
        }
        
        console.log(`Successfully displayed ${data.length} tasks`);
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        const list = document.getElementById("taskList");
        if (list) {
            list.innerHTML = `<li style="color: red; padding: 20px;">Error loading tasks: ${error.message}</li>`;
        }
    }
}


// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Add new task
async function addTask() {
    const taskInput = document.getElementById("bigTextBox");
    const task = taskInput.value.trim();
    
    if (!task) {
        showMessage("Please enter a task!", 'error');
        taskInput.focus();
        return;
    }
    
    // Disable button during request
    const addBtn = document.querySelector('.add-btn');
    const originalText = addBtn.innerHTML;
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    addBtn.disabled = true;
    
    try {
        console.log("Adding task:", task);
        
        const response = await fetch(API_URL + "/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ task: task })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Error response:", errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Task added successfully:", result);
        
        taskInput.value = "";
        showMessage("Task added successfully! 🎉");
        loadTasks();
        
    } catch (error) {
        console.error('Error adding task:', error);
        showMessage('Failed to add task. Please try again.', 'error');
    } finally {
        // Re-enable button
        addBtn.innerHTML = originalText;
        addBtn.disabled = false;
    }
}

async function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }
    
    console.log("=== DELETE TASK DEBUG ===");
    console.log("Task ID to delete:", taskId);
    console.log("API_URL:", API_URL);
    
    const deleteUrl = `${API_URL}/tasks/${taskId}`;
    console.log("Full delete URL:", deleteUrl);
    
    try {
        console.log("Sending DELETE request...");
        
        const response = await fetch(deleteUrl, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log("Response received:");
        console.log("- Status:", response.status);
        console.log("- Status Text:", response.statusText);
        
        const responseText = await response.text();
        console.log("- Response body:", responseText);
        
        if (!response.ok) {
            console.error("Request failed with status:", response.status);
            
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                errorMessage = responseText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        // Parse successful response
        let result = {};
        try {
            if (responseText) {
                result = JSON.parse(responseText);
            } else {
                result = { message: "Task deleted successfully" };
            }
        } catch (e) {
            result = { message: "Task deleted successfully" };
        }
        
        console.log("Delete successful:", result);
        showMessage("Task deleted successfully! 🗑️");
        
        // Reload tasks to reflect the change
        loadTasks();
        
    } catch (error) {
        console.error('=== DELETE ERROR ===');
        console.error('Error details:', error);
        showMessage(`Failed to delete task: ${error.message}`, 'error');
    
    }
}





// Allow Enter key to add task (Shift+Enter for new line)
document.addEventListener('DOMContentLoaded', function() {
    const taskInput = document.getElementById("bigTextBox");
    
    taskInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addTask();
        }
    });
    
    // Load tasks when page loads
    loadTasks();
});
