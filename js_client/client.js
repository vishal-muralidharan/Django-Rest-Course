const baseEndpoint = "http://localhost:8000/api";
const loginForm = document.getElementById('login-form');
const statusEl = document.getElementById('status');

function setStatus(msg, isError=false){
    statusEl.textContent = msg;
    statusEl.style.color = isError ? 'crimson' : 'green';
}

function saveTokens(data){
    localStorage.setItem('jwt_access', data.access);
    localStorage.setItem('jwt_refresh', data.refresh);
}

function getAccess(){
    return localStorage.getItem('jwt_access');
}

function getAuthHeaders(){
    const token = getAccess();
    if(!token) return {};
    return { 'Authorization': `Bearer ${token}` };
}

async function handleLogin(event){
    event.preventDefault();
    const loginForm = event.target;
    let loginFormData = new FormData(loginForm);
    let loginObjectData = Object.fromEntries(loginFormData);
    let bodyStr = JSON.stringify(loginObjectData);
    const endpoint = `${baseEndpoint}/token/`;
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
    };
    try{
        const res = await fetch(endpoint, options);
        const data = await res.json();
        if(res.ok && data.access){
            saveTokens(data);
            setStatus('Login successful');
        } else {
            setStatus(data.detail || JSON.stringify(data), true);
        }
    } catch(err){
        setStatus(err.message || 'Network error', true);
    }
}

if(loginForm){
    loginForm.addEventListener('submit', handleLogin);
}

// helper to call an authenticated endpoint, returns parsed json or throws
export async function authFetch(path, opts={}){
    const url = path.startsWith('http') ? path : `${baseEndpoint}${path}`;
    const headers = Object.assign({}, opts.headers || {}, getAuthHeaders(), { 'Content-Type': 'application/json' });
    const finalOpts = Object.assign({}, opts, { headers });
    const r = await fetch(url, finalOpts);
    if(r.status === 401){
        throw new Error('Unauthorized - token may be expired');
    }
    return r.json();
}
