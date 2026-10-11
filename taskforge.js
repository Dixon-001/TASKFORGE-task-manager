const toggleBtn = document.getElementById('theme-toggle');
const body = document.body;

// Apply saved theme on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  body.classList.add(savedTheme);
}

// Toggle theme on click
toggleBtn.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  
  // Update localStorage
  if (body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark-mode');
    toggleBtn.textContent = 'Switch to Light Mode';
  } else {
    localStorage.removeItem('theme'); // Or set to 'light'
    toggleBtn.textContent = 'Switch to Dark Mode';
  }
});   

// modal 
document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.getElementById('my-dialog');
  document.getElementById('open-btn').addEventListener('click', () => dialog.showModal());
  document.getElementById('close-btn').addEventListener('click', () => dialog.close());
});      
