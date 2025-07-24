// --- Constants and Global State ---
const TASK_STATUS = {
    PENDING: "pending",
    IN_PROGRESS: "in-progress",
    COMPLETED: "completed"
};

const USER_STATUS = {
    AVAILABLE: "available",
    LOCKED: "locked"
};

// Global storage simulation (replacing localStorage)
let appData = {
    users: [], // Will store sample user/admin data, fetched from login.json
    tasks: [], // Will now store tasks fetched from tasks.json AND persisted in localStorage
    loggedInUser: null // This will now be primarily managed via sessionStorage
};

// --- Data Management (using sessionStorage for loggedInUser and localStorage for tasks and users) ---
async function initializeData() { // Made async to await fetch
    // Fetch users from login.json or load from localStorage
    try {
        const savedUsers = localStorage.getItem('users'); // Try to load from localStorage first
        if (savedUsers) {
            appData.users = JSON.parse(savedUsers);
        } else {
            const response = await fetch('login.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            appData.users = await response.json();
            // Initialize default status if not present
            appData.users.forEach(user => {
                if (!user.status) {
                    user.status = USER_STATUS.AVAILABLE;
                }
            });
            localStorage.setItem('users', JSON.stringify(appData.users)); // Save initial fetch to localStorage
        }
    } catch (error) {
        console.error('Error fetching login.json or loading users from localStorage:', error);
        // Fallback to hardcoded users if fetching fails or localStorage is corrupt
        appData.users = [
            { id: 'user_demo_123', username: 'user', password: 'userpass', role: 'user', email: 'user@example.com', name: 'Demo User', designation: 'Developer', status: USER_STATUS.AVAILABLE },
            { id: 'user_demo_456', username: 'user2', password: 'userpass2', role: 'user', email: 'user2@example.com', name: 'Another User', designation: 'Developer', status: USER_STATUS.AVAILABLE },
            { id: 'admin_demo_456', username: 'admin', password: 'adminpass', role: 'admin', email: 'admin@example.com', name: 'Admin User', designation: 'Administrator', status: USER_STATUS.AVAILABLE }
        ];
        localStorage.setItem('users', JSON.stringify(appData.users)); // Save fallback users
    }

    // Fetch tasks from tasks.json OR load from localStorage
    try {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            appData.tasks = JSON.parse(savedTasks);
        } else {
            const response = await fetch('tasks.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            appData.tasks = await response.json();
            localStorage.setItem('tasks', JSON.stringify(appData.tasks)); // Save initial fetch to localStorage
        }
    } catch (error) {
        console.error('Error fetching or loading tasks.json/localStorage:', error);
        appData.tasks = []; // Fallback to empty array if all fails
    }

    // Attempt to retrieve loggedInUser from sessionStorage on page load
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        appData.loggedInUser = JSON.parse(storedUser);
    } else {
        appData.loggedInUser = null; // Ensure it's null if nothing in sessionStorage
    }
}

function getUsers() {
    return appData.users;
}

function saveUsers(users) {
    appData.users = users;
    localStorage.setItem('users', JSON.stringify(appData.users)); // Persist users to localStorage
}

function getTasks() {
    return appData.tasks;
}

function saveTasks(tasks) {
    appData.tasks = tasks;
    localStorage.setItem('tasks', JSON.stringify(appData.tasks)); // Persist tasks to localStorage
}

function getLoggedInUser() {
    // Retrieve from sessionStorage directly to ensure persistence
    const storedUser = sessionStorage.getItem('loggedInUser');
    return storedUser ? JSON.parse(storedUser) : null;
}

function setLoggedInUser(user) {
    appData.loggedInUser = user; // Update in-memory appData for immediate use
    if (user) {
        sessionStorage.setItem('loggedInUser', JSON.stringify(user)); // Persist to sessionStorage
    } else {
        sessionStorage.removeItem('loggedInUser'); // Remove from sessionStorage on logout
    }
}

// --- Authentication ---
function logout() {
    setLoggedInUser(null); // Clear logged-in user from appData and sessionStorage
    window.location.href = 'login.html'; // Redirect to login page
}

