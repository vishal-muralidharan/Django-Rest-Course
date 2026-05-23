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

// Backwards-compatible handler used by older promise-based codepaths
export function handleAuthData(authData){
    if(!authData) return;
    // store both the new keys and the original simple keys used elsewhere
    localStorage.setItem('jwt_access', authData.access);
    localStorage.setItem('jwt_refresh', authData.refresh);
    localStorage.setItem('access', authData.access);
    localStorage.setItem('refresh', authData.refresh);
    setStatus('Login successful');
    console.log('handleAuthData saved tokens (compatible keys)');
}

function getAccess(){
    return localStorage.getItem('jwt_access');
}

function getRefresh(){
    return localStorage.getItem('jwt_refresh');
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
    const endpoint = `${baseEndpoint}/products/`;
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
    };
    try{
        const res = await fetch(endpoint, options);
        console.log('Login response status:', res.status, res.statusText);
        console.log('Login response headers:');
        try{
            // show a few headers that help debug CORS and auth
            console.log('access-control-allow-origin:', res.headers.get('access-control-allow-origin'));
            console.log('content-type:', res.headers.get('content-type'));
        } catch(e){ console.log('header inspect error', e); }

        const data = await res.json().catch(() => null);
        console.log('Login response body:', data);

        if(res.ok && data && data.access){
            saveTokens(data);
            // also save compatible keys for older code
            handleAuthData(data);
            console.log('Saved tokens. Access length:', (data.access || '').length);
        } else if(res.status === 401){
            setStatus('Not authenticated (401): check credentials or CORS', true);
            console.warn('401 - authentication failed', data);
        } else {
            setStatus(data?.detail || JSON.stringify(data) || 'Unexpected response', true);
            console.warn('Login unexpected response', res.status, data);
        }
    } catch(err){
        setStatus(err.message || 'Network error', true);
        console.error('Login error', err);
    }
}

if(loginForm){
    loginForm.addEventListener('submit', handleLogin);
}

// helper to call an authenticated endpoint, returns parsed json or throws
async function performRefresh(){
    const refresh = getRefresh();
    if(!refresh){
        console.warn('No refresh token available');
        return false;
    }
    const endpoint = `${baseEndpoint}/token/refresh/`;
    try{
        const r = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh })
        });
        console.log('Refresh response status:', r.status);
        const data = await r.json().catch(() => null);
        console.log('Refresh response body:', data);
        if(r.ok && data && data.access){
            // preserve existing refresh token, update access
            saveTokens({ access: data.access, refresh });
            return true;
        }
    } catch(err){
        console.error('Refresh failed', err);
    }
    return false;
}

export async function authFetch(path, opts={}){
    const url = path.startsWith('http') ? path : `${baseEndpoint}${path}`;
    const headers = Object.assign({}, opts.headers || {}, getAuthHeaders(), { 'Content-Type': 'application/json' });
    const finalOpts = Object.assign({}, opts, { headers });

    let r = await fetch(url, finalOpts);
    console.log('authFetch initial status for', url, r.status);
    if(r.status === 401){
        console.warn('401 received, attempting refresh');
        const refreshed = await performRefresh();
        if(refreshed){
            // retry once with new access token
            const retryHeaders = Object.assign({}, opts.headers || {}, getAuthHeaders(), { 'Content-Type': 'application/json' });
            const retryOpts = Object.assign({}, opts, { headers: retryHeaders });
            r = await fetch(url, retryOpts);
            console.log('authFetch retry status for', url, r.status);
        } else {
            throw new Error('Unauthorized - refresh failed or no refresh token');
        }
    }

    if(!r.ok){
        // attempt to extract body for debugging
        let body = null;
        try{ body = await r.json(); } catch(e){ body = await r.text().catch(()=>null); }
        const err = new Error('Request failed: ' + r.status);
        err.status = r.status;
        err.body = body;
        console.error('authFetch error', err);
        throw err;
    }

    return r.json();
}
