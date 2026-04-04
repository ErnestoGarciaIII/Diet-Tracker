import { clearUser } from '../utils.js';
import { resetState } from '../state.js';

export function logout() {
    // clear frontend state
    clearUser();
    resetState();
    window.location.href = "{{ url_for('html_urls', filename='login.html') }}";
}