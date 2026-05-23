// Client code adapted from screenshots: simple JWT login, verify/refresh, and product list
const contentContainer = document.getElementById('content-container') || document.getElementById('content');
const loginForm = document.getElementById('login-form');
const searchBoxContainer = document.getElementById('searchbox');
const userListContainer = document.getElementById('user-list');
const publicListContainer = document.getElementById('public-list');
const hitsContainer = document.getElementById('hits');
const baseEndpoint = "http://localhost:8000/api";
const appID = "79526950DZ";
const apiKey = "1075fcded062a66ba9991cd9e98edef0";
const indexName = "Product";

function handleAuthData(authData, callback){
    if(!authData) return;
    try{
        localStorage.setItem('access', authData.access);
        if(authData.refresh) localStorage.setItem('refresh', authData.refresh);
    }catch(e){ console.warn('localStorage set error', e); }
    if(typeof callback === 'function'){
        try{ callback(); }catch(e){ console.warn('callback error', e); }
    }
}

function handleLogin(event){
    event.preventDefault();
    const loginEndpoint = `${baseEndpoint}/token/`;
    let loginFormData = new FormData(loginForm);
    let loginObjectData = Object.fromEntries(loginFormData);
    let bodyStr = JSON.stringify(loginObjectData);      
    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyStr
    };
    fetch(loginEndpoint, options)
    .then(response => { return response.json() })
    .then(authData => {
        handleAuthData(authData, getProductList);
    })
    .catch(err => { console.log('err', err) });
}

if(loginForm){
    loginForm.addEventListener('submit', handleLogin);
}

function validateJWTToken(){
    const endpoint = `${baseEndpoint}/token/verify/`;
    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: localStorage.getItem('access') })
    };
    fetch(endpoint, options)
    .then(response => response.json())
    .then(x => {
        if(isTokenNotValid(x)){
            // run a refresh token fetch
            const refreshEndpoint = `${baseEndpoint}/token/refresh/`;
            const refreshOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh: localStorage.getItem('refresh') })
            };
            fetch(refreshEndpoint, refreshOptions)
            .then(r => r.json())
            .then(data => {
                if(data && data.access){
                    localStorage.setItem('access', data.access);
                    getProductList();
                }
            })
            .catch(err => console.warn('refresh error', err));
        } else {
            return true;
        }
    })
    .catch(err => console.warn('validate token error', err));
}

function getFetchOptions(method, body){
    return {
        method: method === null ? "GET" : method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('access')}`
        },
        body: body ? body : null
    };
}

function isTokenNotValid(jsonData){
    if(jsonData && jsonData.code === "token_not_valid"){
        return true;
    }
    return false;
}

function initializeAlgoliaSearch(){
    const algoliaLite = window["algoliasearch/lite"] || window.algoliasearch || window["algoliasearch"];
    if(!algoliaLite || typeof instantsearch === 'undefined'){
        return;
    }
    if(!searchBoxContainer || !hitsContainer){
        return;
    }

    const algoliasearch = typeof algoliaLite.liteClient === 'function' ? algoliaLite.liteClient : algoliaLite;
    if(typeof algoliasearch !== 'function'){
        return;
    }

    const searchClient = algoliasearch(appID, apiKey);

    const search = instantsearch({
        indexName,
        searchClient,
    });

    search.addWidgets([
        instantsearch.widgets.searchBox({
            container: "#searchbox",
        }),
        instantsearch.widgets.clearRefinements({
            container: "#clear-refinements"
        }),
        instantsearch.widgets.refinementList({
            container: "#user-list",
            attribute: "user"
        }),
        instantsearch.widgets.refinementList({
            container: "#public-list",
            attribute: "public"
        }),
        instantsearch.widgets.hits({
            container: "#hits",
            templates: {
                item: '<div>' +
                    '<div>{{#helpers.highlight}}{"attribute":"title"}{{/helpers.highlight}}</div>' +
                    '<div>{{#helpers.highlight}}{"attribute":"body"}{{/helpers.highlight}}</div>' +
                    '<p>{{ user }}</p><p>${{ price }}</p>' +
                '</div>'
            },
        }),
    ]);

    search.start();
}

function writeToContainer(data){
    if(contentContainer){
        contentContainer.innerHTML = "<pre>" + JSON.stringify(data, null, 4) + "</pre>";
    }
}

initializeAlgoliaSearch();