function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const userRoleRadio = document.getElementById('userRole');
    const adminRoleRadio = document.getElementById('adminRole');
    const errorMessageDiv = document.getElementById('errorMessage');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const selectedRole = userRoleRadio.checked ? userRoleRadio.value : adminRoleRadio.checked ? adminRoleRadio.value : null;

    errorMessageDiv.textContent = ''; // Clear previous error messages
    errorMessageDiv.classList.remove('visible'); // Hide error styling

    if (!username || !password || !selectedRole) {
        errorMessageDiv.textContent = 'Please enter username, password, and select a role.';
        errorMessageDiv.classList.add('visible');
        return;
    }

    const foundUser = appData.users.find(user =>
        user.username === username &&
        user.password === password &&
        user.role === selectedRole
    );

    if (foundUser) {
        setLoggedInUser(foundUser); // This now saves to sessionStorage
        if (foundUser.role === 'user') {
            window.location.href = 'user-dashboard.html';
        } else if (foundUser.role === 'admin') {
            window.location.href = 'admin-dashboard.html'; // Assuming you have an admin-dashboard.html
        }
    } else {
        errorMessageDiv.textContent = 'Invalid username, password, or role.';
        errorMessageDiv.classList.add('visible'); // Show error message
    }
}

// --- UI Navigation & Page Management (for Dashboards) ---
function navigateTo(pageId) {
    document.querySelectorAll('.view').forEach(page => {
        page.classList.remove('active');
    });
    const targetView = document.getElementById(pageId);
    if (targetView) {
        targetView.classList.add('active');
    }

    // Update nav link active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const targetLink = document.querySelector(`[data-view="${pageId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
}

// --- UI Components & Helpers ---
function showModal(message, callback) {
    const modal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    if (!modal || !modalMessage || !confirmYes || !confirmNo) {
        console.error("Modal elements not found. Skipping modal display.");
        callback(false); // Assume no confirmation if modal elements are missing
        return;
    }

    modalMessage.textContent = message;
    modal.classList.remove('hidden');

    const yesListener = () => {
        callback(true);
        cleanup();
    };
    const noListener = () => {
        callback(false);
        cleanup();
    };

    confirmYes.addEventListener('click', yesListener);
    confirmNo.addEventListener('click', noListener);

    function cleanup() {
        modal.classList.add('hidden');
        confirmYes.removeEventListener('click', yesListener);
        confirmNo.removeEventListener('click', noListener);
    }
}

