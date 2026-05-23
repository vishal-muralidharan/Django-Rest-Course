const baseEndpoint = "http://localhost:8000/api";
const loginForm = document.getElementById('login-form');
const statusEl = document.getElementById('status');
const contentContainer = document.getElementById('content');
const btnGetProducts = document.getElementById('btn-get-products');

function setStatus(msg, isError=false){
    statusEl.textContent = msg;
    statusEl.style.color = isError ? 'crimson' : 'green';
}

function saveTokens(data){
    if(!data) return;
    localStorage.setItem('jwt_access', data.access);
    localStorage.setItem('jwt_refresh', data.refresh);
    // also keep the legacy keys for older code paths
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
}

// Backwards-compatible handler used by older promise-based codepaths
export function handleAuthData(authData, callback){
    if(!authData) return;
    saveTokens(authData);
    setStatus('Login successful');
    console.log('handleAuthData saved tokens (compatible keys)');
    if(callback && typeof callback === 'function'){
        try{ callback(); } catch(e){ console.warn('callback error', e); }
    }
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
    const loginFormEl = event.target;
    let loginFormData = new FormData(loginFormEl);
    let loginObjectData = Object.fromEntries(loginFormData);
    const bodyStr = JSON.stringify(loginObjectData);
    const endpoint = `${baseEndpoint}/token/`;
    const options = getFetchOptions('POST', loginObjectData);
    try{
        const res = await fetch(endpoint, options);
        console.log('Login response status:', res.status, res.statusText);
        console.log('Login response headers:');
        try{
            console.log('access-control-allow-origin:', res.headers.get('access-control-allow-origin'));
            console.log('content-type:', res.headers.get('content-type'));
        } catch(e){ console.log('header inspect error', e); }

        const data = await res.json().catch(() => null);
        console.log('Login response body:', data);

        if(res.ok && data && data.access){
            // store tokens and then fetch product list
            handleAuthData(data, getProductList);
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

// Utility: return consistent fetch options including Authorization and optional JSON body
function getFetchOptions(method = null, jsObject = null){
    return {
        method: method === null ? 'GET' : method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access') || localStorage.getItem('jwt_access')}`
        },
        body: jsObject ? JSON.stringify(jsObject) : null
    };
}

function writeToContainer(data){
    if(contentContainer){
        contentContainer.innerHTML = "<pre>" + JSON.stringify(data, null, 4) + "</pre>";
    }
}

function getProductList(){
    const endpoint = `${baseEndpoint}/products/`;
    const options = getFetchOptions();
    fetch(endpoint, options)
    .then(response => response.json())
    .then(data => {
        console.log('product list', data);
        writeToContainer(data);
    })
    .catch(err => {
        console.error('getProductList error', err);
        setStatus('Failed to load products', true);
    });
}

if(btnGetProducts){
    btnGetProducts.addEventListener('click', getProductList);
}

// optionally expose getProductList for debugging
export { getProductList };
