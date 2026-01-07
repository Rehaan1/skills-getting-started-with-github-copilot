document.addEventListener('DOMContentLoaded', () => {
  const activitiesList = document.getElementById('activities-list');
  const activitySelect = document.getElementById('activity');
  const signupForm = document.getElementById('signup-form');
  const messageDiv = document.getElementById('message');

  function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 4000);
  }

  async function loadActivities() {
    activitiesList.innerHTML = '<p>Loading activities...</p>';
    try {
      const res = await fetch('/activities');
      if (!res.ok) throw new Error('Failed to load activities');
      const data = await res.json();
      renderActivities(data);
      populateSelect(Object.keys(data));
    } catch (err) {
      activitiesList.innerHTML = '<p class="error">Could not load activities.</p>';
    }
  }

  function renderActivities(data) {
    activitiesList.innerHTML = '';
    for (const [name, info] of Object.entries(data)) {
      const card = document.createElement('div');
      card.className = 'activity-card';

      const title = document.createElement('h4');
      title.textContent = name;

      const desc = document.createElement('p');
      desc.textContent = info.description;

      const schedule = document.createElement('p');
      schedule.textContent = `Schedule: ${info.schedule}`;

      const cap = document.createElement('p');
      cap.textContent = `Capacity: ${info.participants.length} / ${info.max_participants}`;

      // participants section
      const participantsHeader = document.createElement('h5');
      participantsHeader.className = 'participants-header';
      participantsHeader.textContent = `Participants (${info.participants.length})`;

      const ul = document.createElement('ul');
      ul.className = 'participants-list';

      if (info.participants.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No participants yet';
        li.className = 'participant-item no-participants';
        ul.appendChild(li);
      } else {
        for (const p of info.participants) {
          const li = document.createElement('li');
          li.className = 'participant-item';
          li.textContent = p;
          ul.appendChild(li);
        }
      }

      card.append(title, desc, schedule, cap, participantsHeader, ul);
      activitiesList.appendChild(card);
    }
  }

  function populateSelect(names) {
    // keep the placeholder option with empty value and remove others
    activitySelect.querySelectorAll('option:not([value=""])').forEach(o => o.remove());
    for (const name of names) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);
    }
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const activity = activitySelect.value;
    if (!email || !activity) {
      showMessage('Please enter your email and select an activity.', 'error');
      return;
    }
    try {
      const res = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage(data.detail || data.message || 'Failed to sign up.', 'error');
        return;
      }
      showMessage(data.message || 'Signed up successfully!', 'success');
      // Refresh activities to ensure participants lists / counts are up to date
      await loadActivities();
      // clear email
      document.getElementById('email').value = '';
    } catch (err) {
      showMessage('An error occurred while signing up.', 'error');
    }
  });

  loadActivities();
});