function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return 'N/A';
    if (seconds === 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s > 0 ? s + 's' : ''}`.trim();
}

function parseDuration(input) {
    input = input.trim().toLowerCase();
    const hoursMatch = input.match(/(\d+(?:\.\d+)?)\s*h/);
    const minutesMatch = input.match(/(\d+(?:\.\d+)?)\s*m/);
    const secondsMatch = input.match(/(\d+(?:\.\d+)?)\s*s/);
    let totalSeconds = 0;
    if (hoursMatch) totalSeconds += parseFloat(hoursMatch[1]) * 3600;
    if (minutesMatch) totalSeconds += parseFloat(minutesMatch[1]) * 60;
    if (secondsMatch) totalSeconds += parseFloat(secondsMatch[1]);
    return totalSeconds > 0 ? Math.floor(totalSeconds) : null;
}

function showStatus(message, type = "success") {
    const statusMessage = document.getElementById('statusMessage');
    if (!statusMessage) {
        console.warn("Status message element not found.");
        return;
    }
    const colors = {
        success: "var(--success)",
        error: "var(--error)",
        warning: "var(--warning)"
    };

    statusMessage.textContent = message;
    statusMessage.style.color = colors[type];
    statusMessage.style.backgroundColor = `${colors[type]}20`;
    statusMessage.style.borderLeft = `4px solid ${colors[type]}`;
    statusMessage.classList.add("visible");

    if (type !== "error") {
        setTimeout(() => statusMessage.classList.remove("visible"), 4000);
    }
}

// --- Task Management (for User Dashboard) ---
function renderUserTasks() {
    const tasksTableBody = document.getElementById('userTasksTableBody');
    if (!tasksTableBody) return;

    tasksTableBody.innerHTML = '';
    const loggedInUser = getLoggedInUser(); // Now correctly retrieves from sessionStorage
    if (!loggedInUser || loggedInUser.role !== 'user') {
        tasksTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">Please log in as a user to see your tasks.</td></tr>';
        return;
    }

    const userTasks = getTasks().filter(task => task.createdBy === loggedInUser.id);

    if (userTasks.length === 0) {
        tasksTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No tasks yet. Click "Add Task" to create one! 🚀</td></tr>';
        return;
    }

    userTasks.forEach(task => {
        const row = tasksTableBody.insertRow();
        const taskTypeColor = getTaskTypeColor(task.type);
        row.innerHTML = `
            <td><span class="task-title">${escapeHtml(task.title)}</span></td>
            <td>${escapeHtml(task.description)}</td>
            <td><span class="task-type-badge" style="background-color: ${taskTypeColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${escapeHtml(task.type || 'N/A')}</span></td>
            <td>${formatTime(task.duration)}</td>
            <td>${formatTime(task.remaining)}</td>
            <td>${escapeHtml(task.pairProgrammer || 'N/A')}</td>
            <td><span class="status-badge ${task.status}">${task.status.replace('-', ' ')}</span></td>
            <td>
                ${task.status !== TASK_STATUS.COMPLETED ?
                `<button class="action-btn complete-btn" onclick="markTaskComplete('${task.id}')">
                    Complete
                </button>` :
                '<span style="color: #10b981; font-weight: 500;">✓ Done</span>'
                }
            </td>
        `;
    });
}

function getTaskTypeColor(taskType) {
    switch(taskType) {
        case 'task':
            return '#3b82f6'; // Bright blue
        case 'story':
            return '#10b981'; // Green
        case 'bug':
            return '#ef4444'; // Red
        default:
            return '#6b7280'; // Gray for unknown types
    }
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function submitNewTask(event) {
    event.preventDefault();
    const taskTitle = document.getElementById('taskTitle').value.trim();
    const taskDurationInput = document.getElementById('taskDuration').value.trim();
    const taskDescription = document.getElementById('taskDescription').value.trim();
    const pairProgrammerId = document.getElementById('pairProgrammer').value; // Get selected paired programmer ID
    const taskType = document.getElementById('taskType').value; // Get selected task type

    if (!taskTitle || !taskDurationInput || !taskDescription || !pairProgrammerId || !taskType) {
        showStatus('Please fill in all fields.', 'error');
        return;
    }

    if (taskDescription.length < 10) {
        showStatus('Task description must be at least 10 characters long.', 'error');
        return;
    }

    const durationSeconds = parseDuration(taskDurationInput);
    if (durationSeconds === null) {
        showStatus("Invalid duration format. Use 'h' for hours, 'm' for minutes, 's' for seconds (e.g., '1h 30m', '90s').", 'warning');
        return;
    }

    const loggedInUser = getLoggedInUser();
    if (!loggedInUser || loggedInUser.role !== 'user') {
        showStatus('You must be logged in as a user to create tasks.', 'error');
        return;
    }

    let allTasks = getTasks();

    const newTask = {
        id: `task_${Date.now()}`,
        title: taskTitle,
        description: taskDescription,
        duration: durationSeconds,
        remaining: durationSeconds,
        status: TASK_STATUS.PENDING,
        createdBy: loggedInUser.id,
        pairProgrammer: pairProgrammerId, // Store the ID of the paired programmer
        type: taskType, // Store the task type
        createdAt: new Date().toISOString()
    };

    allTasks.push(newTask);
    saveTasks(allTasks);

    // Update status of logged-in user and paired programmer to 'locked'
    let allUsers = getUsers();
    const creatorUserIndex = allUsers.findIndex(user => user.id === loggedInUser.id);
    if (creatorUserIndex !== -1) {
        allUsers[creatorUserIndex].status = USER_STATUS.LOCKED;
        // Update the loggedInUser in sessionStorage as well if its status changes
        setLoggedInUser(allUsers[creatorUserIndex]);
    }

    const pairedUserIndex = allUsers.findIndex(user => user.id === pairProgrammerId);
    if (pairedUserIndex !== -1) {
        allUsers[pairedUserIndex].status = USER_STATUS.LOCKED;
    }
    saveUsers(allUsers); // Save updated user statuses

    document.getElementById('submitTaskForm').reset();
    populatePairProgrammers(); // Re-populate to reset selection
    navigateTo('view-tasks');
    renderUserTasks();
    showStatus('Task added successfully!', 'success');
}

function markTaskComplete(taskId) {
    showModal('Are you sure you want to mark this task as completed?', (confirmed) => {
        if (confirmed) {
            let allTasks = getTasks();
            const taskIndex = allTasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                const completedTask = allTasks[taskIndex];
                allTasks[taskIndex].status = TASK_STATUS.COMPLETED;
                allTasks[taskIndex].remaining = 0;
                saveTasks(allTasks);

                // Update status of task creator and paired programmer to 'available'
                let allUsers = getUsers();
                const creatorUserIndex = allUsers.findIndex(user => user.id === completedTask.createdBy);
                if (creatorUserIndex !== -1) {
                    allUsers[creatorUserIndex].status = USER_STATUS.AVAILABLE;
                    // If the logged-in user just completed a task, update their session status too
                    if (getLoggedInUser() && getLoggedInUser().id === allUsers[creatorUserIndex].id) {
                        setLoggedInUser(allUsers[creatorUserIndex]);
                    }
                }

                const pairedUserIndex = allUsers.findIndex(user => user.id === completedTask.pairProgrammer);
                if (pairedUserIndex !== -1) {
                    allUsers[pairedUserIndex].status = USER_STATUS.AVAILABLE;
                }
                saveUsers(allUsers); // Save updated user statuses

                renderUserTasks();
                // Re-render team view if active to reflect status changes immediately
                if (document.getElementById('view-team') && document.getElementById('view-team').classList.contains('active')) {
                    renderDevelopmentTeam();
                }
                showStatus('Task marked as completed!', 'success');
            }
        }
    });
}

function updateUserTaskTimers() {
    const loggedInUser = getLoggedInUser();
    // Only update timers if a user is logged in and on a dashboard
    if (!loggedInUser || !document.body.classList.contains('user-dashboard-page')) {
        return;
    }

    let allTasks = getTasks();
    let tasksUpdated = false;

    allTasks.forEach(task => {
        if (task.createdBy === loggedInUser.id) { // Only affect current logged-in user's tasks
            if (task.status === TASK_STATUS.PENDING) {
                task.status = TASK_STATUS.IN_PROGRESS;
                tasksUpdated = true;
            }

            if (task.status === TASK_STATUS.IN_PROGRESS) {
                if (task.remaining > 0) {
                    task.remaining -= 1;
                    tasksUpdated = true;
                } else if (task.remaining <= 0 && task.status !== TASK_STATUS.COMPLETED) {
                    task.status = TASK_STATUS.COMPLETED;
                    tasksUpdated = true;
                }
            }
        }
    });

    if (tasksUpdated) {
        saveTasks(allTasks); // This now saves to localStorage as well
        if (document.getElementById('view-tasks') && document.getElementById('view-tasks').classList.contains('active')) {
            renderUserTasks();
        }
    }
}

// Function to populate the pair programmer dropdown
function populatePairProgrammers() {
    const pairProgrammerSelect = document.getElementById('pairProgrammer');
    if (!pairProgrammerSelect) return;

    // Clear existing options, but keep the default "Select Pair Programmer"
    pairProgrammerSelect.innerHTML = '<option value="">Select Pair Programmer</option>';

    const users = getUsers();
    // Filter to only show 'user' role for pairing
    users.filter(user => user.role === 'user').forEach(user => { // Removed the 'user.status === USER_STATUS.AVAILABLE' filter
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name || user.username; // Use name if available, otherwise username
        // Optionally, you could add a visual cue if a user is 'locked' here
        if (user.status === USER_STATUS.LOCKED) {
            option.textContent += ' (Locked)';
            // option.disabled = true; // You could disable it if you want to prevent selection
        }
        pairProgrammerSelect.appendChild(option);
    });
}

// Function to render the development team
function renderDevelopmentTeam() {
    const developerTableBody = document.getElementById('developerTableBody');
    if (!developerTableBody) return;

    developerTableBody.innerHTML = '';
    const users = getUsers();
    const developers = users.filter(user => user.role === 'user'); // Assuming 'user' role are your developers

    if (developers.length === 0) {
        developerTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px;">No developers found.</td></tr>';
        return;
    }

    developers.forEach(developer => {
        const row = developerTableBody.insertRow();
        row.innerHTML = `
            <td>${escapeHtml(developer.name || developer.username)}</td>
            <td><span class="badge ${developer.designation ? developer.designation.toLowerCase().replace(/\s/g, '-') : 'developer'}">${escapeHtml(developer.designation || 'Developer')}</span></td>
            <td><span class="occupancy ${developer.status.toLowerCase()}">${escapeHtml(developer.status)}</span></td>
        `;
    });
}

// --- Profile Management ---
  function renderUserProfile() {
    const loggedInUser = getLoggedInUser(); // Now correctly retrieves from sessionStorage
    if (loggedInUser) {
        // Update profile info with new HTML IDs
        document.getElementById('UserProfileUsername').textContent = loggedInUser.username || 'N/A';
        document.getElementById('UserProfileEmail').textContent = loggedInUser.email || 'N/A';
        document.getElementById('UserProfileName').textContent = loggedInUser.name || 'N/A';
        document.getElementById('UserProfileDesignation').textContent = loggedInUser.designation || 'N/A';
        document.getElementById('UserProfileStatus').textContent = loggedInUser.status || 'Active';


        // Optionally update hidden or new HTML IDs for task stats if you add them
        // Example:
        // document.getElementById('UserTaskTotal').textContent = total;

    } else {
        document.getElementById('UserProfileUsername').textContent = 'Not logged in';
        document.getElementById('UserProfileEmail').textContent = 'N/A';
        document.getElementById('UserProfileName').textContent = 'N/A';
        document.getElementById('UserProfileDesignation').textContent = 'N/A';
        document.getElementById('UserProfileStatus').textContent = 'N/A';
    }
}



// --- Page Initialization ---
document.addEventListener('DOMContentLoaded', async () => { // Made async to await initializeData
    await initializeData(); // Initialize global appData and try to load loggedInUser from sessionStorage

    // Check if on login page
    if (document.body.classList.contains('login-page')) {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            // Ensure error message is hidden by default
            const errorMessageDiv = document.getElementById('errorMessage');
            if (errorMessageDiv) {
                errorMessageDiv.classList.remove('visible');
                errorMessageDiv.textContent = ''; // Clear any previous content
            }
        }
    } else {
        // For dashboard pages
        const loggedInUser = getLoggedInUser(); // Retrieve loggedInUser for dashboard initialization
        if (!loggedInUser) {
            // If no user is logged in, redirect to login page (basic security for demo)
            window.location.href = 'login.html';
            return;
        }

        // Initialize UI based on user role (assuming user-dashboard.html and admin-dashboard.html exist)
        if (loggedInUser.role === 'user') {
            document.body.classList.add('user-dashboard-page');
            populatePairProgrammers(); // Populate dropdown on load
            renderUserTasks();
            setInterval(updateUserTaskTimers, 1000); // Start timer updates for user tasks

            // Event Listeners for user dashboard navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                if (link.id !== 'logoutBtn') {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const viewId = link.dataset.view;
                        if (viewId) {
                            navigateTo(viewId);
                            if (viewId === 'view-profile') {
                                renderUserProfile(); // Call render function for profile
                            } else if (viewId === 'view-add-task') {
                                populatePairProgrammers(); // Re-populate dropdown when Add Task view is active
                            } else if (viewId === 'view-team') { // Add this block
                                renderDevelopmentTeam(); // Call render function for development team
                            }
                        }
                    });
                }
            });

            // User dashboard form and button event listeners
            const submitTaskForm = document.getElementById('submitTaskForm');
            if (submitTaskForm) {
                submitTaskForm.addEventListener('submit', submitNewTask);
            }
        } else if (loggedInUser.role === 'admin') {
            document.body.classList.add('admin-dashboard-page');
            console.log("Admin logged in. Admin dashboard setup should be handled or redirected.");
            // Admin dashboard specific event listeners might go here if using a shared script.js
            // The logout button listener for admin dashboard
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener("click", e => {
                    e.preventDefault();
                    logout();
                });
            }
        }

        // Attach logout button listener for user dashboard (if not already handled in admin block)
        // This ensures logout works regardless of which dashboard is loaded.
        if (loggedInUser.role === 'user') { // Only attach if it's the user dashboard page
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener("click", e => {
                    e.preventDefault();
                    logout();
                });
            }
        }
    }
});