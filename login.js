document.addEventListener('DOMContentLoaded', async () => {
  // If user is already logged in, redirect to library
  const session = await Auth.getSession();
  if (session) {
    window.location.href = 'index.html';
    return;
  }

  const tabSignIn = document.getElementById('tab-signin');
  const tabSignUp = document.getElementById('tab-signup');
  const authForm = document.getElementById('auth-form');
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const submitBtn = document.getElementById('auth-submit-btn');
  const alertBox = document.getElementById('auth-alert');

  let mode = 'signin'; // 'signin' or 'signup'

  function setMode(newMode) {
    mode = newMode;
    alertBox.className = 'auth-alert';
    alertBox.textContent = '';

    if (mode === 'signin') {
      tabSignIn.classList.add('active');
      tabSignUp.classList.remove('active');
      submitBtn.textContent = 'Sign In';
      document.title = 'Sign In — KinoVibe';
    } else {
      tabSignUp.classList.add('active');
      tabSignIn.classList.remove('active');
      submitBtn.textContent = 'Create Account';
      document.title = 'Create Account — KinoVibe';
    }
  }

  tabSignIn.addEventListener('click', () => setMode('signin'));
  tabSignUp.addEventListener('click', () => setMode('signup'));

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    alertBox.className = 'auth-alert';
    alertBox.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      if (mode === 'signin') {
        const { data, error } = await Auth.signIn(email, password);
        if (error) throw error;
        window.location.href = 'index.html';
      } else {
        const { data, error } = await Auth.signUp(email, password);
        if (error) throw error;

        // If email confirmation is enabled or auto-logged in
        if (data.session) {
          window.location.href = 'index.html';
        } else {
          alertBox.className = 'auth-alert success';
          alertBox.textContent = 'Account created! Please check your email to confirm registration or sign in.';
          setMode('signin');
        }
      }
    } catch (err) {
      alertBox.className = 'auth-alert error';
      alertBox.textContent = err.message || 'Authentication failed.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
    }
  });
});
