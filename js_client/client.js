// Client code adapted from screenshots: simple JWT login, verify/refresh, and product list
const contentContainer = document.getElementById('content-container') || document.getElementById('content');
const loginForm = document.getElementById('login-form');
const searchForm = document.getElementById('search-form');
const searchBoxContainer = document.getElementById('searchbox');
const hitsContainer = document.getElementById('hits');
const baseEndpoint = "http://localhost:8000/api";
const btnGetProducts = document.getElementById('btn-get-products');
const appID = "79526950DZ";
const apiKey = "1075fcded062a66ba9991cd9e98edef0";
const indexName = "cfe_Product";

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
                    // optionally refresh UI or retry previous request
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

function handleSearch(event){
    event.preventDefault();
    if(!searchForm) return;
    let formData = new FormData(searchForm);
    let data = Object.fromEntries(formData);
    let searchParams = new URLSearchParams(data);
    const endpoint = `${baseEndpoint}/search/?${searchParams}`;
    const options = getFetchOptions('GET', null);
    fetch(endpoint, options)
    .then(response => response.json())
    .then(data => {
        if(!isTokenNotValid(data) && contentContainer){
            contentContainer.innerHTML = "";
            if(data && data.hits){
                let htmlStr = "";
                for (let result of data.hits){
                    htmlStr += "<li>" + (result.title || result._source?.title || JSON.stringify(result)) + "</li>";
                }
                contentContainer.innerHTML = htmlStr;
                if(data.hits.length === 0){
                    contentContainer.innerHTML = "<p>No results found</p>";
                }
            } else {
                contentContainer.innerHTML = "<p>No results found</p>";
            }
        }
    })
    .catch(err => console.error('search error', err));
}

function initializeAlgoliaSearch(){
    const instantsearchLite = window["algoliasearch/lite"];
    if(!instantsearchLite || typeof instantsearch === 'undefined'){
        return;
    }
    if(!searchBoxContainer || !hitsContainer){
        return;
    }

    const searchClient = instantsearchLite.liteClient(appID, apiKey);

    const search = instantsearch({
        indexName,
        searchClient,
    });

    search.addWidgets([
        instantsearch.widgets.searchBox({
            container: "#searchbox",
        }),
        instantsearch.widgets.hits({
            container: "#hits",
            templates: {
                item: '<div>{{ title }}<p>${{ price }}</p></div>'
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

function getProductList(){
    const endpoint = `${baseEndpoint}/products/`;
    const options = getFetchOptions(null, null);
    fetch(endpoint, options)
    .then(response => response.json())
    .then(data => {
        writeToContainer(data);
    })
    .catch(err => { console.error('getProductList error', err); });
}

if(btnGetProducts){
    btnGetProducts.addEventListener('click', getProductList);

}

if(searchForm){
    searchForm.addEventListener('submit', handleSearch);
}

initializeAlgoliaSearch();
