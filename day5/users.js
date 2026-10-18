const loadButton = document.getElementById('load-users');
const filterInput = document.getElementById('filter-input');
const statusEl = document.getElementById('status');
const usersList = document.getElementById('users-list');

let users = [];

async function loadUsers() {
  loadButton.disabled = true;
  statusEl.textContent = 'Loading users...';
  usersList.innerHTML = '';

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    users = await response.json();
    statusEl.textContent = `Successfully loaded ${users.length} users.`;
    renderUsers(users);
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
    users = [];
  } finally {
    loadButton.disabled = false;
  }
}

function renderUsers(list) {
  usersList.innerHTML = '';

  if (list.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No users match your filter.';
    usersList.appendChild(li);
    return;
  }

  list.forEach(user => {
    const li = document.createElement('li');
    li.textContent = `${user.name} | ${user.email} | ${user.address.city} | ${user.company.name}`;
    usersList.appendChild(li);
  });
}

loadButton.addEventListener('click', loadUsers);

filterInput.addEventListener('input', () => {
  const query = filterInput.value.trim().toLowerCase();
  if (!query) {
    renderUsers(users);
    return;
  }
  const filtered = users.filter(user =>
    user.name.toLowerCase().includes(query)
  );
  renderUsers(filtered);
});
